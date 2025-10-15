# Discogs Price Alerts Feature Analysis

**Branch:** `feature/discogs-price-alerts`  
**Status:** Planning Phase  
**Created:** December 2024

## 🎯 Feature Overview

A comprehensive price alert system that allows users to monitor specific Discogs releases and receive notifications when listings match their criteria (price, condition, location, etc.).

## 🔍 Current System Analysis

### ✅ Existing Infrastructure
- **Discogs OAuth Integration:** Fully implemented with user authentication
- **DiscogsClient:** Available with methods for:
  - `get_user_inventory()` - Fetch user's inventory
  - `get_user_profile()` - Get user profile data
  - `get_user_info()` - Get user information
- **Session Management:** Robust session handling with user data persistence
- **Email System:** Ready for notification implementation
- **Navigation System:** Easy to extend with new sidebar entries

### 🔧 Required Extensions
- **New Discogs API Methods:** Need marketplace search and release details
- **Database Schema:** User wanted list storage
- **Background Jobs:** Scheduled monitoring tasks
- **UI Components:** Wanted list management interface

## 📊 Technical Requirements Analysis

### 1. **Discogs API Integration**

#### Current Capabilities:
```python
# Existing methods in DiscogsClient
client.get_user_inventory(username)  # User's inventory
client.get_user_profile(username)    # User profile
client.get_user_info()               # User info
```

#### Required New Methods:
```python
# Need to implement or verify availability
client.release(release_id)                    # Get release details
client.marketplace_search(release_id)         # Search marketplace listings
client.marketplace_stats(release_id)          # Get pricing statistics
```

#### API Endpoints Needed:
- `/releases/{release_id}` - Release metadata
- `/marketplace/search?release_id={id}` - Live listings
- `/marketplace/stats/{release_id}` - Price statistics

### 2. **Database Schema Design**

#### New Tables Required:

```sql
-- User's wanted list entries
CREATE TABLE wanted_list_entries (
    id UUID PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    discogs_release_id INTEGER NOT NULL,
    release_title VARCHAR,
    artist_name VARCHAR,
    release_year INTEGER,
    release_format VARCHAR,
    cover_image_url VARCHAR,
    
    -- Alert conditions
    max_price DECIMAL(10,2),
    max_price_currency VARCHAR(3),
    min_condition VARCHAR(10),
    location_filter VARCHAR(100),
    min_seller_rating DECIMAL(3,2),
    underpriced_percentage INTEGER,
    
    -- Status and monitoring
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP,
    status VARCHAR(20) DEFAULT 'monitoring', -- monitoring, price_matched, underpriced, no_listings
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, discogs_release_id)
);

-- Alert notifications sent
CREATE TABLE alert_notifications (
    id UUID PRIMARY KEY,
    wanted_list_entry_id UUID REFERENCES wanted_list_entries(id),
    listing_id INTEGER,
    listing_price DECIMAL(10,2),
    listing_currency VARCHAR(3),
    listing_condition VARCHAR(20),
    seller_name VARCHAR,
    seller_rating DECIMAL(3,2),
    listing_url VARCHAR,
    notification_type VARCHAR(20), -- price_matched, underpriced
    email_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **API Endpoints Design**

#### New Backend Endpoints:

```python
# Wanted List Management
@app.post("/wanted-list/add")
async def add_wanted_release(release_data: dict, session_id: str = None):
    """Add a release to user's wanted list"""
    
@app.get("/wanted-list")
async def get_wanted_list(session_id: str = None):
    """Get user's wanted list with status"""
    
@app.put("/wanted-list/{entry_id}")
async def update_wanted_entry(entry_id: str, updates: dict, session_id: str = None):
    """Update wanted list entry criteria"""
    
@app.delete("/wanted-list/{entry_id}")
async def delete_wanted_entry(entry_id: str, session_id: str = None):
    """Remove release from wanted list"""
    
@app.post("/wanted-list/{entry_id}/toggle")
async def toggle_wanted_entry(entry_id: str, session_id: str = None):
    """Pause/resume monitoring for an entry"""

# Release Information
@app.get("/releases/{release_id}")
async def get_release_details(release_id: int, session_id: str = None):
    """Get detailed release information from Discogs"""
    
@app.get("/releases/{release_id}/marketplace")
async def get_release_marketplace(release_id: int, session_id: str = None):
    """Get current marketplace listings for a release"""

# Monitoring
@app.post("/wanted-list/check-all")
async def check_all_wanted_releases(session_id: str = None):
    """Manually trigger check for all user's wanted releases"""
```

### 4. **Frontend Components**

#### New UI Components:

```typescript
// Main wanted list page
src/app/wanted-list/page.tsx

// Components
src/components/WantedListTable.tsx          // Main table view
src/components/AddReleaseModal.tsx          // Add new release modal
src/components/EditReleaseModal.tsx         // Edit existing entry
src/components/ReleaseSearch.tsx            // Search and select release
src/components/AlertSettings.tsx            // Configure alert criteria
src/components/NotificationHistory.tsx      // View past alerts
```

#### Navigation Update:
```typescript
// Add to DashboardLayout.tsx navigation array
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Wanted List', href: '/wanted-list', icon: HeartIcon }, // NEW
  { name: 'Automation', href: '/automation', icon: CpuChipIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Help & support', href: '/help', icon: QuestionMarkCircleIcon },
]
```

### 5. **Background Job System**

#### Monitoring Service:
```python
# New file: backend/services/monitoring_service.py
class WantedListMonitoringService:
    def __init__(self):
        self.discogs_client = None
        
    async def check_all_wanted_releases(self):
        """Check all active wanted releases for matches"""
        
    async def check_release_listings(self, release_id: int, criteria: dict):
        """Check specific release for matching listings"""
        
    async def send_alert_notification(self, entry_id: str, matched_listing: dict):
        """Send email notification for matched listing"""
```

#### Job Scheduling:
```python
# Integration with existing system
# Could use APScheduler or similar for hourly checks
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
scheduler.add_job(
    check_all_wanted_releases,
    'interval',
    hours=1,
    id='wanted_list_monitoring'
)
```

### 6. **Email Notification System**

#### Email Templates:
```html
<!-- templates/price_alert_email.html -->
<h2>🎵 Price Alert: {{release_title}}</h2>
<p><strong>Artist:</strong> {{artist_name}}</p>
<p><strong>Price:</strong> {{listing_price}} {{currency}}</p>
<p><strong>Condition:</strong> {{condition}}</p>
<p><strong>Seller:</strong> {{seller_name}} ({{seller_rating}}%)</p>
<p><a href="{{listing_url}}">View Listing on Discogs</a></p>
<p><a href="{{app_url}}">View in WaxValue</a></p>
```

### 7. **User Experience Flow**

#### Add Release Flow:
1. User clicks "Add Release" CTA
2. Modal opens with release input field
3. User pastes Discogs URL or enters release ID
4. System fetches and displays release details for confirmation
5. User configures alert criteria (price, condition, etc.)
6. System saves to wanted list and starts monitoring

#### Monitoring Flow:
1. Background job runs hourly
2. For each active wanted release:
   - Fetch current marketplace listings
   - Check against user criteria
   - If match found: send email notification
   - Update entry status in database
3. User receives email with listing details and links

#### Management Flow:
1. User views wanted list dashboard
2. Sees all tracked releases with current status
3. Can edit criteria, pause/resume, or delete entries
4. Can view notification history

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Database schema implementation
- [ ] Basic API endpoints for CRUD operations
- [ ] Discogs release details integration

### Phase 2: UI Components
- [ ] Wanted list page and navigation
- [ ] Add/edit release modals
- [ ] Release search and selection

### Phase 3: Monitoring System
- [ ] Background job implementation
- [ ] Marketplace listing checking
- [ ] Alert criteria evaluation

### Phase 4: Notifications
- [ ] Email notification system
- [ ] Email templates
- [ ] Notification history tracking

### Phase 5: Polish & Testing
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] User testing and feedback

## 🔒 Security Considerations

- **Rate Limiting:** Discogs API rate limits (60 requests/minute)
- **Data Validation:** Validate all user inputs and release IDs
- **Authentication:** Ensure all endpoints require valid session
- **Privacy:** Only store necessary release metadata

## 📈 Success Metrics

- **User Engagement:** Number of releases added to wanted lists
- **Alert Effectiveness:** Percentage of alerts that lead to purchases
- **System Performance:** Monitoring job execution time and reliability
- **User Satisfaction:** Feedback on alert accuracy and usefulness

## 🎯 MVP Scope

For initial release, focus on:
1. Basic release addition via URL/ID
2. Simple price and condition filtering
3. Hourly monitoring with email notifications
4. Basic wanted list management (view, edit, delete)

Future enhancements can include:
- Advanced filtering (location, seller rating)
- Price history graphs
- Batch import/export
- Browser extension
- Mobile app integration

---

**Next Steps:**
1. Validate Discogs API capabilities for marketplace search
2. Design and implement database schema
3. Create basic UI components
4. Implement core monitoring logic
5. Add email notification system
