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

logger = logging.getLogger(__name__)

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
        
        # Rate limiting
        self.last_request_time = 0
        self.requests_per_minute = 60
        self.min_request_interval = 60.0 / self.requests_per_minute
        
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
        """Handle rate limiting by waiting if necessary"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last_request
            logger.debug(f"Rate limiting: sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
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
            Inventory data with listings
        """
        endpoint = f"/users/{username}/inventory"
        params = {
            'page': page,
            'per_page': min(per_page, 100)
        }
        
        return self._make_request('GET', endpoint, params=params)
    
    def get_price_suggestions(self, release_id: int) -> Dict[str, Any]:
        """
        Get price suggestions for a release
        
        Args:
            release_id: Discogs release ID
            
        Returns:
            Price suggestions data
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
        
        Args:
            listing_id: Listing ID to update
            price: New price
            currency: Currency code (optional)
            status: New status (optional)
            
        Returns:
            Tuple of (http_status_code, response_metadata)
        """
        endpoint = f"/marketplace/listings/{listing_id}"
        
        data = {'price': price}
        if currency:
            data['currency'] = currency
        if status:
            data['status'] = status
        
        max_retries = 3
        attempt = 0
        
        while True:
            try:
                response = self.session.put(f"{self.BASE_URL}{endpoint}", json=data)
                
                # Extract rate limit headers
                rl_remaining = response.headers.get("X-Discogs-Ratelimit-Remaining")
                rl_reset = response.headers.get("X-Discogs-Ratelimit-Reset")
                
                if response.status_code in (200, 201):
                    return response.status_code, {
                        "ratelimit_remaining": rl_remaining,
                        "ratelimit_reset": rl_reset,
                        "data": response.json() if response.content else {}
                    }
                
                if response.status_code == 429 and attempt < max_retries:
                    # Exponential backoff with jitter
                    sleep_time = (2 ** attempt) + (0.25 * attempt)  # Add jitter
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
                return response.status_code, {
                    "ratelimit_remaining": rl_remaining,
                    "ratelimit_reset": rl_reset,
                    "error": self._safe_json(response),
                    "text": response.text
                }
                
            except Exception as e:
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
        Get authenticated user's information
        
        Returns:
            User information
        """
        endpoint = "/users/__me__"
        return self._make_request('GET', endpoint)
    
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
    
    def get_request_token(self) -> tuple[str, str]:
        """
        Get OAuth request token
        
        Returns:
            Tuple of (request_token, request_token_secret)
        """
        oauth = requests_oauthlib.OAuth1Session(
            self.consumer_key,
            client_secret=self.consumer_secret,
            signature_method='HMAC-SHA1'
        )
        
        oauth.headers.update({
            'User-Agent': DiscogsClient.USER_AGENT
        })
        
        response = oauth.fetch_request_token(self.request_token_url)
        
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
        
        response = oauth.fetch_access_token(self.access_token_url, verifier=verifier)
        
        return response['oauth_token'], response['oauth_token_secret']
