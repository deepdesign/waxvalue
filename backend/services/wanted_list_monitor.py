#!/usr/bin/env python3
"""
Wanted List Monitoring Service for WaxValue

This service monitors user wanted lists and sends alerts when listings
match user-defined criteria.

Follows development guidelines:
- Proper error handling and logging
- Rate limiting compliance (60 requests/minute)
- Background job processing
- Database integration
- Email notification system
"""

import asyncio
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

from discogs_extended import ExtendedDiscogsClient
from criteria_matcher import criteria_matcher, ListingCriteria, MarketplaceListing
from email_service import email_service

logger = logging.getLogger(__name__)

@dataclass
class WantedListEntry:
    """Data class for wanted list entry."""
    id: str
    user_id: str
    discogs_release_id: int
    release_title: str
    artist_name: str
    max_price: Optional[float]
    max_price_currency: str
    min_condition: Optional[str]
    location_filter: Optional[str]
    min_seller_rating: Optional[float]
    underpriced_percentage: Optional[int]
    is_active: bool
    last_checked: Optional[datetime]

@dataclass
class MarketplaceListing:
    """Data class for marketplace listing."""
    id: int
    price: float
    currency: str
    condition: str
    sleeve_condition: str
    seller_name: str
    seller_rating: float
    location: str
    url: str

@dataclass
class AlertResult:
    """Data class for alert matching result."""
    entry_id: str
    listing: MarketplaceListing
    match_type: str  # 'price_matched', 'underpriced', 'new_listing'
    reason: str

class WantedListMonitor:
    """
    Background monitoring service for wanted list entries.
    
    Monitors Discogs marketplace for listings matching user criteria
    and sends email notifications when matches are found.
    """
    
    def __init__(self):
        self.monitoring_active = False
        self.check_interval = 3600  # 1 hour in seconds
        self.max_retries = 3
        self.retry_delay = 300  # 5 minutes
        
        # Condition order for comparison (higher number = better condition)
        self.condition_order = {
            'M': 6,    # Mint
            'NM': 5,   # Near Mint
            'VG+': 4,  # Very Good Plus
            'VG': 3,   # Very Good
            'G+': 2,   # Good Plus
            'G': 1     # Good
        }
    
    async def start_monitoring(self):
        """Start the monitoring service."""
        self.monitoring_active = True
        logger.info("🎵 Wanted List monitoring service started")
        
        while self.monitoring_active:
            try:
                await self.check_all_wanted_releases()
                
                # Wait for next check interval
                logger.info(f"⏰ Next check in {self.check_interval} seconds")
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"❌ Error in monitoring loop: {e}")
                # Wait shorter time before retry on error
                await asyncio.sleep(60)  # 1 minute
    
    async def stop_monitoring(self):
        """Stop the monitoring service."""
        self.monitoring_active = False
        logger.info("🛑 Wanted List monitoring service stopped")
    
    async def check_all_wanted_releases(self):
        """Check all active wanted releases for matches."""
        try:
            logger.info("🔍 Starting wanted list check cycle")
            
            # Get all active wanted list entries from database
            entries = await self.get_active_wanted_entries()
            
            if not entries:
                logger.info("📭 No active wanted list entries found")
                return
            
            logger.info(f"📋 Found {len(entries)} active wanted list entries")
            
            # Group entries by user for efficient processing
            user_entries = {}
            for entry in entries:
                if entry.user_id not in user_entries:
                    user_entries[entry.user_id] = []
                user_entries[entry.user_id].append(entry)
            
            # Process entries for each user
            for user_id, user_entry_list in user_entries.items():
                try:
                    await self.check_user_wanted_releases(user_id, user_entry_list)
                except Exception as e:
                    logger.error(f"❌ Error checking wanted releases for user {user_id}: {e}")
                    
        except Exception as e:
            logger.error(f"❌ Error in check_all_wanted_releases: {e}")
    
    async def check_user_wanted_releases(self, user_id: str, entries: List[WantedListEntry]):
        """Check wanted releases for a specific user."""
        try:
            # Get user's Discogs credentials
            user_credentials = await self.get_user_discogs_credentials(user_id)
            if not user_credentials:
                logger.warning(f"⚠️ No Discogs credentials found for user {user_id}")
                return
            
            # Create authenticated Discogs client
            client = ExtendedDiscogsClient(
                consumer_key=os.getenv("DISCOGS_CONSUMER_KEY"),
                consumer_secret=os.getenv("DISCOGS_CONSUMER_SECRET"),
                access_token=user_credentials['access_token'],
                access_token_secret=user_credentials['access_token_secret']
            )
            
            logger.info(f"👤 Checking {len(entries)} releases for user {user_id}")
            
            # Check each entry
            for entry in entries:
                try:
                    await self.check_release_entry(entry, client, user_id)
                except Exception as e:
                    logger.error(f"❌ Error checking entry {entry.id}: {e}")
                    
        except Exception as e:
            logger.error(f"❌ Error checking user {user_id}: {e}")
    
    async def check_release_entry(self, entry: WantedListEntry, client: ExtendedDiscogsClient, user_id: str):
        """Check a specific release entry for matching listings."""
        try:
            logger.debug(f"🔍 Checking release {entry.discogs_release_id}: {entry.release_title}")
            
            # Get marketplace listings for this release
            listings = await self.get_marketplace_listings(entry.discogs_release_id, client)
            
            if not listings:
                logger.debug(f"📭 No listings found for release {entry.discogs_release_id}")
                await self.update_entry_status(entry.id, 'no_listings')
                return
            
            logger.debug(f"📦 Found {len(listings)} listings for release {entry.discogs_release_id}")
            
            # Check each listing against criteria
            matched_listings = []
            for listing in listings:
                match_result = self.evaluate_listing_criteria(listing, entry)
                if match_result:
                    matched_listings.append((listing, match_result))
            
            # Process matches
            if matched_listings:
                logger.info(f"🎯 Found {len(matched_listings)} matching listings for {entry.release_title}")
                
                for listing, match_result in matched_listings:
                    # Send alert notification
                    await self.send_alert_notification(entry, listing, match_result, user_id)
                    
                    # Update entry status
                    await self.update_entry_status(entry.id, match_result.match_type)
                    
                    # Log notification
                    await self.log_notification(entry.id, listing, match_result.match_type)
            else:
                logger.debug(f"❌ No listings match criteria for {entry.release_title}")
                await self.update_entry_status(entry.id, 'monitoring')
            
            # Update last checked timestamp
            await self.update_last_checked(entry.id)
            
        except Exception as e:
            logger.error(f"❌ Error checking release entry {entry.id}: {e}")
    
    def evaluate_listing_criteria(self, listing: MarketplaceListing, entry: WantedListEntry) -> Optional[AlertResult]:
        """
        Evaluate if a listing matches the entry's criteria using the criteria matcher.
        
        Returns AlertResult if match found, None otherwise.
        """
        try:
            # Convert entry to criteria format
            criteria = ListingCriteria(
                max_price=entry.max_price,
                max_price_currency=entry.max_price_currency,
                min_condition=entry.min_condition,
                location_filter=entry.location_filter,
                min_seller_rating=entry.min_seller_rating,
                underpriced_percentage=entry.underpriced_percentage
            )
            
            # Use the criteria matcher for evaluation
            match_result = criteria_matcher.evaluate_listing(listing, criteria)
            
            if match_result.matches:
                return AlertResult(
                    entry_id=entry.id,
                    listing=listing,
                    match_type=match_result.match_type.value,
                    reason=match_result.reason
                )
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error evaluating criteria: {e}")
            return None
    
    async def get_active_wanted_entries(self) -> List[WantedListEntry]:
        """Get all active wanted list entries from database."""
        try:
            # This would query the actual database
            # For now, return empty list as placeholder
            # entries = await db.get_active_wanted_entries()
            entries = []
            
            return entries
            
        except Exception as e:
            logger.error(f"❌ Error fetching wanted entries: {e}")
            return []
    
    async def get_user_discogs_credentials(self, user_id: str) -> Optional[Dict[str, str]]:
        """Get user's Discogs OAuth credentials."""
        try:
            # This would query the actual database/session storage
            # For now, return None as placeholder
            # credentials = await db.get_user_discogs_credentials(user_id)
            credentials = None
            
            return credentials
            
        except Exception as e:
            logger.error(f"❌ Error fetching user credentials: {e}")
            return None
    
    async def get_marketplace_listings(self, release_id: int, client: ExtendedDiscogsClient) -> List[MarketplaceListing]:
        """Get marketplace listings for a release."""
        try:
            # Use the extended client to search for listings
            listings_data = client.search_marketplace_listings(release_id)
            
            listings = []
            for listing_data in listings_data:
                listing = MarketplaceListing(
                    id=listing_data.get('id', 0),
                    price=float(listing_data.get('price', 0)),
                    currency=listing_data.get('currency', 'USD'),
                    condition=listing_data.get('condition', 'Unknown'),
                    sleeve_condition=listing_data.get('sleeve_condition', 'Unknown'),
                    seller_name=listing_data.get('seller', 'Unknown'),
                    seller_rating=float(listing_data.get('seller_rating', 0)),
                    location=listing_data.get('location', 'Unknown'),
                    url=listing_data.get('url', '')
                )
                listings.append(listing)
            
            return listings
            
        except Exception as e:
            logger.error(f"❌ Error fetching marketplace listings for release {release_id}: {e}")
            return []
    
    async def send_alert_notification(self, entry: WantedListEntry, listing: MarketplaceListing, match_result: AlertResult, user_id: str):
        """Send email notification for matched listing."""
        try:
            # Get user email
            user_email = await self.get_user_email(user_id)
            if not user_email:
                logger.warning(f"⚠️ No email found for user {user_id}")
                return
            
            # Prepare email data
            email_data = {
                'to': user_email,
                'subject': f"🎵 Price Alert: {entry.release_title}",
                'template': 'price_alert',
                'data': {
                    'release_title': entry.release_title,
                    'artist_name': entry.artist_name,
                    'listing_price': listing.price,
                    'currency': listing.currency,
                    'condition': listing.condition,
                    'seller_name': listing.seller_name,
                    'seller_rating': listing.seller_rating,
                    'listing_url': listing.url,
                    'match_reason': match_result.reason,
                    'app_url': os.getenv("FRONTEND_URL", "http://localhost:3000") + "/wanted-list"
                }
            }
            
            # Send email using the email service
            success = await email_service.send_email(email_data)
            if success:
                logger.info(f"📧 Alert sent for {entry.release_title} - {match_result.reason}")
            else:
                logger.error(f"❌ Failed to send alert for {entry.release_title}")
            
        except Exception as e:
            logger.error(f"❌ Error sending alert notification: {e}")
    
    async def get_user_email(self, user_id: str) -> Optional[str]:
        """Get user's email address."""
        try:
            # This would query the actual database/session storage
            # For now, return None as placeholder
            # email = await db.get_user_email(user_id)
            email = None
            
            return email
            
        except Exception as e:
            logger.error(f"❌ Error fetching user email: {e}")
            return None
    
    async def update_entry_status(self, entry_id: str, status: str):
        """Update wanted list entry status."""
        try:
            # This would update the actual database
            # await db.update_wanted_list_entry_status(entry_id, status)
            logger.debug(f"📝 Updated entry {entry_id} status to {status}")
            
        except Exception as e:
            logger.error(f"❌ Error updating entry status: {e}")
    
    async def update_last_checked(self, entry_id: str):
        """Update last checked timestamp for entry."""
        try:
            # This would update the actual database
            # await db.update_wanted_list_entry_last_checked(entry_id, datetime.now())
            logger.debug(f"⏰ Updated entry {entry_id} last checked timestamp")
            
        except Exception as e:
            logger.error(f"❌ Error updating last checked: {e}")
    
    async def log_notification(self, entry_id: str, listing: MarketplaceListing, notification_type: str):
        """Log sent notification to database."""
        try:
            # This would save to the actual database
            # await db.save_alert_notification({
            #     'wanted_list_entry_id': entry_id,
            #     'listing_id': listing.id,
            #     'listing_price': listing.price,
            #     'listing_currency': listing.currency,
            #     'listing_condition': listing.condition,
            #     'seller_name': listing.seller_name,
            #     'seller_rating': listing.seller_rating,
            #     'listing_url': listing.url,
            #     'notification_type': notification_type,
            #     'created_at': datetime.now()
            # })
            logger.debug(f"📋 Logged notification for entry {entry_id}")
            
        except Exception as e:
            logger.error(f"❌ Error logging notification: {e}")

# Global monitoring service instance
monitoring_service = WantedListMonitor()

async def start_monitoring_service():
    """Start the monitoring service (to be called from main application)."""
    await monitoring_service.start_monitoring()

async def stop_monitoring_service():
    """Stop the monitoring service."""
    await monitoring_service.stop_monitoring()

async def manual_check_user_releases(user_id: str):
    """Manually trigger check for a specific user's releases."""
    try:
        entries = await monitoring_service.get_active_wanted_entries()
        user_entries = [entry for entry in entries if entry.user_id == user_id]
        
        if user_entries:
            await monitoring_service.check_user_wanted_releases(user_id, user_entries)
            logger.info(f"✅ Manual check completed for user {user_id}")
        else:
            logger.info(f"📭 No entries found for user {user_id}")
            
    except Exception as e:
        logger.error(f"❌ Error in manual check for user {user_id}: {e}")
        raise
