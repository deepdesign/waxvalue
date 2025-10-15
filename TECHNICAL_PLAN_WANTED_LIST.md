# Technical Implementation Plan: Wanted List Monitoring

## 🏗️ **Architecture Overview**

### **System Components**
1. **Frontend:** New React components for wanted list management
2. **Backend:** FastAPI endpoints for CRUD operations and monitoring
3. **Database:** New tables for wanted items and monitoring data
4. **Background Service:** Cron job for hourly monitoring
5. **Email Service:** SMTP integration for alerts
6. **Discogs Integration:** Enhanced API client for release monitoring

## 📁 **File Structure Changes**

### **Frontend Changes**
```
src/
├── app/
│   └── wanted-list/
│       ├── page.tsx                 # Main wanted list page
│       ├── add/
│       │   └── page.tsx            # Add release page
│       └── [id]/
│           └── edit/
│               └── page.tsx        # Edit release page
├── components/
│   ├── WantedListTable.tsx         # Main wanted list table
│   ├── AddReleaseModal.tsx         # Add release modal/form
│   ├── ReleasePreview.tsx          # Release info preview
│   ├── WantedItemCard.tsx          # Individual wanted item card
│   └── AlertHistory.tsx            # Alert history component
└── lib/
    ├── discogsParser.ts            # Parse Discogs URLs
    └── wantedListApi.ts            # API client for wanted list
```

### **Backend Changes**
```
backend/
├── models/
│   └── wanted_item.py              # WantedItem database model
├── routers/
│   └── wanted_items.py             # Wanted items API routes
├── services/
│   ├── wanted_list_monitor.py      # Background monitoring service
│   ├── discogs_monitor.py          # Discogs API monitoring
│   └── email_alerts.py             # Email notification service
├── schemas/
│   └── wanted_item.py              # Pydantic schemas
└── tasks/
    └── monitor_wanted_items.py     # Celery/background tasks
```

## 🗄️ **Database Schema**

### **New Tables**
```sql
-- User wanted items
CREATE TABLE user_wanted_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discogs_release_id INTEGER NOT NULL,
    release_title TEXT NOT NULL,
    release_artist TEXT NOT NULL,
    release_image_url TEXT,
    release_url TEXT,
    
    -- Monitoring criteria
    max_price DECIMAL(10,2),
    min_condition VARCHAR(10) CHECK (min_condition IN ('M', 'NM', 'VG+', 'VG', 'G+', 'G')),
    undervalue_percentage INTEGER DEFAULT 0,
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP,
    last_match_found TIMESTAMP,
    total_alerts_sent INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Alert history
CREATE TABLE wanted_item_alerts (
    id SERIAL PRIMARY KEY,
    wanted_item_id INTEGER NOT NULL REFERENCES user_wanted_items(id) ON DELETE CASCADE,
    discogs_listing_id INTEGER NOT NULL,
    listing_price DECIMAL(10,2) NOT NULL,
    listing_condition TEXT NOT NULL,
    alert_type VARCHAR(20) CHECK (alert_type IN ('price_match', 'undervalued', 'condition_match')),
    email_sent_at TIMESTAMP,
    email_opened_at TIMESTAMP,
    link_clicked_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_wanted_items_user_active ON user_wanted_items(user_id, is_active);
CREATE INDEX idx_user_wanted_items_release ON user_wanted_items(discogs_release_id);
CREATE INDEX idx_wanted_item_alerts_wanted_item ON wanted_item_alerts(wanted_item_id);
```

## 🔌 **API Endpoints**

### **Wanted Items Management**
```python
@router.post("/wanted-items")
async def create_wanted_item(
    wanted_item: WantedItemCreate,
    current_user: User = Depends(get_current_user)
):
    """Add new release to wanted list"""
    pass

@router.get("/wanted-items")
async def get_wanted_items(
    current_user: User = Depends(get_current_user)
):
    """Get user's wanted list"""
    pass

@router.put("/wanted-items/{item_id}")
async def update_wanted_item(
    item_id: int,
    wanted_item: WantedItemUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update wanted item criteria"""
    pass

@router.delete("/wanted-items/{item_id}")
async def delete_wanted_item(
    item_id: int,
    current_user: User = Depends(get_current_user)
):
    """Remove item from wanted list"""
    pass
```

### **Release Information**
```python
@router.post("/wanted-items/parse")
async def parse_discogs_url(
    url: str,
    current_user: User = Depends(get_current_user)
):
    """Parse Discogs URL and return release information"""
    pass

@router.get("/wanted-items/{item_id}/status")
async def get_item_monitoring_status(
    item_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get monitoring status and alert history"""
    pass
```

## 🔄 **Background Monitoring Service**

### **Monitoring Logic**
```python
class WantedListMonitor:
    def __init__(self):
        self.discogs = DiscogsClient()
        self.email = EmailService()
        self.db = DatabaseManager()
    
    async def monitor_all_items(self):
        """Main monitoring loop - called hourly"""
        active_items = await self.db.get_active_wanted_items()
        
        for item in active_items:
            try:
                await self.check_item(item)
            except Exception as e:
                logger.error(f"Error monitoring item {item.id}: {e}")
    
    async def check_item(self, wanted_item):
        """Check single wanted item for matches"""
        # Search Discogs for listings
        listings = await self.discogs.search_listings(
            release_id=wanted_item.discogs_release_id,
            condition=wanted_item.min_condition,
            price_max=wanted_item.max_price
        )
        
        for listing in listings:
            if await self.is_new_match(wanted_item, listing):
                await self.send_alert(wanted_item, listing)
    
    async def is_new_match(self, wanted_item, listing):
        """Check if listing is a new match we haven't alerted on"""
        existing_alert = await self.db.get_alert_by_listing(
            wanted_item.id, listing.id
        )
        return existing_alert is None
    
    async def send_alert(self, wanted_item, listing):
        """Send email alert to user"""
        user = await self.db.get_user(wanted_item.user_id)
        
        await self.email.send_alert(
            to=user.email,
            wanted_item=wanted_item,
            listing=listing
        )
        
        # Record alert in database
        await self.db.create_alert(wanted_item.id, listing)
```

## 📧 **Email Service Integration**

### **Alert Templates**
```python
class EmailAlertService:
    def __init__(self):
        self.smtp_client = SMTPClient()
    
    async def send_price_alert(self, user, wanted_item, listing):
        """Send price match alert"""
        template = self.load_template('price_alert.html')
        
        context = {
            'user_name': user.first_name,
            'release_title': wanted_item.release_title,
            'release_artist': wanted_item.release_artist,
            'listing_price': listing.price,
            'listing_condition': listing.condition,
            'discogs_url': listing.url,
            'waxvalue_url': f"https://waxvalue.com/wanted-list"
        }
        
        await self.smtp_client.send_email(
            to=user.email,
            subject=f"🎯 WaxValue Alert: {wanted_item.release_title} Found!",
            html_content=template.render(context)
        )
```

## 🎨 **Frontend Implementation**

### **Main Wanted List Component**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { WantedItem } from '@/types'

export default function WantedListPage() {
  const [wantedItems, setWantedItems] = useState<WantedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchWantedItems()
  }, [])

  const fetchWantedItems = async () => {
    try {
      const response = await fetch('/api/backend/wanted-items')
      const data = await response.json()
      setWantedItems(data)
    } catch (error) {
      console.error('Failed to fetch wanted items:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🛒 Wanted List</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          + Add Release
        </button>
      </div>

      {wantedItems.length === 0 ? (
        <EmptyState onAddClick={() => setShowAddModal(true)} />
      ) : (
        <WantedListTable 
          items={wantedItems} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {showAddModal && (
        <AddReleaseModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchWantedItems}
        />
      )}
    </div>
  )
}
```

### **Add Release Modal**
```tsx
export function AddReleaseModal({ onClose, onSuccess }) {
  const [discogsUrl, setDiscogsUrl] = useState('')
  const [releaseInfo, setReleaseInfo] = useState(null)
  const [criteria, setCriteria] = useState({
    maxPrice: '',
    minCondition: 'NM',
    undervaluePercentage: 0
  })

  const parseDiscogsUrl = async () => {
    try {
      const response = await fetch('/api/backend/wanted-items/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: discogsUrl })
      })
      const data = await response.json()
      setReleaseInfo(data)
    } catch (error) {
      toast.error('Failed to parse Discogs URL')
    }
  }

  const addToWantedList = async () => {
    try {
      await fetch('/api/backend/wanted-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discogs_release_id: releaseInfo.id,
          ...criteria
        })
      })
      onSuccess()
      onClose()
      toast.success('Release added to wanted list!')
    } catch (error) {
      toast.error('Failed to add release')
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Add Release to Wanted List</h2>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Discogs URL or Release ID
          </label>
          <input
            type="text"
            value={discogsUrl}
            onChange={(e) => setDiscogsUrl(e.target.value)}
            placeholder="https://www.discogs.com/release/1234567"
            className="w-full input"
          />
          <button onClick={parseDiscogsUrl} className="btn btn-secondary mt-2">
            Parse Release Info
          </button>
        </div>

        {releaseInfo && (
          <>
            <ReleasePreview release={releaseInfo} />
            
            <div className="space-y-4">
              <h3 className="font-medium">Monitoring Criteria</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Maximum Price ($)
                </label>
                <input
                  type="number"
                  value={criteria.maxPrice}
                  onChange={(e) => setCriteria({...criteria, maxPrice: e.target.value})}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Minimum Condition
                </label>
                <select
                  value={criteria.minCondition}
                  onChange={(e) => setCriteria({...criteria, minCondition: e.target.value})}
                  className="select"
                >
                  <option value="M">Mint (M)</option>
                  <option value="NM">Near Mint (NM)</option>
                  <option value="VG+">Very Good Plus (VG+)</option>
                  <option value="VG">Very Good (VG)</option>
                  <option value="G+">Good Plus (G+)</option>
                  <option value="G">Good (G)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Alert if undervalued by (%)
                </label>
                <input
                  type="number"
                  value={criteria.undervaluePercentage}
                  onChange={(e) => setCriteria({...criteria, undervaluePercentage: e.target.value})}
                  min="0"
                  max="100"
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={addToWantedList} className="btn btn-primary">
                Add to Wanted List
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
```

## 🚀 **Deployment Considerations**

### **Background Service Setup**
```bash
# Add to crontab for hourly monitoring
0 * * * * cd /path/to/waxvalue && python -m backend.services.wanted_list_monitor

# Or use systemd service for better process management
```

### **Environment Variables**
```env
# Email service configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@waxvalue.com
SMTP_PASSWORD=your_password

# Discogs API
DISCOGS_USER_AGENT=WaxValue/1.0
DISCOGS_RATE_LIMIT=60  # requests per minute
```

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track**
- Number of wanted items per user
- Alert frequency and click-through rates
- Most monitored releases
- User engagement with alerts
- System performance metrics

### **Error Handling**
- Discogs API rate limiting
- Invalid release IDs
- Email delivery failures
- Database connection issues

---

**Implementation Ready** ✅  
**Technical Architecture Defined** ✅  
**Development Phases Planned** ✅
