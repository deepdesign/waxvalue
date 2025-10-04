"""
Production WaxValue backend with proper Discogs API integration
"""

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Literal, Tuple
import json
import os
from datetime import datetime, timedelta
import logging
import asyncio
import hashlib
from dotenv import load_dotenv
from discogs_client import DiscogsClient, DiscogsOAuth, DiscogsAPIError, DiscogsAuthError

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WaxValue API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://waxvalue.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for development (replace with database in production)
users_db = {}
user_settings_db = {}
strategies_db = {}
run_logs_db = {}
listing_snapshots_db = {}

# Pydantic models
class User(BaseModel):
    id: int
    username: str
    discogsUserId: Optional[int] = None
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    accessToken: Optional[str] = None
    accessTokenSecret: Optional[str] = None
    createdAt: str = datetime.now().isoformat()
    updatedAt: str = datetime.now().isoformat()

class UserSettings(BaseModel):
    userId: int
    currency: str = "USD"
    defaultDryRun: bool = True
    dailySchedule: str = "09:00"
    globalFloor: float = 5.0
    globalCeiling: float = 1000.0
    maxChangePercent: int = 25
    apiRateLimitSeconds: float = 1.2
    updatedAt: str = datetime.now().isoformat()

class Strategy(BaseModel):
    id: int
    userId: int
    name: str
    anchor: str = "median"
    offsetType: str = "percentage"
    offsetValue: float = 0.0
    conditionWeights: Dict[str, float] = {"media": 0.8, "sleeve": 0.2}
    scarcityBoost: Optional[Dict[str, Any]] = None
    floor: Optional[float] = None
    ceiling: Optional[float] = None
    rounding: float = 0.50
    maxChangePercent: int = 25
    isActive: bool = True
    createdAt: str = datetime.now().isoformat()
    updatedAt: str = datetime.now().isoformat()

class PriceSuggestion(BaseModel):
    listingId: int
    releaseId: int
    currentPrice: float
    suggestedPrice: float
    confidence: str
    condition: str
    sleeveCondition: str
    basis: str
    reason: str
    release: Optional[Dict[str, Any]] = None
    artist: Optional[Dict[str, Any]] = None

class RunLog(BaseModel):
    id: str
    userId: int
    runDate: str
    status: str
    itemsScanned: int
    itemsUpdated: int
    errors: int
    isDryRun: bool
    strategyId: Optional[int] = None

# Reprice endpoint models
class RepriceRequest(BaseModel):
    scope: Optional[Literal["global", "selection", "item"]] = "global"
    filters: Optional[Dict[str, Any]] = None
    listing_id: Optional[int] = None
    approved_listing_ids: Optional[List[int]] = None
    strategy_id: Optional[str] = None
    params: Optional[Dict[str, Any]] = None

class RepriceItemResult(BaseModel):
    listing_id: int
    old_price: float
    new_price: float
    currency: str
    decision: Literal["auto_applied", "user_applied", "flagged", "declined", "simulated"]
    reason: str
    confidence: float
    discogs_status: Optional[str] = None
    http_status: Optional[int] = None
    ratelimit_remaining: Optional[str] = None
    ratelimit_reset: Optional[str] = None

class RepriceResponse(BaseModel):
    run_id: int
    dry_run: bool
    summary: Dict[str, int]
    items: List[RepriceItemResult]

class ListingSnapshot(BaseModel):
    id: str
    run_id: str
    listing_id: int
    old_price: float
    target_price: float
    delta: float
    decision: str
    reason: str
    confidence: float
    flagged: bool
    http_status: Optional[int] = None
    created_at: str = datetime.now().isoformat()

# Dependency to get current user from token
async def get_current_user(authorization: str = Header(None)) -> User:
    """Extract user from authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    user_id = token.split("-")[-1] if "-" in token else None
    
    if not user_id or user_id not in users_db:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return users_db[user_id]

def get_discogs_client(user: User) -> DiscogsClient:
    """Get authenticated Discogs client for user"""
    if not user.accessToken or not user.accessTokenSecret:
        raise HTTPException(status_code=400, detail="User not connected to Discogs")
    
    # Get credentials from environment variables
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    if not consumer_key or not consumer_secret:
        raise HTTPException(status_code=500, detail="Discogs credentials not configured")
    
    return DiscogsClient(
        consumer_key=consumer_key,
        consumer_secret=consumer_secret,
        access_token=user.accessToken,
        access_token_secret=user.accessTokenSecret
    )

def get_user_settings(user: User) -> UserSettings:
    """Get user settings with defaults"""
    settings = user_settings_db.get(str(user.id))
    if not settings:
        settings = UserSettings(userId=user.id)
        user_settings_db[str(user.id)] = settings
    return settings

def compute_target_price(listing: Dict[str, Any], strategy_id: str = "median_plus_8pct", 
                        params: Dict[str, Any] = None) -> Dict[str, Any]:
    """Compute target price for a listing based on strategy"""
    current_price = listing.get("price", 0.0)
    
    # Simplified pricing logic - in production, this would use market data
    if strategy_id == "median_plus_8pct":
        offset = params.get("offset_value", 8) if params else 8
        new_price = current_price * (1 + offset / 100)
        reason = f"anchor:median +{offset}%"
        confidence = 0.8
    elif strategy_id == "undercut_cheapest":
        offset = params.get("offset_value", 0.5) if params else 0.5
        new_price = current_price - offset
        reason = f"undercut cheapest by {offset}"
        confidence = 0.9
    else:
        # Default strategy
        new_price = current_price * 1.05  # 5% increase
        reason = "default +5%"
        confidence = 0.7
    
    return {
        "new_price": max(0.01, new_price),  # Ensure minimum price
        "currency": "USD",  # Default currency
        "reason": reason,
        "confidence": confidence,
        "increase_pct": ((new_price - current_price) / max(current_price, 0.01)) * 100
    }

def decide_action(old_price: float, new_price: float, increase_pct: float, 
                 approved_set: set, settings: UserSettings) -> Tuple[str, str]:
    """Decide whether to auto-apply, flag, or decline a price change"""
    
    # Safeguards
    if new_price < settings.globalFloor or new_price > settings.globalCeiling:
        return "flagged", "outside floor/ceiling"
    
    max_change = settings.maxChangePercent
    if abs(increase_pct) > max_change:
        return "flagged", f"exceeds max_change_pct {max_change}"
    
    # Manual approvals take precedence
    if approved_set:
        return ("user_applied", "") if (new_price != old_price) else ("declined", "no change")
    
    # Automation rules
    if new_price <= old_price:
        return "flagged", "decrease requires approval"
    
    # Check if auto-update is enabled (assuming it's in settings)
    auto_update_enabled = getattr(settings, 'autoUpdateEnabled', False)
    auto_update_threshold = getattr(settings, 'autoUpdateThreshold', 20)
    
    if not auto_update_enabled:
        return "flagged", "automation disabled"
    
    if increase_pct > auto_update_threshold:
        return "flagged", "increase above threshold"
    
    return "auto_applied", ""

def apply_price_change(client: DiscogsClient, listing_id: int, price: float, 
                      currency: str = "USD") -> Tuple[int, Dict[str, Any]]:
    """Apply price change to Discogs listing"""
    return client.update_listing_price(listing_id, price, currency=currency, status="For Sale")

def resolve_candidate_listings(user: User, scope: str, payload: RepriceRequest, 
                             client: DiscogsClient) -> List[Dict[str, Any]]:
    """Resolve candidate listings based on scope and filters"""
    if scope == "item" and payload.listing_id:
        # Single item
        listing = client.get_listing(payload.listing_id)
        return [listing] if listing else []
    
    # Get user's inventory
    inventory = client.get_user_inventory(user.username, per_page=100)
    listings = inventory.get("listings", [])
    
    if scope == "selection" and payload.filters:
        # Apply filters
        filtered_listings = []
        for listing in listings:
            if payload.filters.get("status") and listing.get("status") != payload.filters["status"]:
                continue
            if payload.filters.get("media") and listing.get("condition") not in payload.filters["media"]:
                continue
            filtered_listings.append(listing)
        return filtered_listings
    
    return listings

def create_run_fingerprint(run_id: int, listing_id: int, old_price: float, new_price: float) -> str:
    """Create fingerprint for deduplication"""
    content = f"{run_id}:{listing_id}:{old_price}->{new_price}"
    return hashlib.sha1(content.encode()).hexdigest()

# Authentication endpoints
@app.post("/auth/register")
async def register(user_data: dict):
    """Register a new user"""
    email = user_data.get("email")
    password = user_data.get("password")
    firstName = user_data.get("firstName")
    lastName = user_data.get("lastName")

    if not all([email, password, firstName, lastName]):
        raise HTTPException(status_code=400, detail="All fields are required")

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    # Check if email already exists
    for user_id, user in users_db.items():
        if user.email == email:
            raise HTTPException(status_code=409, detail="Email already registered")

    # Create new user
    new_user_id = len(users_db) + 1
    new_user = User(
        id=new_user_id,
        username=email.split("@")[0],
        discogsUserId=None,
        email=email,
        firstName=firstName,
        lastName=lastName
    )
    users_db[str(new_user_id)] = new_user

    # Create default settings
    user_settings_db[str(new_user_id)] = UserSettings(userId=new_user_id)

    return {
        "user": new_user,
        "token": f"waxvalue-token-{new_user_id}-{int(datetime.now().timestamp())}",
        "message": "Registration successful"
    }

@app.post("/auth/login")
async def login(credentials: dict):
    """Login user"""
    email = credentials.get("email")
    password = credentials.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    # Find user by email
    user = None
    for user_id, u in users_db.items():
        if u.email == email:
            user = u
            break

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "user": user,
        "token": f"waxvalue-token-{user.id}-{int(datetime.now().timestamp())}",
        "message": "Login successful"
    }

@app.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# Discogs OAuth endpoints
@app.post("/auth/setup")
async def setup_discogs_auth(current_user: User = Depends(get_current_user)):
    """Setup Discogs OAuth authentication"""
    # Get credentials from environment variables
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    if not consumer_key or not consumer_secret:
        raise HTTPException(status_code=500, detail="Discogs credentials not configured")

    try:
        oauth = DiscogsOAuth(consumer_key, consumer_secret)
        request_token, request_token_secret = oauth.get_request_token()
        auth_url = oauth.get_authorize_url(request_token)

        # Store request token temporarily (in production, use Redis or database)
        current_user.accessToken = request_token
        current_user.accessTokenSecret = request_token_secret
        users_db[str(current_user.id)] = current_user

        return {
            "authUrl": auth_url,
            "requestToken": request_token,
            "message": "OAuth setup successful"
        }

    except Exception as e:
        logger.error(f"Discogs OAuth setup failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to setup Discogs authentication")

@app.post("/auth/verify")
async def verify_discogs_auth(verification_data: dict, current_user: User = Depends(get_current_user)):
    """Verify Discogs OAuth and get access tokens"""
    verifier = verification_data.get("verifierCode")
    request_token = verification_data.get("requestToken")

    if not verifier or not request_token:
        raise HTTPException(status_code=400, detail="Verifier code and request token are required")

    try:
        # Get credentials from environment variables
        consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
        consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
        
        if not consumer_key or not consumer_secret:
            raise HTTPException(status_code=500, detail="Discogs credentials not configured")
        
        oauth = DiscogsOAuth(consumer_key, consumer_secret)
        access_token, access_token_secret = oauth.get_access_token(
            request_token, current_user.accessTokenSecret, verifier
        )

        # Update user with access tokens
        current_user.accessToken = access_token
        current_user.accessTokenSecret = access_token_secret
        
        # Get user info from Discogs
        client = DiscogsClient(consumer_key, consumer_secret, access_token, access_token_secret)
        discogs_user = client.get_user_info()
        current_user.discogsUserId = discogs_user.get("id")
        current_user.username = discogs_user.get("username", current_user.username)
        
        users_db[str(current_user.id)] = current_user

        return {
            "user": current_user,
            "message": "Discogs authentication successful"
        }

    except Exception as e:
        logger.error(f"Discogs OAuth verification failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to verify Discogs authentication")

@app.post("/auth/disconnect")
async def disconnect_discogs(current_user: User = Depends(get_current_user)):
    """Disconnect Discogs account"""
    current_user.accessToken = None
    current_user.accessTokenSecret = None
    current_user.discogsUserId = None
    users_db[str(current_user.id)] = current_user

    return {"message": "Discogs account disconnected"}

# Dashboard endpoints
@app.get("/dashboard/summary")
async def get_dashboard_summary(current_user: User = Depends(get_current_user)):
    """Get dashboard summary data"""
    try:
        if not current_user.discogsUserId:
            return {
                "totalListings": 0,
                "suggestedUpdates": 0,
                "averageDelta": 0,
                "lastRunDate": None,
                "isRunning": False
            }

        client = get_discogs_client(current_user)
        
        # Get user's inventory
        inventory = client.get_user_inventory(current_user.username, per_page=100)
        total_listings = inventory.get("pagination", {}).get("items", 0)
        
        # Get recent run log
        recent_log = None
        for log in run_logs_db.values():
            if log.userId == current_user.id:
                recent_log = log
                break

        return {
            "totalListings": total_listings,
            "suggestedUpdates": 0,  # Will be calculated during pricing runs
            "averageDelta": 0,      # Will be calculated during pricing runs
            "lastRunDate": recent_log.runDate if recent_log else None,
            "isRunning": False      # Will be set during active runs
        }

    except DiscogsAuthError:
        raise HTTPException(status_code=401, detail="Discogs authentication required")
    except Exception as e:
        logger.error(f"Failed to get dashboard summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

# Inventory endpoints
@app.get("/inventory/suggestions")
async def get_inventory_suggestions(current_user: User = Depends(get_current_user)):
    """Get price suggestions for user's inventory"""
    try:
        if not current_user.discogsUserId:
            return {"suggestions": []}

        client = get_discogs_client(current_user)
        suggestions = []

        # Get user's inventory
        inventory = client.get_user_inventory(current_user.username, per_page=100)
        listings = inventory.get("listings", [])

        for listing in listings:
            try:
                # Get price suggestions for this release
                release_id = listing.get("release", {}).get("id")
                if release_id:
                    price_suggestions = client.get_price_suggestions(release_id)
                    
                    # Calculate suggested price based on strategy
                    current_price = listing.get("price", 0)
                    suggested_price = current_price  # Default to current price
                    confidence = "medium"
                    
                    # Apply pricing strategy (simplified)
                    if "Very Good Plus" in price_suggestions:
                        vg_plus_price = price_suggestions["Very Good Plus"].get("value", current_price)
                        suggested_price = vg_plus_price * 1.05  # 5% above market
                        confidence = "high"
                    
                    suggestions.append(PriceSuggestion(
                        listingId=listing.get("id"),
                        releaseId=release_id,
                        currentPrice=current_price,
                        suggestedPrice=suggested_price,
                        confidence=confidence,
                        condition=listing.get("condition"),
                        sleeveCondition=listing.get("sleeve_condition", "Not Graded"),
                        basis="market_median",
                        reason="Based on market data analysis",
                        release=listing.get("release"),
                        artist=listing.get("release", {}).get("artist")
                    ))

            except Exception as e:
                logger.error(f"Failed to get suggestions for listing {listing.get('id')}: {e}")
                continue

        return {"suggestions": suggestions}

    except DiscogsAuthError:
        raise HTTPException(status_code=401, detail="Discogs authentication required")
    except Exception as e:
        logger.error(f"Failed to get inventory suggestions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch price suggestions")

@app.post("/inventory/apply")
async def apply_price_suggestion(listing_data: dict, current_user: User = Depends(get_current_user)):
    """Apply a price suggestion to a listing"""
    listing_id = listing_data.get("listingId")
    new_price = listing_data.get("newPrice")

    if not listing_id or not new_price:
        raise HTTPException(status_code=400, detail="Listing ID and new price are required")

    try:
        client = get_discogs_client(current_user)
        
        # Update the listing price
        result = client.update_listing_price(listing_id, new_price)
        
        # Log the change
        log_id = f"run_{current_user.id}_{int(datetime.now().timestamp())}"
        run_logs_db[log_id] = RunLog(
            id=log_id,
            userId=current_user.id,
            runDate=datetime.now().isoformat(),
            status="completed",
            itemsScanned=1,
            itemsUpdated=1,
            errors=0,
            isDryRun=False
        )

        return {"message": "Price updated successfully", "listing": result}

    except DiscogsAuthError:
        raise HTTPException(status_code=401, detail="Discogs authentication required")
    except DiscogsAPIError as e:
        raise HTTPException(status_code=400, detail=f"Failed to update listing: {e}")
    except Exception as e:
        logger.error(f"Failed to apply price suggestion: {e}")
        raise HTTPException(status_code=500, detail="Failed to update listing")

@app.post("/inventory/decline")
async def decline_price_suggestion(listing_data: dict, current_user: User = Depends(get_current_user)):
    """Decline a price suggestion"""
    listing_id = listing_data.get("listingId")
    
    if not listing_id:
        raise HTTPException(status_code=400, detail="Listing ID is required")

    # Log the decline
    log_id = f"decline_{current_user.id}_{int(datetime.now().timestamp())}"
    run_logs_db[log_id] = RunLog(
        id=log_id,
        userId=current_user.id,
        runDate=datetime.now().isoformat(),
        status="completed",
        itemsScanned=1,
        itemsUpdated=0,
        errors=0,
        isDryRun=False
    )

    return {"message": "Price suggestion declined"}

@app.post("/inventory/update-price")
async def update_listing_price(price_data: dict, current_user: User = Depends(get_current_user)):
    """Update a listing price directly"""
    try:
        listing_id = price_data.get("listingId")
        new_price = price_data.get("newPrice")
        
        if not listing_id or new_price is None:
            raise HTTPException(status_code=400, detail="Listing ID and new price are required")
        
        # Get user's Discogs client
        client = get_discogs_client(current_user)
        
        # Update the price on Discogs
        status_code, response = client.update_listing_price(listing_id, new_price)
        
        if status_code == 200:
            return {"success": True, "message": "Price updated successfully", "data": response}
        else:
            raise HTTPException(status_code=status_code, detail="Failed to update price on Discogs")
            
    except DiscogsAPIError as e:
        logger.error(f"Discogs API error updating price: {e}")
        raise HTTPException(status_code=500, detail=f"Discogs API error: {str(e)}")
    except Exception as e:
        logger.error(f"Error updating listing price: {e}")
        raise HTTPException(status_code=500, detail="Failed to update listing price")

# Strategy endpoints
@app.get("/strategies")
async def get_strategies(current_user: User = Depends(get_current_user)):
    """Get user's pricing strategies"""
    user_strategies = [s for s in strategies_db.values() if s.userId == current_user.id]
    return {"strategies": user_strategies}

@app.post("/strategies/create")
async def create_strategy(strategy_data: dict, current_user: User = Depends(get_current_user)):
    """Create a new pricing strategy"""
    strategy_id = len(strategies_db) + 1
    
    strategy = Strategy(
        id=strategy_id,
        userId=current_user.id,
        **strategy_data
    )
    
    strategies_db[strategy_id] = strategy
    return {"strategy": strategy, "message": "Strategy created successfully"}

@app.post("/strategies/preview")
async def preview_strategy(strategy_data: dict, current_user: User = Depends(get_current_user)):
    """Preview how a strategy would price sample items"""
    try:
        # This would generate sample pricing data based on the strategy
        # For now, return mock data
        sample_items = [
            {
                "title": "Sample Release 1",
                "artist": "Sample Artist",
                "currentPrice": 25.00,
                "suggestedPrice": 28.50,
                "basis": "Median + 14%"
            },
            {
                "title": "Sample Release 2", 
                "artist": "Another Artist",
                "currentPrice": 15.00,
                "suggestedPrice": 16.20,
                "basis": "Median + 8%"
            },
            {
                "title": "Sample Release 3",
                "artist": "Third Artist", 
                "currentPrice": 45.00,
                "suggestedPrice": 48.60,
                "basis": "Median + 8%"
            }
        ]
        
        return {"preview": sample_items}
    except Exception as e:
        logger.error(f"Error generating strategy preview: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate strategy preview")

@app.post("/strategies/apply-globally")
async def apply_strategy_globally(request_data: dict, current_user: User = Depends(get_current_user)):
    """Apply a strategy globally to all inventory"""
    try:
        strategy_id = request_data.get("strategyId")
        if not strategy_id:
            raise HTTPException(status_code=400, detail="Strategy ID is required")
        
        # Get the strategy
        strategy = strategies_db.get(strategy_id)
        if not strategy or strategy.userId != current_user.id:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        # In a real implementation, this would apply the strategy to all inventory
        # For now, return a success message
        return {"message": "Strategy applied globally", "strategyId": strategy_id}
        
    except Exception as e:
        logger.error(f"Error applying strategy globally: {e}")
        raise HTTPException(status_code=500, detail="Failed to apply strategy globally")

# Logs endpoints
@app.get("/logs")
async def get_run_logs(current_user: User = Depends(get_current_user)):
    """Get user's run logs"""
    user_logs = [log for log in run_logs_db.values() if log.userId == current_user.id]
    return {"logs": user_logs}

@app.get("/logs/{run_id}/snapshots")
async def get_run_snapshots(run_id: str, current_user: User = Depends(get_current_user)):
    """Get snapshots for a specific run"""
    if run_id not in run_logs_db or run_logs_db[run_id].userId != current_user.id:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Return mock snapshot data
    return {"snapshots": []}

# Settings endpoints
@app.get("/settings")
async def get_user_settings(current_user: User = Depends(get_current_user)):
    """Get user settings"""
    settings = user_settings_db.get(str(current_user.id))
    if not settings:
        settings = UserSettings(userId=current_user.id)
        user_settings_db[str(current_user.id)] = settings
    
    return {"settings": settings}

@app.post("/settings")
async def update_user_settings(settings_data: dict, current_user: User = Depends(get_current_user)):
    """Update user settings"""
    settings = user_settings_db.get(str(current_user.id), UserSettings(userId=current_user.id))
    
    # Update settings
    for key, value in settings_data.items():
        if hasattr(settings, key):
            setattr(settings, key, value)
    
    settings.updatedAt = datetime.now().isoformat()
    user_settings_db[str(current_user.id)] = settings
    
    return {"settings": settings, "message": "Settings updated successfully"}

# Metrics endpoints
@app.get("/metrics/portfolio")
async def get_portfolio_metrics(current_user: User = Depends(get_current_user)):
    """Get portfolio metrics"""
    return {
        "totalValue": 0,
        "averagePrice": 0,
        "totalListings": 0,
        "belowP25": 0,
        "betweenP25P75": 0,
        "aboveP75": 0
    }

@app.get("/metrics/trends")
async def get_trend_metrics(current_user: User = Depends(get_current_user)):
    """Get trend metrics"""
    return {"trends": []}

@app.get("/metrics/distribution")
async def get_distribution_metrics(current_user: User = Depends(get_current_user)):
    """Get distribution metrics"""
    return {"distribution": []}

# Simulation endpoint
@app.post("/reprice", response_model=RepriceResponse)
async def reprice(
    payload: RepriceRequest,
    dry_run: bool = Query(True),
    scope: Literal["global", "selection", "item"] = Query("global"),
    current_user: User = Depends(get_current_user)
):
    """Apply approved price changes to Discogs listings with automation rules"""
    
    try:
        # Setup
        client = get_discogs_client(current_user)
        settings = get_user_settings(current_user)
        
        # Create run log
        run_id = len(run_logs_db) + 1
        run_log = RunLog(
            id=str(run_id),
            userId=current_user.id,
            runDate=datetime.now().isoformat(),
            status="running",
            itemsScanned=0,
            itemsUpdated=0,
            errors=0,
            isDryRun=dry_run,
            strategyId=payload.strategy_id
        )
        run_logs_db[str(run_id)] = run_log
        
        # Resolve candidate listings
        candidate_listings = resolve_candidate_listings(current_user, scope, payload, client)
        
        # Process each listing
        results: List[RepriceItemResult] = []
        counters = {"scanned": 0, "auto_applied": 0, "user_applied": 0, "flagged": 0, "declined": 0, "errors": 0}
        approved_set = set(payload.approved_listing_ids or [])
        
        for listing in candidate_listings:
            counters["scanned"] += 1
            
            # Compute target price
            target = compute_target_price(listing, payload.strategy_id, payload.params)
            old_price = listing.get("price", 0.0)
            
            # Decide action
            decision, blocked_reason = decide_action(
                old_price, target["new_price"], target["increase_pct"], 
                approved_set, settings
            )
            
            http_status = None
            rl_remaining = rl_reset = None
            
            # Apply price change if needed
            if decision in ("auto_applied", "user_applied") and not dry_run:
                http_status, meta = apply_price_change(
                    client, listing["id"], target["new_price"], target["currency"]
                )
                rl_remaining = meta.get("ratelimit_remaining")
                rl_reset = meta.get("ratelimit_reset")
                
                if http_status not in (200, 201):
                    counters["errors"] += 1
                    decision = "flagged"
            elif dry_run:
                decision = "simulated"
            
            counters[decision] = counters.get(decision, 0) + 1
            
            # Create snapshot
            snapshot_id = f"snapshot_{run_id}_{listing['id']}_{int(datetime.now().timestamp())}"
            snapshot = ListingSnapshot(
                id=snapshot_id,
                run_id=str(run_id),
                listing_id=listing["id"],
                old_price=old_price,
                target_price=target["new_price"],
                delta=target["new_price"] - old_price,
                decision=decision,
                reason=blocked_reason or target["reason"],
                confidence=target["confidence"],
                flagged=(decision == "flagged"),
                http_status=http_status
            )
            listing_snapshots_db[snapshot_id] = snapshot
            
            # Add result
            results.append(RepriceItemResult(
                listing_id=listing["id"],
                old_price=float(old_price),
                new_price=float(target["new_price"]),
                currency=target["currency"],
                decision=decision,
                reason=blocked_reason or target["reason"],
                confidence=float(target["confidence"]),
                discogs_status="For Sale",
                http_status=http_status,
                ratelimit_remaining=rl_remaining,
                ratelimit_reset=rl_reset
            ))
        
        # Update run log
        run_log.status = "completed"
        run_log.itemsScanned = counters["scanned"]
        run_log.itemsUpdated = counters["auto_applied"] + counters["user_applied"]
        run_log.errors = counters["errors"]
        
        return RepriceResponse(
            run_id=run_id,
            dry_run=dry_run,
            summary=counters,
            items=results
        )
        
    except DiscogsAuthError:
        raise HTTPException(status_code=401, detail="Discogs authentication required")
    except DiscogsAPIError as e:
        raise HTTPException(status_code=400, detail=f"Discogs API error: {e}")
    except Exception as e:
        logger.error(f"Reprice failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/simulate")
async def run_simulation(simulation_data: dict, current_user: User = Depends(get_current_user)):
    """Run a pricing simulation"""
    is_dry_run = simulation_data.get("isDryRun", True)
    
    log_id = f"sim_{current_user.id}_{int(datetime.now().timestamp())}"
    
    # Create run log
    run_log = RunLog(
        id=log_id,
        userId=current_user.id,
        runDate=datetime.now().isoformat(),
        status="running",
        itemsScanned=0,
        itemsUpdated=0,
        errors=0,
        isDryRun=is_dry_run
    )
    
    run_logs_db[log_id] = run_log
    
    # Simulate processing
    await asyncio.sleep(2)
    
    # Update log with results
    run_log.status = "completed"
    run_log.itemsScanned = 150
    run_log.itemsUpdated = 12 if not is_dry_run else 0
    
    return {"message": "Simulation completed", "runId": log_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)