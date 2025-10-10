"""
Discogs API Client for WaxValue

This module provides a proper interface to the Discogs API with:
- OAuth 1.0a authentication
- Rate limiting with exponential backoff
- Proper User-Agent headers
- Error handling for API responses
"""

import time
import requests
import requests_oauthlib
from typing import Dict, List, Optional, Any
from urllib.parse import urlencode
import logging
import json
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class TokenBucketRateLimiter:
    """
    Token bucket rate limiter for Discogs API calls
    Based on the Stack Overflow rate limiting patterns
    """
    
    def __init__(self, capacity: int = 60, refill_rate: float = 1.0, 
                 bucket_file: str = "discogs_rate_limit.json"):
        """
        Initialize token bucket rate limiter
        
        Args:
            capacity: Maximum number of tokens (requests) allowed
            refill_rate: Tokens added per second
            bucket_file: File to persist bucket state
        """
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.bucket_file = bucket_file
        self.tokens = capacity
        self.last_refill = time.time()
        self._load_state()
    
    def _load_state(self):
        """Load bucket state from file if it exists"""
        try:
            if os.path.exists(self.bucket_file):
                with open(self.bucket_file, 'r') as f:
                    data = json.load(f)
                    self.tokens = data.get('tokens', self.capacity)
                    self.last_refill = data.get('last_refill', time.time())
                    logger.debug(f"Loaded rate limiter state: {self.tokens} tokens")
        except Exception as e:
            logger.warning(f"Failed to load rate limiter state: {e}")
            self.tokens = self.capacity
            self.last_refill = time.time()
    
    def _save_state(self):
        """Save bucket state to file"""
        try:
            data = {
                'tokens': self.tokens,
                'last_refill': self.last_refill
            }
            with open(self.bucket_file, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            logger.warning(f"Failed to save rate limiter state: {e}")
    
    def _refill_tokens(self):
        """Refill tokens based on elapsed time"""
        now = time.time()
        elapsed = now - self.last_refill
        tokens_to_add = elapsed * self.refill_rate
        
        if tokens_to_add > 0:
            self.tokens = min(self.capacity, self.tokens + tokens_to_add)
            self.last_refill = now
            self._save_state()
    
    def acquire_token(self, timeout: float = 60.0) -> bool:
        """
        Try to acquire a token (make a request)
        
        Args:
            timeout: Maximum time to wait for a token
            
        Returns:
            True if token acquired, False if timeout
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            self._refill_tokens()
            
            if self.tokens >= 1:
                self.tokens -= 1
                self._save_state()
                logger.debug(f"Token acquired. Remaining: {self.tokens}")
                return True
            
            # Wait a bit before checking again
            time.sleep(0.1)
        
        logger.warning("Rate limiter timeout - no tokens available")
        return False
    
    def wait_for_token(self, timeout: float = 60.0):
        """
        Wait for a token to become available
        
        Args:
            timeout: Maximum time to wait
            
        Raises:
            DiscogsRateLimitError: If timeout exceeded
        """
        if not self.acquire_token(timeout):
            raise DiscogsRateLimitError(f"Rate limit exceeded. No tokens available within {timeout} seconds")

class DiscogsRateLimitError(Exception):
    """Raised when Discogs API rate limit is exceeded"""
    pass

class DiscogsAuthError(Exception):
    """Raised when Discogs API authentication fails"""
    pass

class DiscogsAPIError(Exception):
    """Raised for general Discogs API errors"""
    pass

class DiscogsClient:
    """
    Discogs API client with proper authentication and rate limiting
    """
    
    BASE_URL = "https://api.discogs.com"
    USER_AGENT = "WaxValue/1.0 +https://waxvalue.com"
    
    def __init__(self, consumer_key: str, consumer_secret: str, 
                 access_token: str = None, access_token_secret: str = None):
        """
        Initialize Discogs API client
        
        Args:
            consumer_key: Discogs application consumer key
            consumer_secret: Discogs application consumer secret
            access_token: OAuth access token (for authenticated requests)
            access_token_secret: OAuth access token secret (for authenticated requests)
        """
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.access_token = access_token
        self.access_token_secret = access_token_secret
        
        # Rate limiting with token bucket
        self.rate_limiter = TokenBucketRateLimiter(
            capacity=60,  # 60 requests per minute
            refill_rate=1.0,  # 1 request per second
            bucket_file="discogs_rate_limit.json"
        )
        
        # Setup OAuth session
        self._setup_oauth_session()
    
    def _setup_oauth_session(self):
        """Setup OAuth session for authenticated requests"""
        if self.access_token and self.access_token_secret:
            self.session = requests_oauthlib.OAuth1Session(
                self.consumer_key,
                client_secret=self.consumer_secret,
                resource_owner_key=self.access_token,
                resource_owner_secret=self.access_token_secret,
                signature_method='HMAC-SHA1'
            )
        else:
            self.session = requests_oauthlib.OAuth1Session(
                self.consumer_key,
                client_secret=self.consumer_secret,
                signature_method='HMAC-SHA1'
            )
        
        self.session.headers.update({
            'User-Agent': self.USER_AGENT
        })
    
    def _handle_rate_limit(self):
        """Handle rate limiting using token bucket algorithm"""
        try:
            self.rate_limiter.wait_for_token(timeout=60.0)
        except DiscogsRateLimitError as e:
            logger.error(f"Rate limit exceeded: {e}")
            raise
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make authenticated request to Discogs API with rate limiting and error handling
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (without base URL)
            **kwargs: Additional arguments for requests
            
        Returns:
            JSON response data
            
        Raises:
            DiscogsRateLimitError: When rate limit is exceeded
            DiscogsAuthError: When authentication fails
            DiscogsAPIError: For other API errors
        """
        self._handle_rate_limit()
        
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            
            # Handle rate limiting
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                logger.warning(f"Rate limit exceeded. Waiting {retry_after} seconds")
                time.sleep(retry_after)
                # Retry the request
                response = self.session.request(method, url, **kwargs)
            
            # Handle authentication errors
            if response.status_code == 401:
                raise DiscogsAuthError("Authentication failed. Check your tokens.")
            
            # Handle method not allowed (often authentication issue)
            if response.status_code == 405:
                raise DiscogsAuthError("Method not allowed. Check authentication and User-Agent.")
            
            # Handle other errors
            if not response.ok:
                error_msg = f"API request failed: {response.status_code} - {response.text}"
                logger.error(error_msg)
                raise DiscogsAPIError(error_msg)
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            raise DiscogsAPIError(f"Request failed: {e}")
    
    def get_user_inventory(self, username: str, page: int = 1, per_page: int = 100) -> Dict[str, Any]:
        """
        Get user's inventory listings
        
        Args:
            username: Discogs username
            page: Page number (1-based)
            per_page: Items per page (max 100)
            
        Returns:
            Inventory data with listings (all statuses - filtering happens client-side)
        """
        endpoint = f"/users/{username}/inventory"
        params = {
            'page': page,
            'per_page': min(per_page, 100)
        }
        
        return self._make_request('GET', endpoint, params=params)
    
    def get_price_suggestions(self, release_id: int) -> Dict[str, Any]:
        """
        Get Discogs' official price suggestions for a release by condition
        
        This is Discogs' recommended pricing based on their market analysis.
        Returns pricing for each condition grade (Mint, Near Mint, Very Good Plus, etc.)
        
        Args:
            release_id: Discogs release ID
            
        Returns:
            Price suggestions data with condition-based pricing
            Example: {
                "Mint": {"value": 45.00, "currency": "USD"},
                "Near Mint": {"value": 35.00, "currency": "USD"},
                "Very Good Plus": {"value": 25.00, "currency": "USD"},
                "Very Good": {"value": 18.00, "currency": "USD"},
                "Good Plus": {"value": 12.00, "currency": "USD"},
                "Good": {"value": 8.00, "currency": "USD"},
                "Fair": {"value": 5.00, "currency": "USD"},
                "Poor": {"value": 2.00, "currency": "USD"}
            }
        """
        endpoint = f"/marketplace/price_suggestions/{release_id}"
        return self._make_request('GET', endpoint)
    
    def get_marketplace_stats(self, release_id: int) -> Dict[str, Any]:
        """
        Get marketplace statistics for a release
        
        Args:
            release_id: Discogs release ID
            
        Returns:
            Marketplace stats data
        """
        endpoint = f"/marketplace/stats/{release_id}"
        return self._make_request('GET', endpoint)
    
    def update_listing_price(self, listing_id: int, price: float, 
                           currency: str = None, status: str = None) -> tuple[int, Dict[str, Any]]:
        """
        Update a listing's price and optionally other fields with retry logic
        
        This method fetches the current listing data first, then updates it with the new price
        while preserving all required fields (release_id, condition, etc.)
        
        Args:
            listing_id: Listing ID to update
            price: New price
            currency: Currency code (optional, will use existing if not provided)
            status: New status (optional, will use existing if not provided)
            
        Returns:
            Tuple of (http_status_code, response_metadata)
        """
        max_retries = 3
        attempt = 0
        
        while True:
            try:
                # First, fetch the current listing data to get all required fields
                logger.info(f"Fetching current listing data for listing {listing_id}")
                current_listing = self.get_listing(listing_id)
                
                # Build the update data with all required fields
                endpoint = f"/marketplace/listings/{listing_id}"
                
                # Extract required fields from current listing
                data = {
                    'release_id': current_listing.get('release', {}).get('id'),
                    'condition': current_listing.get('condition'),
                    'price': price,
                    'status': status or current_listing.get('status', 'For Sale'),
                    'currency': currency or current_listing.get('original_price', {}).get('curr_abbr', 'USD')
                }
                
                # Add optional fields if they exist in the current listing
                if current_listing.get('sleeve_condition'):
                    data['sleeve_condition'] = current_listing.get('sleeve_condition')
                if current_listing.get('comments'):
                    data['comments'] = current_listing.get('comments')
                if current_listing.get('allow_offers') is not None:
                    data['allow_offers'] = current_listing.get('allow_offers')
                if current_listing.get('external_id'):
                    data['external_id'] = current_listing.get('external_id')
                if current_listing.get('location'):
                    data['location'] = current_listing.get('location')
                if current_listing.get('weight'):
                    data['weight'] = current_listing.get('weight')
                if current_listing.get('format_quantity'):
                    data['format_quantity'] = current_listing.get('format_quantity')
                
                logger.info(f"Updating listing {listing_id} with data: {data}")
                
                # Make the POST request to update the listing (Discogs uses POST for edits)
                self._handle_rate_limit()  # Respect rate limiting
                
                # Try to get the listing first to ensure it exists
                try:
                    test_listing = self.session.get(f"{self.BASE_URL}{endpoint}")
                    logger.info(f"Test GET listing response: {test_listing.status_code}")
                except Exception as test_error:
                    logger.error(f"Could not fetch listing for testing: {test_error}")
                
                response = self.session.post(f"{self.BASE_URL}{endpoint}", json=data)
                
                # Extract rate limit headers
                rl_remaining = response.headers.get("X-Discogs-Ratelimit-Remaining")
                rl_reset = response.headers.get("X-Discogs-Ratelimit-Reset")
                
                logger.info(f"Discogs API response: status={response.status_code}, headers={response.headers}")
                logger.info(f"Response body: {response.text[:500] if response.text else '(empty)'}")
                
                # 200 OK, 201 Created, 204 No Content are all success codes
                if response.status_code in (200, 201, 204):
                    return response.status_code, {
                        "ratelimit_remaining": rl_remaining,
                        "ratelimit_reset": rl_reset,
                        "data": response.json() if response.content and response.text else {}
                    }
                
                if response.status_code == 429 and attempt < max_retries:
                    # Exponential backoff with jitter
                    sleep_time = (2 ** attempt) + (0.25 * attempt)
                    if rl_reset and rl_reset.isdigit():
                        sleep_time = max(sleep_time, float(rl_reset))
                    logger.warning(f"Rate limit hit, retrying in {sleep_time:.2f}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(sleep_time)
                    attempt += 1
                    continue
                
                if 500 <= response.status_code < 600 and attempt < max_retries:
                    sleep_time = (2 ** attempt) + (0.25 * attempt)
                    logger.warning(f"Server error {response.status_code}, retrying in {sleep_time:.2f}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(sleep_time)
                    attempt += 1
                    continue
                
                # Hard failure or max retries exceeded
                error_response = self._safe_json(response)
                logger.error(f"Failed to update listing {listing_id}: status={response.status_code}, error={error_response}, text={response.text}")
                return response.status_code, {
                    "ratelimit_remaining": rl_remaining,
                    "ratelimit_reset": rl_reset,
                    "error": error_response,
                    "text": response.text
                }
                
            except Exception as e:
                logger.error(f"Exception while updating listing {listing_id}: {e}", exc_info=True)
                if attempt < max_retries:
                    sleep_time = (2 ** attempt) + (0.25 * attempt)
                    logger.warning(f"Request failed: {e}, retrying in {sleep_time:.2f}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(sleep_time)
                    attempt += 1
                    continue
                else:
                    return 0, {"error": str(e), "text": str(e)}
    
    @staticmethod
    def _safe_json(response) -> Dict[str, Any]:
        """Safely parse JSON response"""
        try:
            return response.json()
        except Exception:
            return {}
    
    def get_listing(self, listing_id: int) -> Dict[str, Any]:
        """
        Get a specific listing
        
        Args:
            listing_id: Listing ID
            
        Returns:
            Listing data
        """
        endpoint = f"/marketplace/listings/{listing_id}"
        return self._make_request('GET', endpoint)
    
    def create_listing(self, release_id: int, price: float, condition: str, 
                      status: str = "For Sale") -> Dict[str, Any]:
        """
        Create a new listing
        
        Args:
            release_id: Discogs release ID
            price: Listing price
            condition: Item condition
            status: Listing status (default: "For Sale")
            
        Returns:
            Created listing data
        """
        endpoint = "/marketplace/listings"
        
        data = {
            'release_id': release_id,
            'price': price,
            'condition': condition,
            'status': status
        }
        
        return self._make_request('POST', endpoint, json=data)
    
    def delete_listing(self, listing_id: int) -> bool:
        """
        Delete a listing
        
        Args:
            listing_id: Listing ID to delete
            
        Returns:
            True if successful
        """
        endpoint = f"/marketplace/listings/{listing_id}"
        
        response = self._make_request('DELETE', endpoint)
        return True  # DELETE returns empty response on success
    
    def get_user_info(self) -> Dict[str, Any]:
        """
        Get authenticated user's information using the correct Discogs API endpoint
        
        Returns:
            User information including username, id, and resource_url
        """
        # Use the correct Discogs API endpoint for user identity
        endpoint = "/oauth/identity"
        try:
            identity_response = self._make_request('GET', endpoint)
            logger.info(f"Got identity response: {identity_response}")
            logger.info(f"Identity response keys: {list(identity_response.keys()) if isinstance(identity_response, dict) else 'Not a dict'}")
            
            # The identity endpoint returns basic info, but we need more profile details
            # Get additional profile information using the username
            if 'username' in identity_response:
                username = identity_response['username']
                try:
                    # Get full profile information
                    profile_endpoint = f"/users/{username}"
                    profile_response = self._make_request('GET', profile_endpoint)
                    logger.info(f"Got profile response: {profile_response}")
                    logger.info(f"Profile response keys: {list(profile_response.keys()) if isinstance(profile_response, dict) else 'Not a dict'}")
                    
                    # Merge identity and profile data
                    merged_response = {
                        **identity_response,
                        **profile_response
                    }
                    logger.info(f"Merged response keys: {list(merged_response.keys()) if isinstance(merged_response, dict) else 'Not a dict'}")
                    return merged_response
                except Exception as profile_error:
                    logger.warning(f"Failed to get full profile, using identity data only: {profile_error}")
                    return identity_response
            
            return identity_response
            
        except DiscogsAPIError as e:
            logger.error(f"Failed to get user info from /oauth/identity: {e}")
            raise e
    
    def search_releases(self, query: str, type: str = "release", 
                       page: int = 1, per_page: int = 50) -> Dict[str, Any]:
        """
        Search for releases
        
        Args:
            query: Search query
            type: Search type (default: "release")
            page: Page number
            per_page: Results per page
            
        Returns:
            Search results
        """
        endpoint = "/database/search"
        params = {
            'q': query,
            'type': type,
            'page': page,
            'per_page': min(per_page, 100)
        }
        
        return self._make_request('GET', endpoint, params=params)
    
    def search_marketplace_listings(self, release_id: int, condition: str = None, 
                                  sleeve_condition: str = None, status: str = "For Sale",
                                  page: int = 1, per_page: int = 100) -> Dict[str, Any]:
        """
        Search marketplace listings for a specific release with condition filtering
        
        Args:
            release_id: Discogs release ID
            condition: Media condition filter (e.g., "Very Good Plus", "Near Mint")
            sleeve_condition: Sleeve condition filter
            status: Listing status (default: "For Sale")
            page: Page number
            per_page: Results per page
            
        Returns:
            Marketplace listings data
        """
        endpoint = "/marketplace/search"
        params = {
            'release_id': release_id,
            'status': status,
            'page': page,
            'per_page': min(per_page, 100)
        }
        
        if condition:
            params['condition'] = condition
        if sleeve_condition:
            params['sleeve_condition'] = sleeve_condition
        
        return self._make_request('GET', endpoint, params=params)
    
    def get_marketplace_listings_by_condition(self, release_id: int, 
                                            media_condition: str, sleeve_condition: str,
                                            status: str = "For Sale") -> Dict[str, Any]:
        """
        Get marketplace listings filtered by exact media and sleeve conditions
        
        Args:
            release_id: Discogs release ID
            media_condition: Media condition (e.g., "Very Good Plus")
            sleeve_condition: Sleeve condition (e.g., "Very Good")
            status: Listing status
            
        Returns:
            Filtered marketplace listings
        """
        # Try exact condition match first
        listings = self.search_marketplace_listings(
            release_id, condition=media_condition, 
            sleeve_condition=sleeve_condition, status=status
        )
        
        return listings
    
    def get_condition_fallback_listings(self, release_id: int, 
                                      media_condition: str, sleeve_condition: str,
                                      status: str = "For Sale") -> Dict[str, Any]:
        """
        Get marketplace listings with fallback to similar conditions
        
        Args:
            release_id: Discogs release ID
            media_condition: Primary media condition
            sleeve_condition: Primary sleeve condition
            status: Listing status
            
        Returns:
            Marketplace listings with fallback conditions
        """
        # Condition hierarchy for fallback (from best to worst)
        condition_hierarchy = {
            'Mint': ['Mint', 'Near Mint', 'Very Good Plus', 'Very Good', 'Good Plus', 'Good', 'Fair', 'Poor'],
            'Near Mint': ['Near Mint', 'Mint', 'Very Good Plus', 'Very Good', 'Good Plus', 'Good', 'Fair', 'Poor'],
            'Very Good Plus': ['Very Good Plus', 'Near Mint', 'Very Good', 'Mint', 'Good Plus', 'Good', 'Fair', 'Poor'],
            'Very Good': ['Very Good', 'Very Good Plus', 'Good Plus', 'Near Mint', 'Good', 'Mint', 'Fair', 'Poor'],
            'Good Plus': ['Good Plus', 'Very Good', 'Good', 'Very Good Plus', 'Fair', 'Near Mint', 'Poor', 'Mint'],
            'Good': ['Good', 'Good Plus', 'Fair', 'Very Good', 'Poor', 'Very Good Plus', 'Near Mint', 'Mint'],
            'Fair': ['Fair', 'Good', 'Poor', 'Good Plus', 'Very Good', 'Very Good Plus', 'Near Mint', 'Mint'],
            'Poor': ['Poor', 'Fair', 'Good', 'Good Plus', 'Very Good', 'Very Good Plus', 'Near Mint', 'Mint']
        }
        
        # Get fallback conditions
        media_fallbacks = condition_hierarchy.get(media_condition, [media_condition])
        sleeve_fallbacks = condition_hierarchy.get(sleeve_condition, [sleeve_condition])
        
        all_listings = []
        
        # Try combinations of fallback conditions
        for media_fallback in media_fallbacks[:3]:  # Limit to top 3 fallbacks
            for sleeve_fallback in sleeve_fallbacks[:3]:
                try:
                    listings = self.search_marketplace_listings(
                        release_id, condition=media_fallback,
                        sleeve_condition=sleeve_fallback, status=status
                    )
                    if listings.get('listings'):
                        all_listings.extend(listings['listings'])
                except Exception as e:
                    logger.warning(f"Failed to get listings for {media_fallback}/{sleeve_fallback}: {e}")
                    continue
        
        # Remove duplicates and return
        unique_listings = []
        seen_ids = set()
        for listing in all_listings:
            if listing['id'] not in seen_ids:
                unique_listings.append(listing)
                seen_ids.add(listing['id'])
        
        return {
            'listings': unique_listings,
            'pagination': {
                'page': 1,
                'pages': 1,
                'per_page': len(unique_listings),
                'items': len(unique_listings)
            }
        }


class DiscogsOAuth:
    """
    Handle OAuth 1.0a flow for Discogs API
    """
    
    def __init__(self, consumer_key: str, consumer_secret: str):
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        self.request_token_url = "https://api.discogs.com/oauth/request_token"
        self.authorize_url = "https://www.discogs.com/oauth/authorize"
        self.access_token_url = "https://api.discogs.com/oauth/access_token"
    
    def get_request_token(self, callback_url: str = "http://localhost:3000") -> tuple[str, str]:
        """
        Get OAuth request token
        
        Args:
            callback_url: OAuth callback URL
            
        Returns:
            Tuple of (request_token, request_token_secret)
        """
        oauth = requests_oauthlib.OAuth1Session(
            self.consumer_key,
            client_secret=self.consumer_secret,
            signature_method='HMAC-SHA1',
            callback_uri=callback_url
        )
        
        oauth.headers.update({
            'User-Agent': DiscogsClient.USER_AGENT
        })
        
        logger.info(f"Requesting OAuth token with callback: {callback_url}")
        response = oauth.fetch_request_token(self.request_token_url)
        logger.info(f"Successfully obtained request token: {response['oauth_token'][:10]}...")
        
        return response['oauth_token'], response['oauth_token_secret']
    
    def get_authorize_url(self, request_token: str) -> str:
        """
        Get authorization URL for user to visit
        
        Args:
            request_token: OAuth request token
            
        Returns:
            Authorization URL
        """
        params = {'oauth_token': request_token}
        return f"{self.authorize_url}?{urlencode(params)}"
    
    def get_access_token(self, request_token: str, request_token_secret: str, 
                        verifier: str) -> tuple[str, str]:
        """
        Exchange request token for access token
        
        Args:
            request_token: OAuth request token
            request_token_secret: OAuth request token secret
            verifier: OAuth verifier from user
            
        Returns:
            Tuple of (access_token, access_token_secret)
        """
        oauth = requests_oauthlib.OAuth1Session(
            self.consumer_key,
            client_secret=self.consumer_secret,
            resource_owner_key=request_token,
            resource_owner_secret=request_token_secret,
            signature_method='HMAC-SHA1'
        )
        
        oauth.headers.update({
            'User-Agent': DiscogsClient.USER_AGENT
        })
        
        logger.info(f"Exchanging request token for access token with verifier: {verifier}")
        try:
            response = oauth.fetch_access_token(self.access_token_url, verifier=verifier)
            logger.info(f"Successfully obtained access token: {response['oauth_token'][:10]}...")
            return response['oauth_token'], response['oauth_token_secret']
        except Exception as e:
            logger.error(f"Failed to get access token: {e}")
            logger.error(f"Request token: {request_token[:10]}...")
            logger.error(f"Request token secret: {request_token_secret[:10]}...")
            logger.error(f"Verifier: {verifier}")
            raise
