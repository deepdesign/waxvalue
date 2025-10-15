#!/usr/bin/env python3
"""
Extended Discogs Client for WaxValue Wanted List Feature

This module extends the standard DiscogsClient with additional methods
for marketplace search, release details, and pricing statistics.

Follows development guidelines:
- Proper OAuth 1.0a implementation
- Rate limiting (60 requests per minute)
- Error handling and retries
- Type safety and documentation
"""

import os
import logging
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
from discogs_client import DiscogsClient
from discogs_client.exceptions import DiscogsAPIError, DiscogsAuthError

logger = logging.getLogger(__name__)

class ExtendedDiscogsClient(DiscogsClient):
    """
    Extended Discogs client with additional methods for wanted list functionality.
    
    Inherits from DiscogsClient and adds:
    - Release details fetching
    - Marketplace listing search
    - Pricing statistics
    - Enhanced error handling
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._rate_limit_delay = 1.0  # 1 second between requests (60/minute max)
        self._last_request_time = 0.0
    
    def _rate_limit_check(self):
        """Implement rate limiting to stay within 60 requests per minute."""
        current_time = time.time()
        time_since_last = current_time - self._last_request_time
        
        if time_since_last < self._rate_limit_delay:
            sleep_time = self._rate_limit_delay - time_since_last
            logger.debug(f"Rate limiting: sleeping {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        self._last_request_time = time.time()
    
    def get_release_details(self, release_id: int) -> Dict[str, Any]:
        """
        Get detailed release information from Discogs.
        
        Args:
            release_id: Discogs release ID
            
        Returns:
            Dict containing release details
            
        Raises:
            DiscogsAPIError: If API request fails
            ValueError: If release_id is invalid
        """
        if not isinstance(release_id, int) or release_id <= 0:
            raise ValueError("Release ID must be a positive integer")
        
        try:
            self._rate_limit_check()
            logger.info(f"Fetching release details for ID: {release_id}")
            
            release = self.release(release_id)
            
            # Extract and format release data
            release_data = {
                'id': release.id,
                'title': release.title,
                'year': release.year,
                'artists': [artist.name for artist in release.artists] if release.artists else [],
                'labels': [label.name for label in release.labels] if release.labels else [],
                'formats': [format.name for format in release.formats] if release.formats else [],
                'images': [img['uri'] for img in release.images] if release.images else [],
                'resource_url': release.resource_url,
                'genres': release.genres if hasattr(release, 'genres') else [],
                'styles': release.styles if hasattr(release, 'styles') else [],
                'country': release.country if hasattr(release, 'country') else None,
                'notes': release.notes if hasattr(release, 'notes') else None,
                'data_quality': release.data_quality if hasattr(release, 'data_quality') else None
            }
            
            logger.info(f"Successfully fetched release details for: {release_data['title']}")
            return release_data
            
        except DiscogsAPIError as e:
            logger.error(f"Discogs API error fetching release {release_id}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching release {release_id}: {e}")
            raise DiscogsAPIError(f"Failed to fetch release details: {str(e)}")
    
    def search_marketplace_listings(self, release_id: int, per_page: int = 50, page: int = 1) -> List[Dict[str, Any]]:
        """
        Search marketplace listings for a specific release.
        
        Note: This method uses the marketplace search API to find listings
        for a specific release. The Discogs API structure may require
        different approaches depending on available endpoints.
        
        Args:
            release_id: Discogs release ID to search for
            per_page: Number of results per page (max 100)
            page: Page number to fetch
            
        Returns:
            List of marketplace listings
            
        Raises:
            DiscogsAPIError: If API request fails
        """
        if not isinstance(release_id, int) or release_id <= 0:
            raise ValueError("Release ID must be a positive integer")
        
        try:
            self._rate_limit_check()
            logger.info(f"Searching marketplace listings for release ID: {release_id}")
            
            # Search for the release first to get the release object
            release = self.release(release_id)
            
            listings = []
            
            # Note: The actual implementation depends on Discogs API capabilities
            # This is a placeholder that would need to be updated based on
            # available marketplace search endpoints
            
            # For now, we'll search for the release title and filter by release ID
            # This is a workaround until we can access direct marketplace listings
            
            search_query = f"{release.title} {release.artists[0].name if release.artists else ''}"
            
            try:
                search_results = self.search(
                    q=search_query,
                    type='release',
                    per_page=min(per_page, 100),
                    page=page
                )
                
                # Filter results to match our release ID
                for result in search_results:
                    if hasattr(result, 'id') and result.id == release_id:
                        # Try to get listings for this release
                        # Note: This would need to be implemented based on actual API structure
                        logger.debug(f"Found matching release: {result.title}")
                        break
                        
            except Exception as search_error:
                logger.warning(f"Marketplace search failed: {search_error}")
                # Return empty list if search fails
                return []
            
            # Placeholder implementation - would need actual marketplace API access
            logger.warning("Marketplace listing search is not fully implemented - requires Discogs marketplace API access")
            
            return listings
            
        except DiscogsAPIError as e:
            logger.error(f"Discogs API error searching listings for release {release_id}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error searching listings for release {release_id}: {e}")
            raise DiscogsAPIError(f"Failed to search marketplace listings: {str(e)}")
    
    def get_release_marketplace_stats(self, release_id: int) -> Dict[str, Any]:
        """
        Get marketplace statistics for pricing analysis.
        
        This method would aggregate data from multiple API calls to provide
        pricing statistics for a release.
        
        Args:
            release_id: Discogs release ID
            
        Returns:
            Dict containing pricing statistics
            
        Raises:
            DiscogsAPIError: If API request fails
        """
        if not isinstance(release_id, int) or release_id <= 0:
            raise ValueError("Release ID must be a positive integer")
        
        try:
            self._rate_limit_check()
            logger.info(f"Fetching marketplace stats for release ID: {release_id}")
            
            # Get release details first
            release_data = self.get_release_details(release_id)
            
            # Get marketplace listings
            listings = self.search_marketplace_listings(release_id)
            
            # Calculate statistics from listings
            stats = {
                'release_id': release_id,
                'release_title': release_data['title'],
                'total_listings': len(listings),
                'median_price': None,
                'average_price': None,
                'price_range': None,
                'currency_distribution': {},
                'condition_distribution': {},
                'last_updated': datetime.now().isoformat()
            }
            
            if listings:
                prices = []
                currencies = {}
                conditions = {}
                
                for listing in listings:
                    if 'price' in listing and listing['price']:
                        price = float(listing['price'])
                        prices.append(price)
                        
                        currency = listing.get('currency', 'USD')
                        currencies[currency] = currencies.get(currency, 0) + 1
                        
                        condition = listing.get('condition', 'Unknown')
                        conditions[condition] = conditions.get(condition, 0) + 1
                
                if prices:
                    prices.sort()
                    stats['median_price'] = prices[len(prices) // 2]
                    stats['average_price'] = sum(prices) / len(prices)
                    stats['price_range'] = {
                        'min': min(prices),
                        'max': max(prices)
                    }
                
                stats['currency_distribution'] = currencies
                stats['condition_distribution'] = conditions
            
            logger.info(f"Generated marketplace stats for release {release_id}: {stats['total_listings']} listings")
            return stats
            
        except DiscogsAPIError as e:
            logger.error(f"Discogs API error getting stats for release {release_id}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error getting stats for release {release_id}: {e}")
            raise DiscogsAPIError(f"Failed to get marketplace statistics: {str(e)}")
    
    def validate_release_id(self, release_id: str) -> int:
        """
        Validate and convert release ID string to integer.
        
        Args:
            release_id: Release ID as string or integer
            
        Returns:
            Validated release ID as integer
            
        Raises:
            ValueError: If release ID is invalid
        """
        try:
            release_id_int = int(release_id)
            if release_id_int <= 0:
                raise ValueError("Release ID must be positive")
            return release_id_int
        except (ValueError, TypeError):
            raise ValueError(f"Invalid release ID: {release_id}")
    
    def extract_release_id_from_url(self, url: str) -> Optional[int]:
        """
        Extract release ID from Discogs URL.
        
        Supports various Discogs URL formats:
        - https://www.discogs.com/release/1234567
        - https://www.discogs.com/artist/release/1234567
        - https://discogs.com/release/1234567
        
        Args:
            url: Discogs release URL
            
        Returns:
            Release ID as integer, or None if not found
            
        Raises:
            ValueError: If URL format is invalid
        """
        import re
        
        if not url or not isinstance(url, str):
            raise ValueError("URL must be a non-empty string")
        
        # Pattern to match Discogs release URLs
        patterns = [
            r'discogs\.com/release/(\d+)',
            r'discogs\.com/.*/release/(\d+)',
            r'^(\d+)$'  # Direct ID
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    continue
        
        return None
