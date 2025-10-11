"""
Database initialization script for WaxValue
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from models import create_tables, drop_tables, engine, SessionLocal
from models.user import User, UserSettings
from models.strategy import Strategy
from models.logs import RunLog, ListingSnapshot, PriceHistory
from sqlalchemy.orm import Session
import hashlib
from datetime import datetime

def hash_password(password: str) -> str:
    """Simple password hashing (use proper hashing in production)"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_sample_data():
    """Create sample data for development"""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).first():
            print("Sample data already exists, skipping...")
            return
        
        # Create sample user
        sample_user = User(
            username="demo_user",
            email="demo@waxvalue.com",
            hashed_password=hash_password("demo123"),
            first_name="Demo",
            last_name="User",
            discogs_user_id=12345,
            discogs_username="demo_discogs_user",
            is_active=True,
            is_verified=True
        )
        db.add(sample_user)
        db.flush()  # Get the user ID
        
        # Create user settings
        user_settings = UserSettings(
            user_id=sample_user.id,
            currency="USD",
            default_dry_run=True,
            daily_schedule="09:00",
            auto_update_increases=False,
            alert_threshold=25,
            global_floor=500,  # $5.00
            global_ceiling=100000,  # $1000.00
            max_change_percent=25,
            api_rate_limit_seconds=120,
            log_retention_days=90
        )
        db.add(user_settings)
        
        # Create sample strategies
        conservative_strategy = Strategy(
            user_id=sample_user.id,
            name="Conservative",
            description="Stay slightly below market median for quick sales",
            anchor="median",
            offset_type="percentage",
            offset_value=-5.0,
            condition_weights={"media": 0.8, "sleeve": 0.2},
            scarcity_boost=None,
            floor=500,  # $5.00
            ceiling=50000,  # $500.00
            rounding=0.50,
            max_change_percent=15,
            is_active=True,
            is_preset=False
        )
        db.add(conservative_strategy)
        
        aggressive_strategy = Strategy(
            user_id=sample_user.id,
            name="Aggressive",
            description="Price above market to maximize profit",
            anchor="median",
            offset_type="percentage",
            offset_value=15.0,
            condition_weights={"media": 0.7, "sleeve": 0.3},
            scarcity_boost={"threshold": 3, "boost_percent": 25},
            floor=1000,  # $10.00
            ceiling=100000,  # $1000.00
            rounding=1.00,
            max_change_percent=30,
            is_active=False,
            is_preset=False
        )
        db.add(aggressive_strategy)
        
        # Create sample run log
        sample_run = RunLog(
            user_id=sample_user.id,
            run_date=datetime.now(),
            is_dry_run=True,
            items_scanned=25,
            items_updated=0,
            items_skipped=5,
            errors=0,
            status="completed",
            strategy_id=conservative_strategy.id,
            strategy_name="Conservative",
            run_config={"offset_value": -5, "max_change_percent": 15},
            duration_seconds=45.2
        )
        db.add(sample_run)
        db.flush()
        
        # Create sample listing snapshots
        sample_snapshots = [
            ListingSnapshot(
                run_log_id=sample_run.id,
                user_id=sample_user.id,
                listing_id=123456,
                release_id=789012,
                before_price=2500,  # $25.00
                suggested_price=2375,  # $23.75
                decision="applied",
                confidence="high",
                reasoning="Median - 5% with high confidence based on market data",
                market_data={
                    "median": 2500,
                    "mean": 2580,
                    "min": 2000,
                    "max": 3500,
                    "count": 12,
                    "scarcity": "medium"
                },
                listing_details={
                    "title": "Sample Release",
                    "artist": "Sample Artist",
                    "condition": "Very Good Plus",
                    "sleeve_condition": "Very Good"
                }
            ),
            ListingSnapshot(
                run_log_id=sample_run.id,
                user_id=sample_user.id,
                listing_id=123457,
                release_id=789013,
                before_price=1500,  # $15.00
                suggested_price=1425,  # $14.25
                decision="flagged",
                confidence="low",
                reasoning="Large price decrease requires manual review",
                market_data={
                    "median": 1500,
                    "mean": 1520,
                    "min": 1200,
                    "max": 2000,
                    "count": 8,
                    "scarcity": "high"
                },
                listing_details={
                    "title": "Another Release",
                    "artist": "Another Artist",
                    "condition": "Good",
                    "sleeve_condition": "Good"
                }
            )
        ]
        
        for snapshot in sample_snapshots:
            db.add(snapshot)
        
        # Create sample price history
        sample_history = [
            PriceHistory(
                user_id=sample_user.id,
                listing_id=123456,
                release_id=789012,
                date=datetime.now(),
                user_price=2500,
                market_median=2500,
                market_mean=2580,
                market_min=2000,
                market_max=3500,
                market_count=12
            ),
            PriceHistory(
                user_id=sample_user.id,
                listing_id=123457,
                release_id=789013,
                date=datetime.now(),
                user_price=1500,
                market_median=1500,
                market_mean=1520,
                market_min=1200,
                market_max=2000,
                market_count=8
            )
        ]
        
        for history in sample_history:
            db.add(history)
        
        db.commit()
        print("Sample data created successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating sample data: {e}")
        raise
    finally:
        db.close()

def main():
    """Main initialization function"""
    print("Initializing WaxValue database...")
    
    # Create tables
    print("Creating database tables...")
    create_tables()
    print("Database tables created successfully!")
    
    # Create sample data
    print("Creating sample data...")
    create_sample_data()
    
    print("Database initialization completed!")

if __name__ == "__main__":
    main()
