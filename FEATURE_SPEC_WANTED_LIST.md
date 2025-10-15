# Feature Specification: Wanted List Monitoring

## 🎯 **Feature Overview**
Allow users to create a "wanted list" of releases they want to purchase, with automatic monitoring and email alerts when items become available at specified price/condition criteria.

## 🔧 **Technical Implementation**

### **Database Schema**
```sql
-- New table for user wanted items
CREATE TABLE user_wanted_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    discogs_release_id INTEGER NOT NULL,
    release_title TEXT NOT NULL,
    release_artist TEXT NOT NULL,
    release_image_url TEXT,
    
    -- Monitoring criteria
    max_price DECIMAL(10,2),
    min_condition TEXT CHECK (min_condition IN ('M', 'NM', 'VG+', 'VG', 'G+', 'G')),
    undervalue_percentage INTEGER DEFAULT 0, -- Alert if X% undervalued
    
    -- Status tracking
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP,
    last_match_found TIMESTAMP,
    total_alerts_sent INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient monitoring queries
CREATE INDEX idx_user_wanted_items_active ON user_wanted_items(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_wanted_items_release ON user_wanted_items(discogs_release_id);
```

### **API Endpoints**
```typescript
// New API routes needed:
POST   /api/backend/wanted-items           // Add new wanted item
GET    /api/backend/wanted-items           // Get user's wanted list
PUT    /api/backend/wanted-items/:id       // Update wanted item
DELETE /api/backend/wanted-items/:id       // Delete wanted item
POST   /api/backend/wanted-items/parse     // Parse Discogs URL and get release info
GET    /api/backend/wanted-items/status    // Get monitoring status
```

### **Background Monitoring Service**
```python
# New monitoring service
class WantedListMonitor:
    def __init__(self):
        self.discogs_client = DiscogsClient()
        self.email_service = EmailService()
    
    async def check_all_wanted_items(self):
        """Check all active wanted items for new listings"""
        wanted_items = await self.get_active_wanted_items()
        
        for item in wanted_items:
            await self.check_item_listings(item)
    
    async def check_item_listings(self, wanted_item):
        """Check listings for a specific wanted item"""
        listings = await self.discogs_client.search_listings(
            release_id=wanted_item.discogs_release_id,
            condition=wanted_item.min_condition,
            max_price=wanted_item.max_price
        )
        
        for listing in listings:
            if self.matches_criteria(listing, wanted_item):
                await self.send_alert(wanted_item, listing)
```

## 🎨 **User Interface Design**

### **Navigation**
- New sidebar entry: "Wanted List" with shopping cart icon
- Route: `/wanted-list`

### **Main Wanted List Screen**
```
┌─────────────────────────────────────────────────────────────┐
│ 🛒 Wanted List                                    [+ Add Release] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Empty State - if no items]                               │
│  📋 No releases in your wanted list                        │
│  Start by adding releases you want to monitor              │
│  [Add Your First Release]                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Wanted Items List - if items exist]                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Album Art] The Beatles - Abbey Road          [Edit] [×] │ │
│  │ Condition: NM+ | Max Price: $50 | Undervalued: 20%      │ │
│  │ Status: Monitoring | Last Check: 2 hours ago            │ │
│  │ [3 alerts sent] | [View on Discogs]                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Add Release Modal/Screen**
```
┌─────────────────────────────────────────────────────────────┐
│ ➕ Add Release to Wanted List                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Paste Discogs URL or enter Release ID:                    │
│  [https://www.discogs.com/release/1234567                  ] │
│  [Auto-detect Release Info]                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ [Album Art] The Beatles - Abbey Road (1969)             │ │
│  │ Released: 1969 • Label: Apple Records                   │ │
│  │ Format: Vinyl, LP, Album, Stereo                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Monitoring Criteria:                                       │
│                                                             │
│  Maximum Price: $[50.00                                    ] │
│  Minimum Condition: [Near Mint (NM) ▼]                     │
│  Alert if undervalued by: [20]%                            │
│                                                             │
│  [Cancel]                              [Add to Wanted List] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Email Alert Template**
```html
Subject: 🎯 WaxValue Alert: The Beatles - Abbey Road Found!

Hi [User Name],

Great news! We found a release from your wanted list that matches your criteria:

🎵 The Beatles - Abbey Road (1969)
💰 Price: $35.00 (20% undervalued!)
📋 Condition: Near Mint (NM)
🔗 [View on Discogs](https://discogs.com/sell/item/12345)

[View All Alerts in WaxValue](https://waxvalue.com/wanted-list)

Happy collecting!
- The WaxValue Team
```

## 🔄 **Monitoring Workflow**

### **Hourly Monitoring Process**
1. **Fetch Active Items:** Get all user wanted items where `is_active = true`
2. **Check Each Release:** Query Discogs API for new listings
3. **Apply Filters:** Filter by condition, price, undervalue criteria
4. **Send Alerts:** Email users for matching items
5. **Update Status:** Record last check time and alert counts

### **Discogs API Integration**
```python
# Example API calls needed:
release_info = discogs.get_release(release_id)
listings = discogs.search_listings(
    release_id=release_id,
    condition=min_condition,
    price_max=max_price,
    sort='price',
    sort_order='asc'
)

# Check if listing is undervalued
market_price = get_market_price(release_id)
is_undervalued = listing.price < (market_price * (1 - undervalue_percentage/100))
```

## 📊 **User Experience Flow**

### **Adding a Release**
1. User clicks "Add Release" button
2. Pastes Discogs URL or enters release ID
3. App fetches release details and displays preview
4. User sets monitoring criteria (price, condition, undervalue %)
5. User clicks "Add to Wanted List"
6. Item appears in wanted list with "Monitoring" status

### **Receiving Alerts**
1. Background service finds matching listing
2. Email sent with release details and Discogs link
3. User clicks link to view listing on Discogs
4. User can purchase directly on Discogs

### **Managing Wanted List**
1. User views wanted list dashboard
2. Can edit criteria, pause monitoring, or delete items
3. Can view alert history and statistics
4. Can export wanted list or share with others

## 🛠 **Implementation Phases**

### **Phase 1: Core Infrastructure**
- [ ] Database schema and migrations
- [ ] Basic API endpoints for CRUD operations
- [ ] Discogs URL parsing and release info fetching
- [ ] Basic UI for wanted list management

### **Phase 2: Monitoring System**
- [ ] Background monitoring service
- [ ] Discogs API integration for listing searches
- [ ] Price and condition filtering logic
- [ ] Basic email notification system

### **Phase 3: Enhanced Features**
- [ ] Advanced filtering options
- [ ] Alert history and statistics
- [ ] Email templates and customization
- [ ] Performance optimization and caching

### **Phase 4: Polish & Launch**
- [ ] UI/UX refinements
- [ ] Error handling and edge cases
- [ ] Documentation and help system
- [ ] Beta testing and feedback integration

## 🔒 **Security & Privacy**

- **Data Protection:** User wanted lists are private
- **Rate Limiting:** Respect Discogs API rate limits
- **Email Privacy:** No sharing of email addresses
- **Data Retention:** Configurable alert history retention

## 📈 **Success Metrics**

- **User Engagement:** Number of wanted items added
- **Alert Effectiveness:** Click-through rates on email alerts
- **User Satisfaction:** Feedback on alert accuracy and usefulness
- **System Performance:** Monitoring service uptime and response times

---

**Ready for Development** ✅  
**Technical Feasibility Confirmed** ✅  
**Feature Specification Complete** ✅
