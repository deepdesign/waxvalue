#!/usr/bin/env python3

import os
import secrets
import logging
import time
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from discogs_client import DiscogsOAuth, DiscogsClient

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global lock to prevent concurrent analysis
# Format: {session_id: {'locked': True, 'start_time': timestamp}}
analysis_lock = {}

def get_user_inventory_all_pages(client: DiscogsClient, username: str, first_page_data: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Fetch all pages of user inventory"""
    all_listings = []
    
    try:
        # Use provided first page data if available to avoid duplicate fetch
        if first_page_data:
            page_listings = first_page_data.get("listings", [])
            all_listings.extend(page_listings)
            logger.info(f"Page 1: Using provided data, {len(page_listings)} listings")
            pagination = first_page_data.get("pagination", {})
            total_pages = pagination.get("pages", 1)
            start_page = 2  # Start from page 2 since we have page 1
        else:
            start_page = 1
            total_pages = None
        
        page = start_page
        per_page = 100  # Maximum per page from Discogs API
        
        while True:
            logger.info(f"Fetching inventory page {page} for user {username}")
            inventory = client.get_user_inventory(username, page=page, per_page=per_page)
            page_listings = inventory.get("listings", [])
            
            if not page_listings:
                logger.info(f"No more listings on page {page}, stopping pagination")
                break
                
            all_listings.extend(page_listings)
            logger.info(f"Page {page}: Fetched {len(page_listings)} listings, total so far: {len(all_listings)}")
            
            # Check if we've reached the last page
            pagination = inventory.get("pagination", {})
            total_pages = pagination.get("pages", 1)
            if page >= total_pages:
                logger.info(f"Reached last page ({total_pages})")
                break
                
            page += 1
            
            # Safety limit to prevent infinite loops
            if page > 50:  # Max 5000 items
                logger.warning(f"Reached safety limit of 50 pages, stopping pagination")
                break
    
    except Exception as e:
        logger.error(f"Error fetching inventory pages: {e}")
        # Return what we have so far rather than failing completely
        logger.info(f"Returning {len(all_listings)} listings fetched before error")
    
    return all_listings

# Initialize FastAPI app
app = FastAPI(title="WaxValue Backend", version="1.0.0")

# CORS middleware - use environment variable for frontend URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [FRONTEND_URL]
# Add alternate localhost variants for local development
if "localhost" in FRONTEND_URL or "127.0.0.1" in FRONTEND_URL:
    allowed_origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return {"detail": f"Internal server error: {str(exc)}"}

# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {e}", exc_info=True)
        raise

# Import persistent session manager
from session_manager import session_manager

# Pydantic models
class User(BaseModel):
    id: str
    username: str
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    avatar: Optional[str] = None
    discogsUserId: Optional[int] = None
    accessToken: Optional[str] = None
    accessTokenSecret: Optional[str] = None

class UserSettings(BaseModel):
    automationEnabled: bool = True
    dailySchedule: str = "09:00"
    priceChangeThreshold: float = 10.0
    maxPriceIncrease: float = 50.0
    minPriceDecrease: float = -25.0

class Strategy(BaseModel):
    id: str
    name: str
    description: str
    scarcityBoost: float = 0.1
    offset: float = 0.0
    offsetType: str = "percentage"
    isActive: bool = False

class PriceSuggestion(BaseModel):
    listingId: int
    releaseId: int
    currentPrice: float
    suggestedPrice: float
    basis: str
    status: str
    strategy: str
    condition: str
    artist: str
    title: str
    label: str
    imageUrl: str

# Default strategies
DEFAULT_STRATEGIES = [
        Strategy(
        id="conservative",
        name="Conservative",
        description="Safe pricing with minimal adjustments",
        scarcityBoost=0.05,
        offset=0.0,
            offsetType="percentage",
            isActive=True
    ),
    Strategy(
        id="aggressive",
        name="Aggressive",
        description="Maximize profit with higher prices",
        scarcityBoost=0.2,
        offset=0.15,
        offsetType="percentage",
        isActive=False
    ),
    Strategy(
        id="competitive",
        name="Competitive",
        description="Match market rates for quick sales",
        scarcityBoost=0.1,
        offset=-0.05,
        offsetType="percentage",
        isActive=False
    )
]

def require_auth(session_id: str) -> User:
    """Require authentication and return user"""
    if not session_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user = get_current_user(session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    return user

def require_discogs_auth(user: User):
    """Require Discogs authentication"""
    if not user.accessToken or not user.accessTokenSecret:
        raise HTTPException(status_code=400, detail="Discogs account not connected")

def get_current_user(session_id: str) -> Optional[User]:
    """Get current user from session"""
    logger.info(f"Getting user for session: {session_id[:10]}...")
    
    if not session_manager.has_session(session_id):
        logger.error(f"Session {session_id[:10]}... not found in sessions")
        return None
    
    session_data = session_manager.get_session(session_id)
    if not session_data:
        logger.error(f"No session data found for {session_id[:10]}...")
        return None
    
    user_data = session_data.get("user", {})
    if not user_data:
        logger.error(f"No user data found in session {session_id[:10]}...")
        return None
    
    try:
        return User(**user_data)
    except Exception as e:
        logger.error(f"Error creating User object: {e}")
        return None

# Auth endpoints
@app.get("/auth/me")
async def get_current_user_endpoint(session_id: str = None):
    """Get current user info"""
    if not session_id:
        raise HTTPException(status_code=401, detail="Session required")
    
    user = get_current_user(session_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@app.post("/auth/login")
async def login(credentials: dict, session_id: str = None):
    """Login user (creates session)"""
    email = credentials.get("email")
    password = credentials.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    # Generate session ID if not provided
    if not session_id:
        session_id = secrets.token_urlsafe(32)
    
    # Create user session
    user = User(
        id=secrets.token_urlsafe(16),
        username=email.split("@")[0],
        discogsUserId=None,
        email=email
    )
    
    session_data = {
        "user": user.model_dump(),
        "settings": UserSettings().model_dump(),
        "strategies": [s.model_dump() for s in DEFAULT_STRATEGIES],
        "logs": [],
        "suggestions": []
    }
    session_manager.set_session(session_id, session_data)
    
    return {
        "user": user,
        "session_id": session_id,
        "message": "Login successful"
    }

@app.post("/auth/setup")
async def setup_auth():
    """Initialize OAuth flow with Discogs - no session required"""
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    if not consumer_key or not consumer_secret:
        raise HTTPException(status_code=500, detail="Discogs API credentials not configured")
    
    try:
        oauth = DiscogsOAuth(consumer_key, consumer_secret)
        # Use environment variable for callback URL
        callback_url = f"{FRONTEND_URL}/auth/callback"
        request_token, request_token_secret = oauth.get_request_token(callback_url)
        auth_url = oauth.get_authorize_url(request_token)
        
        logger.info(f"OAuth setup complete, returning auth URL")
        
        return {
            "authUrl": auth_url,
            "requestToken": request_token,
            "requestTokenSecret": request_token_secret
        }
    except Exception as e:
        logger.error(f"OAuth setup error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize OAuth: {str(e)}")

@app.post("/auth/verify")
async def verify_auth(verification: dict, session_id: str = None):
    """Verify OAuth authorization and get user access tokens"""
    logger.info(f"Verify auth called with session_id: {session_id[:10] if session_id else 'None'}...")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Debug: Log all sessions
    logger.info(f"Total sessions in memory: {len(session_manager.sessions)}")
    logger.info(f"Session IDs: {[sid[:10] + '...' for sid in session_manager.sessions.keys()]}")
    
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    if not consumer_key or not consumer_secret:
        raise HTTPException(status_code=500, detail="Discogs API credentials not configured")
    
    request_token = verification.get("requestToken")
    verifier_code = verification.get("verifierCode") or verification.get("oauthVerifier")
    request_token_secret = verification.get("requestTokenSecret")
    
    if not request_token or not verifier_code or not request_token_secret:
        raise HTTPException(status_code=400, detail="Missing required OAuth parameters")
    
    try:
        oauth = DiscogsOAuth(consumer_key, consumer_secret)
        access_token, access_token_secret = oauth.get_access_token(
            request_token, request_token_secret, verifier_code
        )
        
        # Create authenticated client to get user info
        client = DiscogsClient(consumer_key, consumer_secret, 
                              access_token, access_token_secret)
        
        try:
            user_info = client.get_user_info()
            logger.info(f"🔍 user_info from Discogs: {user_info.keys()}")
            logger.info(f"🔍 avatar_url in user_info: {user_info.get('avatar_url')}")
        except Exception as e:
            logger.error(f"Failed to get user info from Discogs: {e}")
            user_info = {"username": "discogs_user", "id": 1}
        
        # Create or get user session
        if not session_manager.has_session(session_id):
            logger.info(f"Session {session_id[:10]}... not found, creating new session")
            # Create new session for first-time OAuth from home page
            session_manager.set_session(session_id, {
                "user": {
                    "id": secrets.token_urlsafe(16),
                    "username": None,
                    "email": None,
                    "discogsUserId": None,
                    "accessToken": None,
                    "accessTokenSecret": None
                },
                "settings": {
                    "automationEnabled": True,
                    "dailySchedule": "09:00",
                    "priceChangeThreshold": 10.0,
                    "maxPriceIncrease": 50.0,
                    "minPriceDecrease": -25.0
                },
                "logs": [],
                "suggestions": []
            })
        
        session = session_manager.get_session(session_id)
        user_data = session["user"]
        
        # Update user with Discogs info
        user_data.update({
            "discogsUserId": user_info["id"],
            "username": user_info["username"],
            "email": user_info.get("email", user_data.get("email")),
            "firstName": user_info.get("first_name"),
            "lastName": user_info.get("last_name"),
            "avatar": user_info.get("avatar_url"),
            "accessToken": access_token,
            "accessTokenSecret": access_token_secret
        })
        
        # Save updated session data
        session_manager.update_session_data(session_id, "user", user_data)
        
        # Debug logging
        logger.info(f"Updated user_data: {user_data}")
        logger.info(f"Avatar in user_data: {user_data.get('avatar')}")
        
        user_response = User(**user_data)
        logger.info(f"User model avatar: {user_response.avatar}")
        
        return {
            "user": user_response,
            "message": "Account connected successfully"
        }
    except Exception as e:
        logger.error(f"OAuth verification error: {e}")
        raise HTTPException(status_code=400, detail=f"OAuth verification failed: {str(e)}")

@app.post("/auth/disconnect")
async def disconnect_auth(session_id: str = None):
    """Disconnect Discogs account"""
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    if not session_manager.has_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Remove Discogs data from user session
    session = session_manager.get_session(session_id)
    user_data = session["user"]
    
    user_data.update({
        "discogsUserId": None,
        "accessToken": None,
        "accessTokenSecret": None
    })
    
    # Save updated session data
    session_manager.update_session_data(session_id, "user", user_data)
    
    return {"message": "Account disconnected successfully"}

# Dashboard endpoints
@app.get("/inventory/count")
async def get_inventory_count(session_id: str = None):
    """Get count of For Sale items in user's inventory - instant from profile"""
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    try:
        # Initialize Discogs client
        consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
        consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
        
        client = DiscogsClient(
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
            access_token=user.accessToken,
            access_token_secret=user.accessTokenSecret
        )
        
        # Get instant count from user profile (single API call, no pagination needed)
        try:
            user_profile = client.get_user_profile(user.username)
            total_for_sale = user_profile.get('num_for_sale', 0)
            total_listings = user_profile.get('num_listing', 0)  # Total inventory (all statuses)
            
            logger.info(f"Instant count from profile: {total_for_sale} For Sale, {total_listings} total listings")
            
            return {
                "totalForSale": total_for_sale,
                "totalListings": total_listings
            }
                
        except Exception as e:
            logger.error(f"Error fetching inventory count: {e}")
            return {
                "totalForSale": 0,
                "totalListings": 0
            }
        
    except Exception as e:
        logger.error(f"Error getting inventory count: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get inventory count: {str(e)}")

@app.get("/dashboard/summary")
async def get_dashboard_summary(session_id: str = None):
    """Get dashboard summary with real data"""
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    try:
        # Initialize Discogs client
        consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
        consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
        
        client = DiscogsClient(
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
            access_token=user.accessToken,
            access_token_secret=user.accessTokenSecret
        )
        
        # Get user inventory count (For Sale items only) - use instant profile call
        try:
            user_profile = client.get_user_profile(user.username)
            total_listings = user_profile.get('num_for_sale', 0)
            logger.info(f"Dashboard summary: {total_listings} For Sale items (from profile)")
        except Exception as e:
            logger.error(f"Error fetching profile for dashboard: {e}")
            # Fallback to pagination count if profile fails
            try:
                inventory = client.get_user_inventory(user.username, per_page=1)
                basic_count = inventory.get("pagination", {}).get("items", 0)
                total_listings = basic_count
                logger.info(f"Using fallback count: {total_listings} items")
            except Exception as fallback_error:
                logger.error(f"Fallback count also failed: {fallback_error}")
                total_listings = 0
        
        # Get latest log entry and suggestions
        try:
            session = session_manager.get_session(session_id)
            logger.info(f"Session data keys: {list(session.keys()) if session else 'No session'}")
            
            logs = session.get("logs", [])
            latest_log = logs[-1] if logs else None
            suggestions = session.get("suggestions", [])
            
            logger.info(f"Dashboard summary: {len(logs)} logs, {len(suggestions)} suggestions")
        except Exception as e:
            logger.error(f"Error accessing session data: {e}")
            latest_log = None
            suggestions = []
        
        # Calculate average delta from suggestions
        average_delta = 0
        if suggestions:
            total_delta = sum(abs(s.get("suggestedPrice", 0) - s.get("currentPrice", 0)) for s in suggestions)
            average_delta = round((total_delta / len(suggestions)) / sum(s.get("currentPrice", 1) for s in suggestions) * 100, 1)
        
        return {
            "totalListings": total_listings,
            "suggestedUpdates": len(suggestions),
            "averageDelta": average_delta,
            "lastRunDate": latest_log["runDate"] if latest_log else None,
            "isRunning": False
        }

    except Exception as e:
        logger.error(f"Error getting dashboard summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard summary: {str(e)}")

# Inventory endpoints
@app.get("/inventory/suggestions/stream")
async def get_suggestions_stream(session_id: str = None):
    """Get pricing suggestions for user's inventory with streaming progress updates"""
    from fastapi.responses import StreamingResponse
    import json
    import asyncio
    
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    # Check for existing complete cached data
    session = session_manager.get_session(session_id)
    cached_suggestions = session.get("suggestions", [])
    analysis_complete = session.get("analysis_complete", None)
    
    # Backward compatibility: verify if existing suggestions are complete
    if cached_suggestions and analysis_complete is None:
        logger.info(f"Found {len(cached_suggestions)} cached suggestions without completion flag - verifying...")
        try:
            consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
            consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
            
            client = DiscogsClient(
                consumer_key=consumer_key,
                consumer_secret=consumer_secret,
                access_token=user.accessToken,
                access_token_secret=user.accessTokenSecret
            )
            
            user_profile = client.get_user_profile(user.username)
            expected_count = user_profile.get('num_for_sale', 0)
            
            if len(cached_suggestions) == expected_count:
                logger.info(f"Cached suggestions count matches expected ({expected_count}) - marking as complete")
                session_manager.update_session_data(session_id, "analysis_complete", True)
                analysis_complete = True
            else:
                logger.info(f"Cached suggestions ({len(cached_suggestions)}) doesn't match expected ({expected_count}) - will refresh")
                analysis_complete = False
        except Exception as e:
            logger.warning(f"Could not verify cached suggestions: {e}")
            analysis_complete = False
    
    # If we have complete cached data, return it via streaming format
    if cached_suggestions and analysis_complete:
        logger.info(f"Returning {len(cached_suggestions)} complete cached suggestions via streaming")
        
        async def stream_cached():
            # Send instant total
            yield f"data: {json.dumps({'type': 'total', 'total': len(cached_suggestions)})}\n\n"
            
            # Send completion with all suggestions
            yield f"data: {json.dumps({'type': 'complete', 'suggestions': cached_suggestions, 'totalItems': len(cached_suggestions)})}\n\n"
        
        return StreamingResponse(stream_cached(), media_type="text/event-stream")
    
    # Check if analysis is already running for this session (with timeout)
    LOCK_TIMEOUT = 600  # 10 minutes
    current_time = time.time()
    
    if session_id in analysis_lock:
        lock_data = analysis_lock[session_id]
        lock_age = current_time - lock_data.get('start_time', current_time)
        
        if lock_age < LOCK_TIMEOUT:
            # Lock is still valid
            logger.warning(f"Analysis already running for session {session_id[:10]}... (running for {int(lock_age)}s) - rejecting duplicate request")
            async def already_running():
                yield f"data: {json.dumps({'type': 'error', 'error': 'Analysis already in progress'})}\n\n"
            return StreamingResponse(already_running(), media_type="text/event-stream")
        else:
            # Lock expired, clear it
            logger.warning(f"Analysis lock expired for session {session_id[:10]}... (age: {int(lock_age)}s), clearing stale lock")
            del analysis_lock[session_id]
    
    def generate_suggestions():
        # Set lock to prevent concurrent analysis
        analysis_lock[session_id] = {'locked': True, 'start_time': time.time()}
        # Reset analysis_complete flag to indicate fresh analysis
        session_manager.update_session_data(session_id, "analysis_complete", False)
        logger.info(f"Started analysis for session {session_id[:10]}... (lock acquired)")
        
        try:
            # Initialize Discogs client
            consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
            consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
            
            client = DiscogsClient(
                consumer_key=consumer_key,
                consumer_secret=consumer_secret,
                access_token=user.accessToken,
                access_token_secret=user.accessTokenSecret
            )
            
            # Use the stored username from the session (avoid extra API call)
            username = user.username
            logger.info(f"Using stored username: {username}")
            
            if not username:
                yield f"data: {json.dumps({'error': 'Could not get user username'})}\n\n"
                return
            
            # Get user profile to get instant "For Sale" count
            # Use direct profile endpoint instead of get_user_info() to avoid 2 API calls
            logger.info("Getting user profile for instant count...")
            try:
                user_profile = client.get_user_profile(username)
                instant_for_sale_count = user_profile.get('num_for_sale', 0)
                logger.info(f"User profile shows {instant_for_sale_count} For Sale items")
                
                # Send instant count immediately (no API delay!)
                yield f"data: {json.dumps({'type': 'total', 'total': instant_for_sale_count})}\n\n"
                logger.info(f"Sent instant For Sale count: {instant_for_sale_count}")
            except Exception as profile_error:
                logger.warning(f"Could not get instant count from profile: {profile_error}")
                instant_for_sale_count = 0
            
            # Now fetch inventory pages for detailed analysis
            logger.info("Fetching inventory pages...")
            yield f"data: {json.dumps({'type': 'status', 'message': 'Fetching inventory details...'})}\n\n"
            
            first_page = client.get_user_inventory(username, page=1, per_page=100)
            first_page_listings = first_page.get("listings", [])
            
            # Now fetch remaining pages (reusing first page data)
            all_listings = get_user_inventory_all_pages(client, username, first_page_data=first_page)
            
            # Filter to only include items that are "For Sale"
            for_sale_listings = [listing for listing in all_listings if listing.get("status") == "For Sale"]
            
            logger.info(f"Fetched {len(all_listings)} total listings from Discogs")
            logger.info(f"Filtered to {len(for_sale_listings)} For Sale items (actual count)")
            
            # Use actual count for processing
            total_items = len(for_sale_listings)
            if total_items != instant_for_sale_count:
                logger.info(f"Actual count ({total_items}) differs from profile count ({instant_for_sale_count})")
            
            # Cache for price suggestions by release_id to avoid duplicate API calls
            # This significantly speeds up analysis when you have multiple copies of the same release
            price_cache = {}
            cache_hits = 0
            
            suggestions = []
            
            # Process all for-sale items
            items_to_process = for_sale_listings
            total_items = len(items_to_process)
            logger.info(f"Processing {total_items} For Sale items...")
            
            yield f"data: {json.dumps({'type': 'status', 'message': f'Processing {total_items} items...'})}\n\n"
            
            for i, listing in enumerate(items_to_process):
                # Double-check status (should already be filtered, but just in case)
                if listing.get("status") != "For Sale":
                    logger.warning(f"Skipping listing {listing.get('id')} with status: {listing.get('status')}")
                    continue
                    
                listing_id = listing["id"]
                release_id = listing["release"]["id"]
                
                # Send progress update
                progress_data = {
                    'type': 'progress',
                    'current': i + 1,
                    'total': total_items,
                    'percentage': round(((i + 1) / total_items) * 100, 1)
                }
                yield f"data: {json.dumps(progress_data)}\n\n"
                
                # Log progress every 5 items
                if (i + 1) % 5 == 0 or i == 0:
                    logger.info(f"Processing item {i+1}/{len(items_to_process)}: listing {listing_id}, release {release_id}")
                
                # Rate limiting is now handled by the token bucket in DiscogsClient
                # No artificial delay needed - the rate limiter handles it
                
                try:
                    # Handle price as dict with 'value' field from Discogs API
                    price_data = listing.get("price", {})
                    if isinstance(price_data, dict):
                        current_price = float(price_data.get("value", 0))
                    else:
                        current_price = float(price_data or 0)
                    
                    # Get price suggestions from Discogs (with caching)
                    if release_id in price_cache:
                        price_suggestions = price_cache[release_id]
                        cache_hits += 1
                        logger.debug(f"Cache HIT for release {release_id} (saved API call #{cache_hits})")
                    else:
                        price_suggestions = client.get_price_suggestions(release_id)
                        price_cache[release_id] = price_suggestions
                        logger.debug(f"Cache MISS - fetched price suggestions for release {release_id}")
                    
                    stats = {}
                    
                    # The Discogs API returns price suggestions by condition (M, VG+, etc.)
                    # We need to find the condition that matches our listing
                    if price_suggestions and isinstance(price_suggestions, dict):
                        # Get the listing condition to match against price suggestions
                        listing_condition = listing.get("condition", "").upper()
                        
                        # Try to find a matching condition in the price suggestions
                        suggested_price = None
                        condition_used = None
                        
                        # Common condition mappings
                        condition_mappings = {
                            "MINT (M)": ["M", "Mint"],
                            "NEAR MINT (NM OR M-)": ["NM", "Near Mint"],
                            "VERY GOOD PLUS (VG+)": ["VG+", "Very Good Plus"],
                            "VERY GOOD (VG)": ["VG", "Very Good"],
                            "GOOD PLUS (G+)": ["G+", "Good Plus"],
                            "GOOD (G)": ["G", "Good"],
                            "FAIR (F)": ["F", "Fair"],
                            "POOR (P)": ["P", "Poor"]
                        }
                        
                        # Try to find matching condition
                        for condition_key, search_terms in condition_mappings.items():
                            if any(term in listing_condition for term in search_terms):
                                # Look for this condition in price suggestions
                                for condition, price_data in price_suggestions.items():
                                    if any(term in condition.upper() for term in search_terms):
                                        if isinstance(price_data, dict) and "value" in price_data:
                                            suggested_price = float(price_data["value"])
                                            condition_used = condition
                                            break
                                break
                        
                        # If no specific condition match, try to use any available suggestion
                        if suggested_price is None and price_suggestions:
                            for condition, price_data in price_suggestions.items():
                                if isinstance(price_data, dict) and "value" in price_data:
                                    suggested_price = float(price_data["value"])
                                    condition_used = condition
                                    break
                        
                        if suggested_price is not None:
                            # Determine status
                            if suggested_price > current_price * 1.1:
                                status = "underpriced"
                            elif suggested_price < current_price * 0.9:
                                status = "overpriced"
                            else:
                                status = "fairly_priced"
                            
                            # Extract release information
                            release_info = listing.get("release", {})
                            artist = release_info.get("artist", "Unknown Artist")
                            title = release_info.get("title", "Unknown Title")
                            
                            # Get label information
                            label = release_info.get("label", "Unknown Label")
                            
                            # Get image URL
                            images = release_info.get("images", [])
                            primary_image = next((img for img in images if img.get("type") == "primary"), None)
                            if primary_image:
                                image_url = primary_image.get("uri150", primary_image.get("uri", ""))
                            else:
                                image_url = release_info.get("thumbnail", "")
                            
                            # Format condition properly
                            media_condition = listing.get("condition", "Not Graded")
                            sleeve_condition = listing.get("sleeve_condition", "Not Graded")
                            
                            # Convert full condition names to short codes
                            def get_condition_short_code(condition):
                                condition_mapping = {
                                    'Mint (M)': 'M',
                                    'Near Mint (NM or M-)': 'NM',
                                    'Very Good Plus (VG+)': 'VG+',
                                    'Very Good (VG)': 'VG',
                                    'Good Plus (G+)': 'G+',
                                    'Good (G)': 'G',
                                    'Fair (F)': 'F',
                                    'Poor (P)': 'P'
                                }
                                return condition_mapping.get(condition, condition)
                            
                            media_short = get_condition_short_code(media_condition)
                            sleeve_short = get_condition_short_code(sleeve_condition)
                            condition_display = f"Media: {media_short}, Sleeve: {sleeve_short}"
                            
                            # Simplify basis
                            basis_simple = condition_used.split("(")[-1].replace(")", "").strip() if "(" in condition_used else condition_used
                            
                            # Get currency from listing or default to USD
                            raw_currency = listing.get("currency", "USD")
                            supported_currencies = ["USD", "GBP", "EUR", "CAD", "AUD", "JPY", "CHF", "MXN", "BRL", "NZD", "SEK", "ZAR"]
                            currency = raw_currency if raw_currency in supported_currencies else "USD"
                            
                            if raw_currency not in supported_currencies:
                                logger.warning(f"Unsupported currency '{raw_currency}' for listing {listing_id}, defaulting to USD")
                            
                            suggestion = PriceSuggestion(
                                listingId=listing_id,
                                releaseId=release_id,
                                currentPrice=current_price,
                                suggestedPrice=round(suggested_price, 2),
                                originalSuggestedPrice=round(suggested_price, 2),
                                currency=currency,
                                basis=basis_simple,
                                status=status,
                                strategy="Conservative",
                                condition=condition_display,
                                artist=artist,
                                title=title,
                                label=label,
                                imageUrl=image_url
                            )
                            suggestions.append(suggestion)
                            
                            # Save incrementally every 10 suggestions so users can see partial results if they navigate away
                            if len(suggestions) % 10 == 0:
                                session_manager.update_session_data(session_id, "suggestions", [s.dict() for s in suggestions])
                                logger.debug(f"Incrementally saved {len(suggestions)} suggestions to session")
                            
                            # Send individual suggestion
                            yield f"data: {json.dumps({'type': 'suggestion', 'suggestion': suggestion.dict()})}\n\n"
                
                except Exception as e:
                    logger.error(f"Error processing listing {listing_id}: {e}")
                    continue
            
            # Log cache efficiency
            total_api_calls = total_items - cache_hits
            logger.info(f"Analysis complete: {total_items} items processed, {cache_hits} cache hits, {total_api_calls} API calls made")
            if cache_hits > 0:
                logger.info(f"Cache saved {cache_hits} API calls ({round((cache_hits/total_items)*100, 1)}% reduction)")
            
            # Save suggestions to session for persistence
            session_manager.update_session_data(session_id, "suggestions", [s.dict() for s in suggestions])
            session_manager.update_session_data(session_id, "analysis_complete", True)
            logger.info(f"Saved {len(suggestions)} suggestions to session")
            
            # Send completion
            yield f"data: {json.dumps({'type': 'complete', 'suggestions': [s.dict() for s in suggestions], 'totalItems': total_items})}\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming suggestions: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        finally:
            # Release lock
            if session_id in analysis_lock:
                del analysis_lock[session_id]
                logger.info(f"Analysis completed for session {session_id[:10]}... (lock released)")
    
    return StreamingResponse(generate_suggestions(), media_type="text/event-stream")

@app.get("/inventory/suggestions")
async def get_suggestions(session_id: str = None):
    """Get pricing suggestions for user's inventory (returns cached if available)"""
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    try:
        # Check if we have cached suggestions in the session first
        session = session_manager.get_session(session_id)
        cached_suggestions = session.get("suggestions", [])
        analysis_complete = session.get("analysis_complete", None)
        
        # Backward compatibility: if analysis_complete flag doesn't exist but we have suggestions,
        # verify completeness by checking count against user profile
        if cached_suggestions and analysis_complete is None:
            logger.info(f"Found {len(cached_suggestions)} cached suggestions without completion flag - verifying...")
            try:
                # Initialize Discogs client
                consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
                consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
                
                client = DiscogsClient(
                    consumer_key=consumer_key,
                    consumer_secret=consumer_secret,
                    access_token=user.accessToken,
                    access_token_secret=user.accessTokenSecret
                )
                
                user_profile = client.get_user_profile(user.username)
                expected_count = user_profile.get('num_for_sale', 0)
                
                # If cached count matches expected count, mark as complete
                if len(cached_suggestions) == expected_count:
                    logger.info(f"Cached suggestions count matches expected ({expected_count}) - marking as complete")
                    session_manager.update_session_data(session_id, "analysis_complete", True)
                    analysis_complete = True
                else:
                    logger.info(f"Cached suggestions ({len(cached_suggestions)}) doesn't match expected ({expected_count}) - incomplete")
                    analysis_complete = False
            except Exception as e:
                logger.warning(f"Could not verify cached suggestions: {e}")
                analysis_complete = False
        
        # Only return cached suggestions if the analysis was completed
        if cached_suggestions and analysis_complete:
            logger.info(f"Returning {len(cached_suggestions)} cached suggestions from session")
            return {
                "suggestions": cached_suggestions,
                "total": len(cached_suggestions),
                "totalItems": len(cached_suggestions),
                "message": f"Found {len(cached_suggestions)} pricing suggestions (cached)"
            }
        
        # If we have partial results but analysis not complete, don't return them
        if cached_suggestions and not analysis_complete:
            logger.info(f"Ignoring {len(cached_suggestions)} partial cached suggestions - analysis incomplete")
        
        logger.info("No cached suggestions, running fresh analysis...")
        
        # Initialize Discogs client
        consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
        consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
        
        client = DiscogsClient(
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
            access_token=user.accessToken,
            access_token_secret=user.accessTokenSecret
        )
        
        # Use the stored username from the session (avoid extra API call)
        username = user.username
        logger.info(f"Using stored username: {username}")
        
        if not username:
            raise HTTPException(status_code=400, detail="Could not get user username")
        
        # Get user's inventory - fetch ALL pages for complete processing
        logger.info("Fetching all inventory pages for suggestions...")
        try:
            all_listings = get_user_inventory_all_pages(client, username)
            
            # Filter to only include items that are "For Sale"
            for_sale_listings = [listing for listing in all_listings if listing.get("status") == "For Sale"]
            
            logger.info(f"Fetched {len(all_listings)} total listings from Discogs")
            logger.info(f"Filtered to {len(for_sale_listings)} For Sale items")
        except Exception as e:
            logger.error(f"Error fetching inventory for suggestions: {e}")
            for_sale_listings = []
        
        suggestions = []
        
        # Cache for price suggestions by release_id
        price_cache = {}
        cache_hits = 0
        
        # Process all for-sale items
        items_to_process = for_sale_listings
        total_items = len(items_to_process)
        logger.info(f"Processing {total_items} For Sale items...")
        
        for i, listing in enumerate(items_to_process):
            # Double-check status (should already be filtered, but just in case)
            if listing.get("status") != "For Sale":
                logger.warning(f"Skipping listing {listing.get('id')} with status: {listing.get('status')}")
                continue
                
            listing_id = listing["id"]
            release_id = listing["release"]["id"]
            # Log progress every 5 items
            if (i + 1) % 5 == 0 or i == 0:
                logger.info(f"Processing item {i+1}/{len(items_to_process)}: listing {listing_id}, release {release_id}")
            
            # Rate limiting is now handled by the token bucket in DiscogsClient
            # No artificial delay needed
            
            try:
                # Handle price as dict with 'value' field from Discogs API
                price_data = listing.get("price", {})
                if isinstance(price_data, dict):
                    current_price = float(price_data.get("value", 0))
                else:
                    current_price = float(price_data or 0)
                    
                # Get price suggestions from Discogs (with caching)
                if release_id in price_cache:
                    price_suggestions = price_cache[release_id]
                    cache_hits += 1
                else:
                    price_suggestions = client.get_price_suggestions(release_id)
                    price_cache[release_id] = price_suggestions
                    
                stats = {}
                
                # Debug: Log the actual response structure
                logger.info(f"Price suggestions for release {release_id}: {price_suggestions}")
                
                # The Discogs API returns price suggestions by condition (M, VG+, etc.)
                # We need to find the condition that matches our listing
                if price_suggestions and isinstance(price_suggestions, dict):
                    # Get the listing condition to match against price suggestions
                    listing_condition = listing.get("condition", "").upper()
                    
                    # Try to find a matching condition in the price suggestions
                    suggested_price = None
                    condition_used = None
                    
                    # Common condition mappings
                    condition_mappings = {
                        "MINT (M)": ["M", "Mint"],
                        "NEAR MINT (NM OR M-)": ["NM", "Near Mint"],
                        "VERY GOOD PLUS (VG+)": ["VG+", "Very Good Plus"],
                        "VERY GOOD (VG)": ["VG", "Very Good"],
                        "GOOD PLUS (G+)": ["G+", "Good Plus"],
                        "GOOD (G)": ["G", "Good"],
                        "FAIR (F)": ["F", "Fair"],
                        "POOR (P)": ["P", "Poor"]
                    }
                    
                    # Try to find matching condition
                    for condition_key, search_terms in condition_mappings.items():
                        if any(term in listing_condition for term in search_terms):
                            # Look for this condition in price suggestions
                            for condition, price_data in price_suggestions.items():
                                if any(term in condition.upper() for term in search_terms):
                                    if isinstance(price_data, dict) and "value" in price_data:
                                        suggested_price = float(price_data["value"])
                                        condition_used = condition
                                        break
                            break
                    
                    # If no specific condition match, try to use any available suggestion
                    if suggested_price is None and price_suggestions:
                        for condition, price_data in price_suggestions.items():
                            if isinstance(price_data, dict) and "value" in price_data:
                                suggested_price = float(price_data["value"])
                                condition_used = condition
                                break
                    
                    if suggested_price is not None:
                        # Determine status
                        if suggested_price > current_price * 1.1:
                            status = "underpriced"
                        elif suggested_price < current_price * 0.9:
                            status = "overpriced"
                        else:
                            status = "fairly_priced"
                        
                        # Extract release information
                        release_info = listing.get("release", {})
                        logger.info(f"Release {release_id} full data: {release_info}")
                        artist = release_info.get("artist", "Unknown Artist")
                        title = release_info.get("title", "Unknown Title")
                        
                        # Get label information - Discogs returns label directly, not in labels array
                        label = release_info.get("label", "Unknown Label")
                        logger.info(f"Release {release_id} label: {label}")
                        
                        # Get image URL - try primary image first, then thumbnail
                        images = release_info.get("images", [])
                        logger.info(f"Release {release_id} images: {len(images)} available")
                        primary_image = next((img for img in images if img.get("type") == "primary"), None)
                        if primary_image:
                            image_url = primary_image.get("uri150", primary_image.get("uri", ""))
                            logger.info(f"Using primary image: {image_url}")
                        else:
                            image_url = release_info.get("thumbnail", "")
                            logger.info(f"Using thumbnail: {image_url}")
                        
                        # Format condition properly (Media: VG+, Sleeve: G)
                        # Discogs API uses 'condition' for media and 'sleeve_condition' for sleeve
                        media_condition = listing.get("condition", "Not Graded")
                        sleeve_condition = listing.get("sleeve_condition", "Not Graded")
                        
                        # Convert full condition names to short codes
                        def get_condition_short_code(condition):
                            condition_mapping = {
                                'Mint (M)': 'M',
                                'Near Mint (NM or M-)': 'NM',
                                'Very Good Plus (VG+)': 'VG+',
                                'Very Good (VG)': 'VG',
                                'Good Plus (G+)': 'G+',
                                'Good (G)': 'G',
                                'Fair (F)': 'F',
                                'Poor (P)': 'P'
                            }
                            return condition_mapping.get(condition, condition)
                        
                        media_short = get_condition_short_code(media_condition)
                        sleeve_short = get_condition_short_code(sleeve_condition)
                        condition_display = f"Media: {media_short}, Sleeve: {sleeve_short}"
                        
                        # Simplify basis (just the condition abbreviation)
                        basis_simple = condition_used.split("(")[-1].replace(")", "").strip() if "(" in condition_used else condition_used
                        
                        # Get currency from listing or default to USD
                        # Validate currency is supported by Discogs API
                        raw_currency = listing.get("currency", "USD")
                        supported_currencies = ["USD", "GBP", "EUR", "CAD", "AUD", "JPY", "CHF", "MXN", "BRL", "NZD", "SEK", "ZAR"]
                        currency = raw_currency if raw_currency in supported_currencies else "USD"
                        
                        if raw_currency not in supported_currencies:
                            logger.warning(f"Unsupported currency '{raw_currency}' for listing {listing_id}, defaulting to USD")
                        
                        suggestion = PriceSuggestion(
                                listingId=listing_id,
                                releaseId=release_id,
                                currentPrice=current_price,
                                suggestedPrice=round(suggested_price, 2),
                                originalSuggestedPrice=round(suggested_price, 2),  # Store original for strategy calculations
                                currency=currency,  # Include currency information
                                basis=basis_simple,
                                status=status,
                                strategy="Conservative",
                                condition=condition_display,
                                artist=artist,
                                title=title,
                                label=label,
                                imageUrl=image_url
                            )
                        suggestions.append(suggestion)
                        logger.info(f"Added suggestion for listing {listing_id}: ${current_price} -> ${suggested_price} ({status})")
                
            except Exception as e:
                logger.error(f"Error processing listing {listing_id}: {e}")
                continue
            
            # If no price suggestions available, skip this item
            if not price_suggestions or not isinstance(price_suggestions, dict):
                logger.info(f"No price suggestions available for release {release_id}, skipping")
                continue
        
        # Store suggestions in session
        session_manager.update_session_data(session_id, "suggestions", [s.model_dump() for s in suggestions])
        
        # Add log entry for this run
        from datetime import datetime
        log_entry = {
            "runDate": datetime.now().isoformat(),
            "suggestionsFound": len(suggestions),
            "totalListings": len(for_sale_listings),
            "status": "completed"
        }
        session = session_manager.get_session(session_id)
        session["logs"].append(log_entry)
        session_manager.update_session_data(session_id, "logs", session["logs"])
        
        return {
            "suggestions": [s.model_dump() for s in suggestions],
            "total": len(suggestions),
            "totalItems": total_items,
            "message": f"Found {len(suggestions)} pricing suggestions"
        }
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")

# Strategy endpoints
@app.get("/strategies")
async def get_strategies(session_id: str = None):
    """Get all strategies"""
    user = require_auth(session_id)
    session = session_manager.get_session(session_id)
    
    strategies = session["strategies"]
    active_strategy = next((s for s in strategies if s["isActive"]), None)
    
    return {
        "strategies": strategies,
        "activeStrategy": active_strategy
    }

@app.post("/strategies")
async def create_strategy(strategy_data: dict, session_id: str = None):
    """Create a new custom strategy"""
    user = require_auth(session_id)
    session = session_manager.get_session(session_id)
    
    # Generate unique ID
    strategy_id = f"custom_{secrets.token_urlsafe(8)}"
    
    strategy = Strategy(
        id=strategy_id,
        name=strategy_data["name"],
        description=strategy_data["description"],
        scarcityBoost=float(strategy_data["scarcityBoost"]),
        offset=float(strategy_data["offset"]),
        offsetType=strategy_data["offsetType"],
        isActive=False
    )
    
    session["strategies"].append(strategy.dict())
    
    return {
        "strategy": strategy.dict(),
        "message": "Strategy created successfully"
    }

# Settings endpoints
@app.get("/settings")
async def get_settings(session_id: str = None):
    """Get user settings"""
    user = require_auth(session_id)
    session = session_manager.get_session(session_id)
    return session["settings"]

@app.put("/settings")
async def update_settings(settings: dict, session_id: str = None):
    """Update user settings"""
    user = require_auth(session_id)
    session = session_manager.get_session(session_id)
    
    session["settings"].update(settings)
    session_manager.update_session_data(session_id, "settings", session["settings"])
    return {
        "settings": session["settings"],
        "message": "Settings updated successfully"
    }

# Item strategies endpoints
@app.get("/inventory/item-strategies")
async def get_item_strategies(session_id: str = None):
    """Get item-specific strategies"""
    user = require_auth(session_id)
    session = session_manager.get_session(session_id)
    
    # Get item strategies from session (initialize if not exists)
    item_strategies = session.get("itemStrategies", {})
    return {"itemStrategies": item_strategies}

@app.post("/inventory/item-strategies")
async def update_item_strategy(strategy_data: dict, session_id: str = None):
    """Update strategy for a specific item"""
    user = require_auth(session_id)
    session = session_manager.get_session(session_id)
    
    listing_id = strategy_data.get("listingId")
    strategy_id = strategy_data.get("strategyId")
    
    if not listing_id:
        raise HTTPException(status_code=400, detail="listingId is required")
    
    # Initialize item strategies if not exists
    if "itemStrategies" not in session:
        session["itemStrategies"] = {}
    
    # Update item strategy
    if strategy_id:
        # Find the strategy details
        strategy = next((s for s in session["strategies"] if s["id"] == strategy_id), None)
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        session["itemStrategies"][str(listing_id)] = strategy
        message = f'Applied "{strategy["name"]}" strategy to item {listing_id}'
    else:
        # Remove strategy assignment (use global strategy)
        if str(listing_id) in session["itemStrategies"]:
            del session["itemStrategies"][str(listing_id)]
        message = f'Removed strategy assignment for item {listing_id} - using global strategy'
    
    # Save updated session
    session_manager.update_session_data(session_id, "itemStrategies", session["itemStrategies"])
    
    # If a strategy was applied, recalculate the suggested price for this item
    if strategy_id:
        await recalculate_item_price(session_id, listing_id, strategy)
    
    return {"success": True, "message": message}

async def recalculate_item_price(session_id: str, listing_id: int, strategy: dict):
    """Recalculate suggested price for an item based on its assigned strategy"""
    try:
        session = session_manager.get_session(session_id)
        suggestions = session.get("suggestions", [])
        
        # Find the suggestion for this listing
        suggestion = next((s for s in suggestions if s.get("listingId") == listing_id), None)
        if not suggestion:
            return
        
        # Get the original Discogs suggested price (we'll need to fetch this again)
        # For now, let's apply the strategy adjustments to the current suggested price
        original_price = suggestion.get("originalSuggestedPrice", suggestion.get("suggestedPrice", 0))
        
        # Apply strategy adjustments
        scarcity_boost = strategy.get("scarcityBoost", 0)
        offset = strategy.get("offset", 0)
        offset_type = strategy.get("offsetType", "percentage")
        
        new_suggested_price = original_price
        
        # Apply scarcity boost (this would need market data analysis)
        # For now, we'll just apply the offset
        
        # Apply offset
        if offset_type == "percentage":
            new_suggested_price = new_suggested_price * (1 + offset / 100)
        else:  # fixed amount
            new_suggested_price = new_suggested_price + offset
        
        # Update the suggestion
        suggestion["suggestedPrice"] = round(new_suggested_price, 2)
        suggestion["strategy"] = strategy.get("name", "Custom Strategy")
        
        # Save updated suggestions
        session_manager.update_session_data(session_id, "suggestions", suggestions)
        
    except Exception as e:
        logger.error(f"Error recalculating item price: {e}")

@app.post("/inventory/adjust-suggested-price")
async def adjust_suggested_price(request: dict, session_id: str = None):
    """Adjust suggested price for a specific item"""
    user = require_auth(session_id)
    session = session_manager.get_session(session_id)
    
    listing_id = request.get("listingId")
    new_suggested_price = request.get("newSuggestedPrice")
    
    if not listing_id or new_suggested_price is None:
        raise HTTPException(status_code=400, detail="listingId and newSuggestedPrice are required")
    
    # Find the suggestion in the session and update it
    suggestions = session.get("suggestions", [])
    suggestion_found = False
    
    for suggestion in suggestions:
        if suggestion.get("listingId") == listing_id:
            suggestion["suggestedPrice"] = new_suggested_price
            suggestion_found = True
            break
    
    if not suggestion_found:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    # Save updated suggestions
    session_manager.update_session_data(session_id, "suggestions", suggestions)
    
    return {"success": True, "message": f"Suggested price updated to ${new_suggested_price:.2f}"}

# Inventory action endpoints
@app.post("/inventory/apply/{listing_id}")
async def apply_price_suggestion(listing_id: int, listing_data: dict, session_id: str = None):
    """Apply a price suggestion to a listing"""
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    new_price = listing_data.get("newPrice")
    
    if not new_price:
        raise HTTPException(status_code=400, detail="New price is required")
    
    try:
        # Initialize Discogs client
        consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
        consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
        
        client = DiscogsClient(
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
            access_token=user.accessToken,
            access_token_secret=user.accessTokenSecret
        )
        
        # Update the listing price
        logger.info(f"Attempting to update listing {listing_id} with price {new_price}")
        logger.info(f"User: {user.username}, Access Token: {user.accessToken[:10]}...")
        
        try:
            status_code, result = client.update_listing_price(listing_id, new_price)
            logger.info(f"Discogs API response: status={status_code}, result={result}")
        except Exception as update_error:
            logger.error(f"Exception during update_listing_price: {update_error}", exc_info=True)
            raise
        
        # Check if the Discogs API call was successful
        # 200 OK, 201 Created, 204 No Content are all success codes
        if status_code not in [200, 201, 204]:
            # Log the complete result structure for debugging
            logger.error(f"Discogs API FAILED - Status: {status_code}")
            logger.error(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
            logger.error(f"Full result: {result}")
            
            # Extract error message from various possible formats
            error_data = result.get("error", {})
            error_text = result.get("text", "")
            
            # Try to get message from different possible structures
            if isinstance(error_data, dict):
                error_msg = error_data.get("message") or error_data.get("error") or error_text or f"Status {status_code}: {result}"
            elif isinstance(error_data, str):
                error_msg = error_data
            else:
                error_msg = error_text or f"HTTP {status_code} - Response: {str(result)[:200]}"
            
            logger.error(f"Discogs API error: {status_code} - {error_msg}")
            raise HTTPException(status_code=500, detail=f"Discogs API error: {error_msg}")
        
        # Log the change
        session = session_manager.get_session(session_id)
        logs = session.get("logs", [])
        
        log_entry = {
            "id": f"apply_{listing_id}_{int(time.time())}",
            "userId": user.id,
            "runDate": datetime.now().isoformat(),
            "status": "completed",
            "itemsScanned": 1,
            "itemsUpdated": 1,
            "errors": 0,
            "isDryRun": False,
            "action": "apply",
            "listingId": listing_id,
            "newPrice": new_price
        }
        
        logs.append(log_entry)
        session_manager.update_session_data(session_id, "logs", logs)
        
        return {"message": "Price updated successfully", "listing": result}
        
    except Exception as e:
        logger.error(f"Failed to apply price suggestion: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update listing: {str(e)}")

@app.post("/inventory/bulk-apply")
async def bulk_apply_price_suggestions(request: dict, session_id: str = None):
    """Apply price suggestions to multiple listings"""
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    listing_ids = request.get("listingIds", [])
    if not listing_ids:
        raise HTTPException(status_code=400, detail="No listing IDs provided")
    
    try:
        # Initialize Discogs client
        consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
        consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
        
        client = DiscogsClient(
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
            access_token=user.accessToken,
            access_token_secret=user.accessTokenSecret
        )
        
        results = []
        successful_updates = 0
        errors = 0
        
        # Get current suggestions from session
        session = session_manager.get_session(session_id)
        suggestions = session.get("suggestions", [])
        
        for listing_id in listing_ids:
            try:
                # Find the suggestion for this listing
                suggestion = next((s for s in suggestions if s.get("listingId") == listing_id), None)
                if not suggestion:
                    results.append({"listingId": listing_id, "success": False, "error": "Suggestion not found"})
                    errors += 1
                    continue
                
                new_price = suggestion.get("suggestedPrice")
                if not new_price:
                    results.append({"listingId": listing_id, "success": False, "error": "No suggested price"})
                    errors += 1
                    continue
                
                # Update the listing on Discogs
                logger.info(f"Bulk apply: Attempting to update listing {listing_id} with price {new_price}")
                status_code, result = client.update_listing_price(listing_id, new_price)
                
                logger.info(f"Bulk apply: Discogs API response for listing {listing_id}: status={status_code}, result={result}")
                
                if status_code in [200, 201]:
                    results.append({"listingId": listing_id, "success": True, "newPrice": new_price})
                    successful_updates += 1
                    
                    # Remove this suggestion from the session since it's been applied
                    suggestions = [s for s in suggestions if s.get("listingId") != listing_id]
                else:
                    results.append({"listingId": listing_id, "success": False, "error": "Failed to update listing"})
                    errors += 1
                    
            except Exception as e:
                logger.error(f"Error applying price for listing {listing_id}: {e}")
                results.append({"listingId": listing_id, "success": False, "error": str(e)})
                errors += 1
        
        # Update session with remaining suggestions
        session_manager.update_session_data(session_id, "suggestions", suggestions)
        
        # Log the bulk operation
        logs = session.get("logs", [])
        log_entry = {
            "id": f"bulk_apply_{int(time.time())}",
            "userId": user.id,
            "runDate": datetime.now().isoformat(),
            "status": "completed" if errors == 0 else "completed_with_errors",
            "itemsScanned": len(listing_ids),
            "itemsUpdated": successful_updates,
            "errors": errors,
            "isDryRun": False,
            "action": "bulk_apply",
            "results": results
        }
        
        logs.append(log_entry)
        session_manager.update_session_data(session_id, "logs", logs)
        
        return {
            "message": f"Bulk apply completed: {successful_updates} successful, {errors} errors",
            "successful_updates": successful_updates,
            "errors": errors,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Failed to bulk apply price suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to apply price suggestions: {str(e)}")

@app.post("/inventory/decline/{listing_id}")
async def decline_price_suggestion(listing_id: int, session_id: str = None):
    """Decline a price suggestion"""
    user = require_auth(session_id)
    
    try:
        # Log the decline
        session = session_manager.get_session(session_id)
        logs = session.get("logs", [])
        
        log_entry = {
            "id": f"decline_{listing_id}_{int(time.time())}",
            "userId": user.id,
            "runDate": datetime.now().isoformat(),
            "status": "completed",
            "itemsScanned": 1,
            "itemsUpdated": 0,
            "errors": 0,
            "isDryRun": False,
            "action": "decline",
            "listingId": listing_id
        }
        
        logs.append(log_entry)
        session_manager.update_session_data(session_id, "logs", logs)
        
        return {"message": "Price suggestion declined"}
        
    except Exception as e:
        logger.error(f"Failed to decline price suggestion: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to decline suggestion: {str(e)}")

# Logs endpoints
@app.get("/user/profile")
async def get_user_profile(session_id: str = None):
    """Get user's Discogs profile information"""
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    try:
        # Initialize Discogs client
        consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
        consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
        
        client = DiscogsClient(
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
            access_token=user.accessToken,
            access_token_secret=user.accessTokenSecret
        )
        
        # Get user profile from Discogs
        logger.info(f"Fetching profile for user: {user.username}")
        profile = client.get_user_info()
        logger.info(f"Received profile data: {profile}")
        logger.info(f"Available profile fields: {list(profile.keys()) if isinstance(profile, dict) else 'Not a dict'}")
        
        # Map the profile data to our expected format
        # Discogs API uses 'realname' for the real name field
        mapped_profile = {
            "username": profile.get("username"),
            "name": profile.get("realname"),  # Discogs uses 'realname' not 'name'
            "home_page": profile.get("home_page"),
            "location": profile.get("location"),
            "profile": profile.get("profile"),
            "curr_abbr": profile.get("curr_abbr"),
            "avatar": profile.get("avatar_url"),
            "id": profile.get("id"),
            "resource_url": profile.get("resource_url")
        }
        
        logger.info(f"Mapped profile data: {mapped_profile}")
        return mapped_profile
        
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        logger.error(f"User data: {user}")
        raise HTTPException(status_code=500, detail=f"Failed to get user profile: {str(e)}")

@app.post("/auth/refresh-avatar")
async def refresh_avatar(session_id: str = None):
    """Refresh user's avatar from Discogs and update session"""
    user = require_auth(session_id)
    require_discogs_auth(user)
    
    try:
        # Initialize Discogs client
        consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
        consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
        
        client = DiscogsClient(
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
            access_token=user.accessToken,
            access_token_secret=user.accessTokenSecret
        )
        
        # Get user profile from Discogs (includes avatar_url)
        logger.info(f"Refreshing avatar for user: {user.username}")
        profile = client.get_user_info()
        avatar_url = profile.get("avatar_url")
        
        if avatar_url:
            # Update session with avatar
            session = session_manager.get_session(session_id)
            user_data = session["user"]
            user_data["avatar"] = avatar_url
            session_manager.update_session_data(session_id, "user", user_data)
            
            logger.info(f"Avatar updated for user {user.username}: {avatar_url}")
            return {
                "avatar": avatar_url,
                "message": "Avatar refreshed successfully"
            }
        else:
            logger.warning(f"No avatar found for user {user.username}")
            return {
                "avatar": None,
                "message": "No avatar available"
            }
        
    except Exception as e:
        logger.error(f"Error refreshing avatar: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh avatar: {str(e)}")

@app.get("/logs")
async def get_logs(session_id: str = None):
    """Get run logs"""
    user = require_auth(session_id)
    session = session_manager.get_session(session_id)
    return session["logs"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
