#!/usr/bin/env python3

import os
import secrets
import logging
import time
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

def get_user_inventory_all_pages(client: DiscogsClient, username: str) -> List[Dict[str, Any]]:
    """Fetch all pages of user inventory"""
    all_listings = []
    page = 1
    per_page = 100  # Maximum per page from Discogs API
    
    try:
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import persistent session manager
from session_manager import session_manager

# Pydantic models
class User(BaseModel):
    id: str
    username: str
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
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
    condition: str
    artist: str
    title: str
    label: str
    imageUrl: str

# Simplified pricing - just use Discogs' exact condition suggestions

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
    """Initialize OAuth flow with Discogs"""
    consumer_key = os.getenv("DISCOGS_CONSUMER_KEY")
    consumer_secret = os.getenv("DISCOGS_CONSUMER_SECRET")
    
    if not consumer_key or not consumer_secret:
        raise HTTPException(status_code=500, detail="Discogs API credentials not configured")
    
    try:
        oauth = DiscogsOAuth(consumer_key, consumer_secret)
        request_token, request_token_secret = oauth.get_request_token("http://localhost:3000/auth/callback")
        auth_url = oauth.get_authorize_url(request_token)
    
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
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
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
        except Exception as e:
            logger.error(f"Failed to get user info from Discogs: {e}")
            user_info = {"username": "discogs_user", "id": 1}
        
        # Update user session with Discogs data
        if not session_manager.has_session(session_id):
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = session_manager.get_session(session_id)
        user_data = session["user"]
        
        # Update user with Discogs info
        user_data.update({
            "discogsUserId": user_info["id"],
            "username": user_info["username"],
            "email": user_info.get("email", user_data.get("email")),
            "firstName": user_info.get("first_name"),
            "lastName": user_info.get("last_name"),
            "accessToken": access_token,
            "accessTokenSecret": access_token_secret
        })
        
        # Save updated session data
        session_manager.update_session_data(session_id, "user", user_data)
    
    return {
            "user": User(**user_data),
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
        
        # Get user inventory count (For Sale items only) - fetch all pages for accurate count
        try:
            all_listings = get_user_inventory_all_pages(client, user.username)
            logger.info(f"Fetched {len(all_listings)} total listings for dashboard summary")
            
            # Count only "For Sale" items
            for_sale_count = len([listing for listing in all_listings if listing.get("status") == "For Sale"])
            total_listings = for_sale_count
            logger.info(f"Dashboard summary: {total_listings} For Sale items")
        except Exception as e:
            logger.error(f"Error fetching inventory for dashboard: {e}")
            # Fallback to basic count if pagination fails
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
@app.get("/inventory/suggestions")
async def get_suggestions(session_id: str = None):
    """Get pricing suggestions for user's inventory"""
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
        
        # Use the stored username from the session (avoid extra API call)
        username = user.username
        logger.info(f"Using stored username: {username}")
        
        if not username:
            raise HTTPException(status_code=400, detail="Could not get user username")
        
        # Get user's inventory - fetch ALL pages of items for analysis
        logger.info("Fetching all inventory pages...")
        all_listings = get_user_inventory_all_pages(client, username)
        
        # Filter to only include items that are "For Sale"
        for_sale_listings = [listing for listing in all_listings if listing.get("status") == "For Sale"]
        
        logger.info(f"Fetched {len(all_listings)} total listings from Discogs")
        logger.info(f"Status breakdown: {[listing.get('status') for listing in all_listings[:10]]}")  # Log first 10 statuses
        logger.info(f"Filtered to {len(for_sale_listings)} For Sale items")
        
        suggestions = []
        
        # Process for-sale items (limit to prevent timeouts and rate limits)
        max_items = min(500, len(for_sale_listings))  # Increased to 500 items for Phase 1
        items_to_process = for_sale_listings[:max_items]
        logger.info(f"Processing {len(items_to_process)} For Sale items (limited to {max_items} to prevent rate limits)...")
        
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
            
            try:
                # Handle price as dict with 'value' field from Discogs API
                price_data = listing.get("price", {})
                if isinstance(price_data, dict):
                    current_price = float(price_data.get("value", 0))
                else:
                    current_price = float(price_data or 0)
                # Get price suggestions from Discogs
                price_suggestions = client.get_price_suggestions(release_id)
                stats = {}
                
                # Debug: Log the actual response structure
                logger.info(f"Price suggestions for release {release_id}: {price_suggestions}")
                
                # Use Discogs' exact condition suggestion
                if price_suggestions and isinstance(price_suggestions, dict):
                    suggested_price = None
                    condition_used = None
                    listing_condition = listing.get("condition", "").upper()
                    
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
                    
                    # If no specific condition match, use first available suggestion
                    if suggested_price is None:
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
                        
                        suggestion = PriceSuggestion(
                                listingId=listing_id,
                                releaseId=release_id,
                                currentPrice=current_price,
                                suggestedPrice=round(suggested_price, 2),
                                basis=basis_simple,
                                status=status,
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
            "message": f"Found {len(suggestions)} pricing suggestions"
        }
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")

# Strategy endpoints removed - using only Discogs' exact condition suggestions

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

# Logs endpoints
@app.get("/logs")
async def get_logs(session_id: str = None):
    """Get run logs"""
    user = require_auth(session_id)
    session = session_manager.get_session(session_id)
    return session["logs"]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
