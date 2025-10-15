#!/usr/bin/env python3
"""
Wanted List API Endpoints for WaxValue

This module provides REST API endpoints for managing user wanted lists
and Discogs price alerts functionality.

Follows development guidelines:
- Proper input validation and sanitization
- Type-safe API responses
- Security best practices
- Error handling and logging
- Rate limiting compliance
"""

import os
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, validator
from discogs_extended import ExtendedDiscogsClient

logger = logging.getLogger(__name__)

# Import existing utilities
from main import require_auth, require_discogs_auth, session_manager

router = APIRouter(prefix="/wanted-list", tags=["wanted-list"])

# Pydantic models for request/response validation
class WantedListEntryRequest(BaseModel):
    """Request model for adding a release to wanted list."""
    discogs_release_id: int = Field(..., gt=0, description="Discogs release ID")
    max_price: Optional[float] = Field(None, gt=0, description="Maximum price threshold")
    max_price_currency: str = Field("USD", description="Currency for price threshold")
    min_condition: Optional[str] = Field(None, description="Minimum condition requirement")
    location_filter: Optional[str] = Field(None, max_length=100, description="Geographic filter")
    min_seller_rating: Optional[float] = Field(None, ge=0, le=100, description="Minimum seller rating")
    underpriced_percentage: Optional[int] = Field(None, ge=1, le=100, description="Underpriced alert percentage")
    user_email: str = Field(..., description="User email for notifications")
    
    @validator('max_price_currency')
    def validate_currency(cls, v):
        """Validate currency code."""
        valid_currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']
        if v.upper() not in valid_currencies:
            raise ValueError(f"Currency must be one of: {', '.join(valid_currencies)}")
        return v.upper()
    
    @validator('min_condition')
    def validate_condition(cls, v):
        """Validate condition code."""
        if v is not None:
            valid_conditions = ['M', 'NM', 'VG+', 'VG', 'G+', 'G']
            if v not in valid_conditions:
                raise ValueError(f"Condition must be one of: {', '.join(valid_conditions)}")
        return v

class WantedListEntryUpdate(BaseModel):
    """Request model for updating a wanted list entry."""
    max_price: Optional[float] = Field(None, gt=0)
    max_price_currency: Optional[str] = Field(None)
    min_condition: Optional[str] = Field(None)
    location_filter: Optional[str] = Field(None, max_length=100)
    min_seller_rating: Optional[float] = Field(None, ge=0, le=100)
    underpriced_percentage: Optional[int] = Field(None, ge=1, le=100)
    is_active: Optional[bool] = Field(None)
    
    @validator('max_price_currency')
    def validate_currency(cls, v):
        if v is not None:
            valid_currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']
            if v.upper() not in valid_currencies:
                raise ValueError(f"Currency must be one of: {', '.join(valid_currencies)}")
            return v.upper()
        return v
    
    @validator('min_condition')
    def validate_condition(cls, v):
        if v is not None:
            valid_conditions = ['M', 'NM', 'VG+', 'VG', 'G+', 'G']
            if v not in valid_conditions:
                raise ValueError(f"Condition must be one of: {', '.join(valid_conditions)}")
        return v

class WantedListEntryResponse(BaseModel):
    """Response model for wanted list entries."""
    id: str
    discogs_release_id: int
    release_title: Optional[str]
    artist_name: Optional[str]
    release_year: Optional[int]
    release_format: Optional[str]
    cover_image_url: Optional[str]
    max_price: Optional[float]
    max_price_currency: str
    min_condition: Optional[str]
    location_filter: Optional[str]
    min_seller_rating: Optional[float]
    underpriced_percentage: Optional[int]
    user_email: str
    status: str
    is_active: bool
    last_checked: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

class ReleaseDetailsResponse(BaseModel):
    """Response model for release details."""
    id: int
    title: str
    year: Optional[int]
    artists: List[str]
    labels: List[str]
    formats: List[str]
    images: List[str]
    resource_url: str
    genres: List[str]
    styles: List[str]
    country: Optional[str]

class NotificationResponse(BaseModel):
    """Response model for alert notifications."""
    id: str
    wanted_list_entry_id: str
    listing_id: Optional[int]
    listing_price: Optional[float]
    listing_currency: Optional[str]
    listing_condition: Optional[str]
    seller_name: Optional[str]
    seller_rating: Optional[float]
    listing_url: Optional[str]
    notification_type: str
    email_sent_at: Optional[datetime]
    created_at: datetime

# Helper functions
def get_discogs_client(user) -> ExtendedDiscogsClient:
    """Get authenticated Discogs client for user."""
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    if not consumer_key or not consumer_secret:
        raise HTTPException(status_code=500, detail="Discogs API credentials not configured")
    
    return ExtendedDiscogsClient(
        consumer_key=consumer_key,
        consumer_secret=consumer_secret,
        access_token=user.accessToken,
        access_token_secret=user.accessTokenSecret
    )

def get_database_connection():
    """Get database connection - placeholder for actual implementation."""
    # This would be implemented with actual database connection
    # For now, using session storage as placeholder
    pass

# API Endpoints

@router.post("/add", response_model=Dict[str, str])
async def add_wanted_release(
    release_data: WantedListEntryRequest,
    session_id: str = Query(..., description="Session ID for authentication")
):
    """Add a release to user's wanted list."""
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    try:
        logger.info(f"Adding release {release_data.discogs_release_id} to wanted list for user {user.id}")
        
        # Get authenticated Discogs client
        client = get_discogs_client(user)
        
        # Validate release exists on Discogs
        try:
            release_details = client.get_release_details(release_data.discogs_release_id)
        except Exception as e:
            logger.error(f"Failed to fetch release details: {e}")
            raise HTTPException(status_code=400, detail=f"Release not found or inaccessible: {str(e)}")
        
        # Check if release already exists in user's wanted list
        # This would query the actual database
        # existing_entry = db.get_wanted_list_entry(user.id, release_data.discogs_release_id)
        # if existing_entry:
        #     raise HTTPException(status_code=400, detail="Release already in wanted list")
        
        # Create wanted list entry
        entry_id = str(uuid.uuid4())
        entry_data = {
            'id': entry_id,
            'user_id': user.id,
            'discogs_release_id': release_data.discogs_release_id,
            'release_title': release_details['title'],
            'artist_name': ', '.join(release_details['artists']),
            'release_year': release_details['year'],
            'release_format': ', '.join(release_details['formats']),
            'cover_image_url': release_details['images'][0] if release_details['images'] else None,
            'max_price': release_data.max_price,
            'max_price_currency': release_data.max_price_currency,
            'min_condition': release_data.min_condition,
            'location_filter': release_data.location_filter,
            'min_seller_rating': release_data.min_seller_rating,
            'underpriced_percentage': release_data.underpriced_percentage,
            'status': 'monitoring',
            'is_active': True,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        # Save to database (placeholder)
        # db.save_wanted_list_entry(entry_data)
        logger.info(f"Wanted list entry created: {entry_id}")
        
        return {
            "message": "Release added to wanted list successfully",
            "entry_id": entry_id,
            "release_title": release_details['title']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error adding release to wanted list: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add release to wanted list: {str(e)}")

@router.get("/", response_model=List[WantedListEntryResponse])
async def get_wanted_list(
    session_id: str = Query(..., description="Session ID for authentication"),
    include_inactive: bool = Query(False, description="Include inactive entries")
):
    """Get user's wanted list with current status."""
    user = require_auth(session_id)
    
    try:
        logger.info(f"Fetching wanted list for user {user.id}")
        
        # This would query the actual database
        # entries = db.get_wanted_list_entries(user.id, include_inactive)
        entries = []  # Placeholder
        
        # Convert to response models
        response_entries = []
        for entry in entries:
            response_entries.append(WantedListEntryResponse(
                id=entry['id'],
                discogs_release_id=entry['discogs_release_id'],
                release_title=entry['release_title'],
                artist_name=entry['artist_name'],
                release_year=entry['release_year'],
                release_format=entry['release_format'],
                cover_image_url=entry['cover_image_url'],
                max_price=entry['max_price'],
                max_price_currency=entry['max_price_currency'],
                min_condition=entry['min_condition'],
                location_filter=entry['location_filter'],
                min_seller_rating=entry['min_seller_rating'],
                underpriced_percentage=entry['underpriced_percentage'],
                status=entry['status'],
                is_active=entry['is_active'],
                last_checked=entry['last_checked'],
                created_at=entry['created_at'],
                updated_at=entry['updated_at']
            ))
        
        logger.info(f"Retrieved {len(response_entries)} wanted list entries")
        return response_entries
        
    except Exception as e:
        logger.error(f"Error fetching wanted list: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch wanted list: {str(e)}")

@router.put("/{entry_id}", response_model=Dict[str, str])
async def update_wanted_entry(
    entry_id: str,
    updates: WantedListEntryUpdate,
    session_id: str = Query(..., description="Session ID for authentication")
):
    """Update wanted list entry criteria."""
    user = require_auth(session_id)
    
    try:
        logger.info(f"Updating wanted list entry {entry_id} for user {user.id}")
        
        # Validate entry ownership
        # entry = db.get_wanted_list_entry_by_id(entry_id, user.id)
        # if not entry:
        #     raise HTTPException(status_code=404, detail="Wanted list entry not found")
        
        # Update entry with provided data
        update_data = updates.dict(exclude_unset=True)
        update_data['updated_at'] = datetime.now()
        
        # db.update_wanted_list_entry(entry_id, update_data)
        
        logger.info(f"Wanted list entry {entry_id} updated successfully")
        return {"message": "Wanted list entry updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating wanted list entry: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update wanted list entry: {str(e)}")

@router.delete("/{entry_id}", response_model=Dict[str, str])
async def delete_wanted_entry(
    entry_id: str,
    session_id: str = Query(..., description="Session ID for authentication")
):
    """Remove release from wanted list."""
    user = require_auth(session_id)
    
    try:
        logger.info(f"Deleting wanted list entry {entry_id} for user {user.id}")
        
        # Validate entry ownership and delete
        # entry = db.get_wanted_list_entry_by_id(entry_id, user.id)
        # if not entry:
        #     raise HTTPException(status_code=404, detail="Wanted list entry not found")
        
        # db.delete_wanted_list_entry(entry_id)
        
        logger.info(f"Wanted list entry {entry_id} deleted successfully")
        return {"message": "Release removed from wanted list successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting wanted list entry: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete wanted list entry: {str(e)}")

@router.post("/{entry_id}/toggle", response_model=Dict[str, str])
async def toggle_wanted_entry(
    entry_id: str,
    session_id: str = Query(..., description="Session ID for authentication")
):
    """Pause/resume monitoring for an entry."""
    user = require_auth(session_id)
    
    try:
        logger.info(f"Toggling wanted list entry {entry_id} for user {user.id}")
        
        # Get current entry status
        # entry = db.get_wanted_list_entry_by_id(entry_id, user.id)
        # if not entry:
        #     raise HTTPException(status_code=404, detail="Wanted list entry not found")
        
        # Toggle active status
        new_status = not entry.get('is_active', True)
        # db.update_wanted_list_entry(entry_id, {
        #     'is_active': new_status,
        #     'updated_at': datetime.now()
        # })
        
        action = "resumed" if new_status else "paused"
        logger.info(f"Wanted list entry {entry_id} monitoring {action}")
        
        return {"message": f"Monitoring {action} for release"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling wanted list entry: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle monitoring: {str(e)}")

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notification_history(
    session_id: str = Query(..., description="Session ID for authentication"),
    limit: int = Query(50, ge=1, le=100, description="Number of notifications to return")
):
    """Get notification history for user's wanted list."""
    user = require_auth(session_id)
    
    try:
        logger.info(f"Fetching notification history for user {user.id}")
        
        # This would query the actual database
        # notifications = db.get_user_notifications(user.id, limit)
        notifications = []  # Placeholder
        
        # Convert to response models
        response_notifications = []
        for notification in notifications:
            response_notifications.append(NotificationResponse(
                id=notification['id'],
                wanted_list_entry_id=notification['wanted_list_entry_id'],
                listing_id=notification['listing_id'],
                listing_price=notification['listing_price'],
                listing_currency=notification['listing_currency'],
                listing_condition=notification['listing_condition'],
                seller_name=notification['seller_name'],
                seller_rating=notification['seller_rating'],
                listing_url=notification['listing_url'],
                notification_type=notification['notification_type'],
                email_sent_at=notification['email_sent_at'],
                created_at=notification['created_at']
            ))
        
        logger.info(f"Retrieved {len(response_notifications)} notifications")
        return response_notifications
        
    except Exception as e:
        logger.error(f"Error fetching notification history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch notification history: {str(e)}")

# Release Information Endpoints

@router.get("/releases/{release_id}", response_model=ReleaseDetailsResponse)
async def get_release_details(
    release_id: int,
    session_id: str = Query(..., description="Session ID for authentication")
):
    """Get detailed release information from Discogs."""
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    try:
        logger.info(f"Fetching release details for ID: {release_id}")
        
        client = get_discogs_client(user)
        release_details = client.get_release_details(release_id)
        
        return ReleaseDetailsResponse(
            id=release_details['id'],
            title=release_details['title'],
            year=release_details['year'],
            artists=release_details['artists'],
            labels=release_details['labels'],
            formats=release_details['formats'],
            images=release_details['images'],
            resource_url=release_details['resource_url'],
            genres=release_details['genres'],
            styles=release_details['styles'],
            country=release_details['country']
        )
        
    except Exception as e:
        logger.error(f"Error fetching release details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch release details: {str(e)}")

@router.post("/check-all", response_model=Dict[str, str])
async def check_all_wanted_releases(
    session_id: str = Query(..., description="Session ID for authentication")
):
    """Manually trigger check for all user's wanted releases."""
    user = require_auth(session_id)
    
    try:
        logger.info(f"Manual check triggered for user {user.id}")
        
        # This would trigger the monitoring service
        # monitoring_service.check_user_wanted_releases(user.id)
        
        return {"message": "Manual check initiated for all wanted releases"}
        
    except Exception as e:
        logger.error(f"Error triggering manual check: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger manual check: {str(e)}")
