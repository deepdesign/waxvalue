# Discogs Price Alerts - Implementation Plan

**Branch:** `feature/discogs-price-alerts`  
**Status:** Ready for Implementation  
**Created:** December 2024

## 🏗️ Implementation Strategy

### Phase 1: Database & Backend Foundation (Week 1)

#### 1.1 Database Schema Setup
```sql
-- Add to existing database or create new migration
-- File: backend/migrations/add_wanted_list_tables.sql

CREATE TABLE wanted_list_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    discogs_release_id INTEGER NOT NULL,
    release_title VARCHAR,
    artist_name VARCHAR,
    release_year INTEGER,
    release_format VARCHAR,
    cover_image_url VARCHAR,
    
    -- Alert conditions
    max_price DECIMAL(10,2),
    max_price_currency VARCHAR(3) DEFAULT 'USD',
    min_condition VARCHAR(10),
    location_filter VARCHAR(100),
    min_seller_rating DECIMAL(3,2),
    underpriced_percentage INTEGER,
    
    -- Status and monitoring
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP,
    status VARCHAR(20) DEFAULT 'monitoring',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, discogs_release_id)
);

CREATE TABLE alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wanted_list_entry_id UUID REFERENCES wanted_list_entries(id) ON DELETE CASCADE,
    listing_id INTEGER,
    listing_price DECIMAL(10,2),
    listing_currency VARCHAR(3),
    listing_condition VARCHAR(20),
    seller_name VARCHAR,
    seller_rating DECIMAL(3,2),
    listing_url VARCHAR,
    notification_type VARCHAR(20),
    email_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wanted_list_user_id ON wanted_list_entries(user_id);
CREATE INDEX idx_wanted_list_active ON wanted_list_entries(is_active);
CREATE INDEX idx_wanted_list_release_id ON wanted_list_entries(discogs_release_id);
```

#### 1.2 Extended Discogs Client
```python
# File: backend/discogs_extended.py
from discogs_client import DiscogsClient
from typing import Dict, List, Optional

class ExtendedDiscogsClient(DiscogsClient):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def get_release_details(self, release_id: int) -> Dict:
        """Get detailed release information"""
        try:
            release = self.release(release_id)
            return {
                'id': release.id,
                'title': release.title,
                'year': release.year,
                'artists': [artist.name for artist in release.artists],
                'labels': [label.name for label in release.labels],
                'formats': [format.name for format in release.formats],
                'images': [img['uri'] for img in release.images],
                'resource_url': release.resource_url
            }
        except Exception as e:
            raise Exception(f"Failed to fetch release details: {e}")
    
    def search_marketplace_listings(self, release_id: int, per_page: int = 50) -> List[Dict]:
        """Search marketplace listings for a specific release"""
        try:
            # Note: This might need to use marketplace search API
            # Discogs marketplace API structure may vary
            search_results = self.search(
                release_id=release_id,
                type='release',
                per_page=per_page
            )
            
            listings = []
            for result in search_results:
                if hasattr(result, 'listings'):
                    for listing in result.listings:
                        listings.append({
                            'id': listing.id,
                            'price': listing.price,
                            'currency': listing.currency,
                            'condition': listing.condition,
                            'sleeve_condition': listing.sleeve_condition,
                            'seller': listing.seller.username,
                            'seller_rating': listing.seller.rating,
                            'location': listing.ships_from,
                            'url': listing.uri
                        })
            return listings
        except Exception as e:
            raise Exception(f"Failed to search marketplace listings: {e}")
    
    def get_release_marketplace_stats(self, release_id: int) -> Dict:
        """Get marketplace statistics for pricing analysis"""
        try:
            # This would need to be implemented based on Discogs API capabilities
            # May need to aggregate data from multiple API calls
            stats = {
                'median_price': None,
                'average_price': None,
                'price_range': None,
                'total_listings': 0
            }
            return stats
        except Exception as e:
            raise Exception(f"Failed to get marketplace stats: {e}")
```

#### 1.3 Core API Endpoints
```python
# File: backend/wanted_list_api.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

router = APIRouter(prefix="/wanted-list", tags=["wanted-list"])

class WantedListEntry(BaseModel):
    discogs_release_id: int
    max_price: Optional[float] = None
    max_price_currency: str = "USD"
    min_condition: Optional[str] = None
    location_filter: Optional[str] = None
    min_seller_rating: Optional[float] = None
    underpriced_percentage: Optional[int] = None

class WantedListEntryResponse(BaseModel):
    id: str
    discogs_release_id: int
    release_title: str
    artist_name: str
    release_year: Optional[int]
    release_format: Optional[str]
    cover_image_url: Optional[str]
    max_price: Optional[float]
    max_price_currency: str
    min_condition: Optional[str]
    status: str
    is_active: bool
    last_checked: Optional[datetime]
    created_at: datetime

@router.post("/add")
async def add_wanted_release(
    release_data: WantedListEntry,
    session_id: str = None
):
    """Add a release to user's wanted list"""
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    try:
        # Validate release exists on Discogs
        client = get_discogs_client(user)
        release_details = client.get_release_details(release_data.discogs_release_id)
        
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
            'created_at': datetime.now()
        }
        
        # Save to database (implement database layer)
        # db.save_wanted_list_entry(entry_data)
        
        return {"message": "Release added to wanted list", "entry_id": entry_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add release: {str(e)}")

@router.get("/", response_model=List[WantedListEntryResponse])
async def get_wanted_list(session_id: str = None):
    """Get user's wanted list with current status"""
    user = require_auth(session_id)
    
    try:
        # Fetch from database
        # entries = db.get_wanted_list_entries(user.id)
        entries = []  # Placeholder
        
        return entries
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get wanted list: {str(e)}")

@router.delete("/{entry_id}")
async def delete_wanted_entry(entry_id: str, session_id: str = None):
    """Remove release from wanted list"""
    user = require_auth(session_id)
    
    try:
        # Verify ownership and delete
        # db.delete_wanted_list_entry(entry_id, user.id)
        
        return {"message": "Release removed from wanted list"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete entry: {str(e)}")
```

### Phase 2: Frontend Components (Week 2)

#### 2.1 Navigation Update
```typescript
// File: src/components/DashboardLayout.tsx
// Add HeartIcon import
import {
  HomeIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CpuChipIcon,
  HeartIcon, // NEW
} from '@heroicons/react/24/outline'

// Update navigation array
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Wanted List', href: '/wanted-list', icon: HeartIcon }, // NEW
  { name: 'Automation', href: '/automation', icon: CpuChipIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Help & support', href: '/help', icon: QuestionMarkCircleIcon },
]
```

#### 2.2 Main Wanted List Page
```typescript
// File: src/app/wanted-list/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, HeartIcon } from '@heroicons/react/24/outline'
import { WantedListTable } from '@/components/WantedListTable'
import { AddReleaseModal } from '@/components/AddReleaseModal'
import { Button } from '@/components/ui/Button'

interface WantedListEntry {
  id: string
  discogs_release_id: number
  release_title: string
  artist_name: string
  release_year?: number
  release_format?: string
  cover_image_url?: string
  max_price?: number
  max_price_currency: string
  min_condition?: string
  status: string
  is_active: boolean
  last_checked?: string
  created_at: string
}

export default function WantedListPage() {
  const [entries, setEntries] = useState<WantedListEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchWantedList()
  }, [])

  const fetchWantedList = async () => {
    try {
      setIsLoading(true)
      // API call to get wanted list
      const response = await fetch('/api/backend/wanted-list/', {
        credentials: 'include'
      })
      const data = await response.json()
      setEntries(data)
    } catch (error) {
      console.error('Failed to fetch wanted list:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRelease = async (releaseData: any) => {
    try {
      const response = await fetch('/api/backend/wanted-list/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(releaseData)
      })
      
      if (response.ok) {
        await fetchWantedList() // Refresh the list
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Failed to add release:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Wanted List
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor releases and get alerts when they match your criteria
          </p>
        </div>
        
        <Button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Release
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Releases</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{entries.length}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {entries.filter(e => e.is_active).length}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Price Matched</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {entries.filter(e => e.status === 'price_matched').length}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Underpriced</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {entries.filter(e => e.status === 'underpriced').length}
          </div>
        </div>
      </div>

      {/* Wanted List Table */}
      <WantedListTable 
        entries={entries}
        isLoading={isLoading}
        onRefresh={fetchWantedList}
      />

      {/* Add Release Modal */}
      {showAddModal && (
        <AddReleaseModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddRelease}
        />
      )}
    </div>
  )
}
```

#### 2.3 Add Release Modal Component
```typescript
// File: src/components/AddReleaseModal.tsx
'use client'

import { useState } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

interface AddReleaseModalProps {
  onClose: () => void
  onAdd: (releaseData: any) => void
}

export function AddReleaseModal({ onClose, onAdd }: AddReleaseModalProps) {
  const [step, setStep] = useState(1) // 1: Input, 2: Configure, 3: Confirm
  const [releaseUrl, setReleaseUrl] = useState('')
  const [releaseDetails, setReleaseDetails] = useState<any>(null)
  const [alertCriteria, setAlertCriteria] = useState({
    max_price: '',
    max_price_currency: 'USD',
    min_condition: '',
    location_filter: '',
    min_seller_rating: '',
    underpriced_percentage: ''
  })

  const handleStep1 = async () => {
    try {
      // Extract release ID from URL or validate direct ID
      const releaseId = extractReleaseId(releaseUrl)
      if (!releaseId) {
        alert('Invalid Discogs release URL or ID')
        return
      }

      // Fetch release details
      const response = await fetch(`/api/backend/releases/${releaseId}`, {
        credentials: 'include'
      })
      const details = await response.json()
      
      setReleaseDetails(details)
      setStep(2)
    } catch (error) {
      console.error('Failed to fetch release details:', error)
      alert('Failed to fetch release details')
    }
  }

  const handleStep2 = () => {
    setStep(3)
  }

  const handleConfirm = () => {
    const releaseData = {
      discogs_release_id: releaseDetails.id,
      ...alertCriteria,
      max_price: alertCriteria.max_price ? parseFloat(alertCriteria.max_price) : null,
      min_seller_rating: alertCriteria.min_seller_rating ? parseFloat(alertCriteria.min_seller_rating) : null,
      underpriced_percentage: alertCriteria.underpriced_percentage ? parseInt(alertCriteria.underpriced_percentage) : null
    }
    
    onAdd(releaseData)
  }

  const extractReleaseId = (url: string): string | null => {
    // Extract release ID from various Discogs URL formats
    const patterns = [
      /discogs\.com\/release\/(\d+)/,
      /discogs\.com\/.*\/release\/(\d+)/,
      /^(\d+)$/ // Direct ID
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Release to Wanted List
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discogs Release URL or ID
              </label>
              <input
                type="text"
                value={releaseUrl}
                onChange={(e) => setReleaseUrl(e.target.value)}
                placeholder="https://www.discogs.com/release/1234567 or just 1234567"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleStep1} disabled={!releaseUrl.trim()}>
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Find Release
              </Button>
            </div>
          </div>
        )}

        {step === 2 && releaseDetails && (
          <div className="space-y-4">
            {/* Release Details Display */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {releaseDetails.cover_image_url && (
                  <img
                    src={releaseDetails.cover_image_url}
                    alt={releaseDetails.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {releaseDetails.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {releaseDetails.artist_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {releaseDetails.release_year} • {releaseDetails.release_format}
                  </p>
                </div>
              </div>
            </div>

            {/* Alert Criteria Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Alert Criteria</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Price
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={alertCriteria.max_price}
                      onChange={(e) => setAlertCriteria(prev => ({...prev, max_price: e.target.value}))}
                      placeholder="50.00"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <select
                      value={alertCriteria.max_price_currency}
                      onChange={(e) => setAlertCriteria(prev => ({...prev, max_price_currency: e.target.value}))}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Condition
                  </label>
                  <select
                    value={alertCriteria.min_condition}
                    onChange={(e) => setAlertCriteria(prev => ({...prev, min_condition: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Any</option>
                    <option value="M">Mint (M)</option>
                    <option value="NM">Near Mint (NM)</option>
                    <option value="VG+">Very Good Plus (VG+)</option>
                    <option value="VG">Very Good (VG)</option>
                    <option value="G+">Good Plus (G+)</option>
                    <option value="G">Good (G)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Underpriced Alert (% below median)
                </label>
                <input
                  type="number"
                  value={alertCriteria.underpriced_percentage}
                  onChange={(e) => setAlertCriteria(prev => ({...prev, underpriced_percentage: e.target.value}))}
                  placeholder="15"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Optional: Alert when listings are X% below typical market price
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleStep2}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Confirm Release Addition
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ready to add this release to your wanted list?
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleConfirm}>
                Add to Wanted List
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Phase 3: Monitoring System (Week 3)

#### 3.1 Background Monitoring Service
```python
# File: backend/services/wanted_list_monitor.py
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict
from discogs_extended import ExtendedDiscogsClient

logger = logging.getLogger(__name__)

class WantedListMonitor:
    def __init__(self):
        self.monitoring_active = False
        
    async def start_monitoring(self):
        """Start the monitoring service"""
        self.monitoring_active = True
        logger.info("Wanted list monitoring started")
        
        while self.monitoring_active:
            try:
                await self.check_all_wanted_releases()
                # Wait 1 hour before next check
                await asyncio.sleep(3600)
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes before retry
    
    async def stop_monitoring(self):
        """Stop the monitoring service"""
        self.monitoring_active = False
        logger.info("Wanted list monitoring stopped")
    
    async def check_all_wanted_releases(self):
        """Check all active wanted releases for matches"""
        try:
            # Get all active wanted list entries from database
            # entries = db.get_active_wanted_list_entries()
            entries = []  # Placeholder
            
            for entry in entries:
                try:
                    await self.check_release_entry(entry)
                except Exception as e:
                    logger.error(f"Error checking entry {entry['id']}: {e}")
                    
        except Exception as e:
            logger.error(f"Error in check_all_wanted_releases: {e}")
    
    async def check_release_entry(self, entry: Dict):
        """Check a specific release entry for matching listings"""
        try:
            # Get user's Discogs credentials
            user = get_user_by_id(entry['user_id'])
            if not user or not user.accessToken:
                logger.warning(f"No Discogs auth for user {entry['user_id']}")
                return
            
            # Create authenticated client
            client = ExtendedDiscogsClient(
                consumer_key=os.getenv("DISCOGS_CONSUMER_KEY"),
                consumer_secret=os.getenv("DISCOGS_CONSUMER_SECRET"),
                access_token=user.accessToken,
                access_token_secret=user.accessTokenSecret
            )
            
            # Search for marketplace listings
            listings = client.search_marketplace_listings(entry['discogs_release_id'])
            
            # Check each listing against criteria
            for listing in listings:
                if self.matches_criteria(listing, entry):
                    # Send notification
                    await self.send_alert_notification(entry, listing)
                    
                    # Update entry status
                    await self.update_entry_status(entry['id'], 'price_matched')
                    
                    # Log notification
                    await self.log_notification(entry['id'], listing, 'price_matched')
            
            # Update last checked timestamp
            await self.update_last_checked(entry['id'])
            
        except Exception as e:
            logger.error(f"Error checking release entry: {e}")
    
    def matches_criteria(self, listing: Dict, entry: Dict) -> bool:
        """Check if a listing matches the entry's criteria"""
        try:
            # Check price criteria
            if entry['max_price']:
                listing_price = float(listing['price'])
                if listing_price > entry['max_price']:
                    return False
            
            # Check condition criteria
            if entry['min_condition']:
                condition_order = {'M': 0, 'NM': 1, 'VG+': 2, 'VG': 3, 'G+': 4, 'G': 5}
                listing_condition = listing['condition']
                min_condition = entry['min_condition']
                
                if condition_order.get(listing_condition, 6) > condition_order.get(min_condition, 0):
                    return False
            
            # Check location filter
            if entry['location_filter']:
                if entry['location_filter'].lower() not in listing['location'].lower():
                    return False
            
            # Check seller rating
            if entry['min_seller_rating']:
                if listing['seller_rating'] < entry['min_seller_rating']:
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error in matches_criteria: {e}")
            return False
    
    async def send_alert_notification(self, entry: Dict, listing: Dict):
        """Send email notification for matched listing"""
        try:
            # Get user email
            user = get_user_by_id(entry['user_id'])
            if not user or not user.email:
                logger.warning(f"No email for user {entry['user_id']}")
                return
            
            # Prepare email data
            email_data = {
                'to': user.email,
                'subject': f"🎵 Price Alert: {entry['release_title']}",
                'template': 'price_alert',
                'data': {
                    'release_title': entry['release_title'],
                    'artist_name': entry['artist_name'],
                    'listing_price': listing['price'],
                    'currency': listing['currency'],
                    'condition': listing['condition'],
                    'seller_name': listing['seller'],
                    'seller_rating': listing['seller_rating'],
                    'listing_url': listing['url'],
                    'app_url': f"{FRONTEND_URL}/wanted-list"
                }
            }
            
            # Send email (implement email service)
            # await email_service.send_email(email_data)
            
            logger.info(f"Alert sent for release {entry['discogs_release_id']}")
            
        except Exception as e:
            logger.error(f"Error sending alert notification: {e}")
```

### Phase 4: Email Notifications (Week 4)

#### 4.1 Email Service
```python
# File: backend/services/email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import Dict

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@waxvalue.com')
    
    async def send_email(self, email_data: Dict):
        """Send email notification"""
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = email_data['to']
            msg['Subject'] = email_data['subject']
            
            # HTML content
            html_content = self.render_email_template(
                email_data['template'], 
                email_data['data']
            )
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
                
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise
    
    def render_email_template(self, template_name: str, data: Dict) -> str:
        """Render email template with data"""
        if template_name == 'price_alert':
            return self.render_price_alert_template(data)
        return ""
    
    def render_price_alert_template(self, data: Dict) -> str:
        """Render price alert email template"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Price Alert - {data['release_title']}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">🎵 Price Alert: {data['release_title']}</h2>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Release Details</h3>
                    <p><strong>Artist:</strong> {data['artist_name']}</p>
                    <p><strong>Price:</strong> {data['listing_price']} {data['currency']}</p>
                    <p><strong>Condition:</strong> {data['condition']}</p>
                    <p><strong>Seller:</strong> {data['seller_name']} ({data['seller_rating']}% rating)</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{data['listing_url']}" 
                       style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
                        View on Discogs
                    </a>
                    <a href="{data['app_url']}" 
                       style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        View in WaxValue
                    </a>
                </div>
                
                <p style="font-size: 12px; color: #6b7280; text-align: center;">
                    This alert was sent because a listing matched your wanted list criteria.
                </p>
            </div>
        </body>
        </html>
        """
```

## 🚀 Deployment Strategy

### 1. Database Migration
```bash
# Create migration file
psql -d waxvalue -f backend/migrations/add_wanted_list_tables.sql
```

### 2. Environment Variables
```bash
# Add to .env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@waxvalue.com
```

### 3. Background Service Setup
```bash
# Add to PM2 ecosystem
pm2 start backend/services/monitor.py --name "wanted-list-monitor"
```

## 📋 Testing Checklist

- [ ] Release addition via URL/ID
- [ ] Release addition via manual ID
- [ ] Alert criteria configuration
- [ ] Marketplace listing search
- [ ] Criteria matching logic
- [ ] Email notification sending
- [ ] Wanted list management (edit/delete)
- [ ] Status updates and monitoring
- [ ] Error handling and edge cases
- [ ] Performance with large wanted lists

## 🎯 Success Metrics

- **User Adoption:** Number of releases added to wanted lists
- **Alert Accuracy:** Percentage of alerts that match user intent
- **Response Time:** Time from listing match to notification
- **User Engagement:** Clicks on alert emails and app visits

---

**Ready for Implementation!** 🚀

This comprehensive plan provides a clear roadmap for implementing the Discogs Price Alerts feature with proper architecture, error handling, and user experience considerations.
