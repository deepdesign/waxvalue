"""
Development version of WaxValue backend with mock data
No database required - uses in-memory storage
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from datetime import datetime, timedelta
import random

app = FastAPI(title="WaxValue API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data storage
mock_data = {
    "users": {},
    "settings": {},
    "strategies": [],
    "logs": [],
    "suggestions": []
}

# Pydantic models
class User(BaseModel):
    id: int
    username: str
    discogsUserId: Optional[int] = None
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None

class UserSettings(BaseModel):
    currency: str = "USD"
    defaultDryRun: bool = True
    dailySchedule: str = "09:00"
    globalFloor: float = 5.0
    globalCeiling: float = 1000.0
    maxChangePercent: int = 25
    apiRateLimitSeconds: float = 1.2
    logRetentionDays: int = 90
    autoUpdateIncreases: bool = False
    alertThreshold: int = 25

class Strategy(BaseModel):
    id: int
    name: str
    description: str
    anchorMetric: str
    offset: float
    offsetType: str
    isActive: bool = False

class PriceSuggestion(BaseModel):
    listingId: int
    currentPrice: float
    suggestedPrice: float
    confidence: str
    basis: str
    condition: str
    sleeveCondition: str
    decision: Optional[str] = None

class RunLog(BaseModel):
    id: int
    runDate: str
    isDryRun: bool
    status: str
    itemsScanned: int
    itemsUpdated: int
    itemsSkipped: int
    errors: int
    errorMessage: Optional[str] = None

# Initialize mock data
def init_mock_data():
    # Mock user
    mock_data["users"][1] = User(
        id=1,
        username="demouser",
        discogsUserId=12345,
        email="demo@waxvalue.com",
        firstName="Demo",
        lastName="User"
    )
    
    # Mock settings
    mock_data["settings"][1] = UserSettings()
    
    # Mock strategies
    mock_data["strategies"] = [
        Strategy(
            id=1,
            name="Conservative Pricing",
            description="Median + 5% with safety limits",
            anchorMetric="median",
            offset=5.0,
            offsetType="percentage",
            isActive=True
        )
    ]
    
    # Mock suggestions
    mock_data["suggestions"] = [
        PriceSuggestion(
            listingId=1001,
            currentPrice=15.99,
            suggestedPrice=18.50,
            confidence="high",
            basis="Median +8%",
            condition="Near Mint",
            sleeveCondition="Very Good Plus"
        ),
        PriceSuggestion(
            listingId=1002,
            currentPrice=25.00,
            suggestedPrice=22.50,
            confidence="medium",
            basis="Median -10%",
            condition="Very Good Plus",
            sleeveCondition="Very Good"
        ),
        PriceSuggestion(
            listingId=1003,
            currentPrice=45.00,
            suggestedPrice=52.00,
            confidence="low",
            basis="Median +15%",
            condition="Mint",
            sleeveCondition="Near Mint"
        )
    ]
    
    # Mock logs
    mock_data["logs"] = [
        RunLog(
            id=1,
            runDate=(datetime.now() - timedelta(days=1)).isoformat(),
            isDryRun=True,
            status="completed",
            itemsScanned=150,
            itemsUpdated=0,
            itemsSkipped=150,
            errors=0
        ),
        RunLog(
            id=2,
            runDate=(datetime.now() - timedelta(hours=2)).isoformat(),
            isDryRun=False,
            status="completed",
            itemsScanned=150,
            itemsUpdated=12,
            itemsSkipped=138,
            errors=0
        )
    ]

# Initialize data on startup
init_mock_data()

# Auth endpoints
@app.get("/auth/me")
async def get_current_user():
    user = mock_data["users"].get(1)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/auth/login")
async def login(credentials: dict):
    email = credentials.get("email")
    password = credentials.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    # Mock authentication
    if email == "demo@waxvalue.com" and password == "demo123":
        user = mock_data["users"][1]
    else:
        # Create a new user for any other email/password combination
        user = User(
            id=2,
            username=email.split("@")[0],
            discogsUserId=None,
            email=email
        )
        mock_data["users"][2] = user
    
    return {
        "user": user,
        "token": "mock-jwt-token-" + str(int(datetime.now().timestamp())),
        "message": "Login successful"
    }

@app.post("/auth/register")
async def register(user_data: dict):
    email = user_data.get("email")
    password = user_data.get("password")
    firstName = user_data.get("firstName")
    lastName = user_data.get("lastName")
    
    if not all([email, password, firstName, lastName]):
        raise HTTPException(status_code=400, detail="All fields are required")
    
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Check if email already exists
    for user_id, user in mock_data["users"].items():
        if user.email == email:
            raise HTTPException(status_code=409, detail="Email already registered")
    
    # Create new user
    new_user_id = len(mock_data["users"]) + 1
    new_user = User(
        id=new_user_id,
        username=email.split("@")[0],
        discogsUserId=None,
        email=email
    )
    mock_data["users"][new_user_id] = new_user
    
    return {
        "user": new_user,
        "token": "mock-jwt-token-" + str(int(datetime.now().timestamp())),
        "message": "Registration successful"
    }

@app.post("/auth/setup")
async def setup_auth(credentials: dict):
    # Mock OAuth setup
    return {
        "authUrl": "https://discogs.com/oauth/authorize?oauth_token=mock_token",
        "requestToken": "mock_request_token"
    }

@app.post("/auth/verify")
async def verify_auth(verification: dict):
    # Mock verification
    return {
        "user": mock_data["users"][1],
        "message": "Account connected successfully"
    }

@app.post("/auth/disconnect")
async def disconnect_auth():
    return {"message": "Account disconnected successfully"}

# Dashboard endpoints
@app.get("/dashboard/summary")
async def get_dashboard_summary():
    return {
        "totalListings": 150,
        "suggestedUpdates": len(mock_data["suggestions"]),
        "averageDelta": 8.5,
        "lastRunDate": mock_data["logs"][-1].runDate if mock_data["logs"] else None,
        "isRunning": False
    }

@app.post("/simulate")
async def run_simulation():
    # Mock simulation
    return {
        "message": "Simulation completed",
        "suggestions": len(mock_data["suggestions"]),
        "dryRun": True
    }

# Inventory endpoints
@app.get("/inventory/suggestions")
async def get_suggestions():
    return mock_data["suggestions"]

@app.post("/inventory/apply")
async def apply_suggestion(data: dict):
    listing_id = data.get("listingId")
    for suggestion in mock_data["suggestions"]:
        if suggestion.listingId == listing_id:
            suggestion.decision = "applied"
    return {"message": "Suggestion applied"}

@app.post("/inventory/decline")
async def decline_suggestion(data: dict):
    listing_id = data.get("listingId")
    for suggestion in mock_data["suggestions"]:
        if suggestion.listingId == listing_id:
            suggestion.decision = "declined"
    return {"message": "Suggestion declined"}

@app.post("/inventory/bulk-apply")
async def bulk_apply(data: dict):
    listing_ids = data.get("listingIds", [])
    for suggestion in mock_data["suggestions"]:
        if suggestion.listingId in listing_ids:
            suggestion.decision = "applied"
    return {"message": f"{len(listing_ids)} suggestions applied"}

@app.post("/inventory/bulk-decline")
async def bulk_decline(data: dict):
    listing_ids = data.get("listingIds", [])
    for suggestion in mock_data["suggestions"]:
        if suggestion.listingId in listing_ids:
            suggestion.decision = "declined"
    return {"message": f"{len(listing_ids)} suggestions declined"}

# Strategies endpoints
@app.get("/strategies")
async def get_strategies():
    return mock_data["strategies"]

@app.post("/strategies")
async def create_strategy(strategy: Strategy):
    strategy.id = len(mock_data["strategies"]) + 1
    mock_data["strategies"].append(strategy)
    return strategy

@app.get("/strategies/preview")
async def preview_strategy(strategy_id: int):
    # Mock preview data
    return [
        {
            "title": "Sample Release 1",
            "artist": "Sample Artist",
            "currentPrice": 15.99,
            "suggestedPrice": 18.50,
            "basis": "Median +8%"
        },
        {
            "title": "Sample Release 2", 
            "artist": "Another Artist",
            "currentPrice": 25.00,
            "suggestedPrice": 22.50,
            "basis": "Median -10%"
        }
    ]

# Logs endpoints
@app.get("/logs")
async def get_logs():
    return mock_data["logs"]

@app.get("/logs/{run_log_id}/snapshots")
async def get_log_snapshots(run_log_id: int):
    # Mock snapshots
    return [
        {
            "listingId": 1001,
            "beforePrice": 15.99,
            "afterPrice": 18.50,
            "suggestedPrice": 18.50,
            "confidence": "high",
            "decision": "applied",
            "reasoning": "Price increase within safe limits"
        }
    ]

# Metrics endpoints
@app.get("/metrics/portfolio")
async def get_portfolio_metrics():
    return {
        "totalListings": 150,
        "underpriced": 45,
        "betweenP25P75": 80,
        "overpriced": 25,
        "averageDelta": 8.5
    }

@app.get("/metrics/trends")
async def get_trend_data():
    # Mock trend data
    dates = []
    for i in range(30):
        date = datetime.now() - timedelta(days=29-i)
        dates.append({
            "date": date.strftime("%Y-%m-%d"),
            "userPrice": 20 + random.uniform(-5, 5),
            "marketMedian": 22 + random.uniform(-3, 3)
        })
    return dates

@app.get("/metrics/distribution")
async def get_distribution_data():
    # Mock distribution data
    return [
        {"range": "$0-10", "count": 15},
        {"range": "$10-20", "count": 45},
        {"range": "$20-30", "count": 35},
        {"range": "$30-50", "count": 25},
        {"range": "$50+", "count": 30}
    ]

# Settings endpoints
@app.get("/settings")
async def get_settings():
    return mock_data["settings"].get(1, UserSettings())

@app.put("/settings")
async def update_settings(settings: UserSettings):
    mock_data["settings"][1] = settings
    return settings

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
