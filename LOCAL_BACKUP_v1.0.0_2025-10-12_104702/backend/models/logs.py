"""
Logging and audit models for WaxValue
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class RunLog(Base):
    """Log of pricing simulation runs"""
    __tablename__ = "run_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Run metadata
    run_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_dry_run = Column(Boolean, default=True, nullable=False)
    
    # Run statistics
    items_scanned = Column(Integer, default=0, nullable=False)
    items_updated = Column(Integer, default=0, nullable=False)
    items_skipped = Column(Integer, default=0, nullable=False)
    errors = Column(Integer, default=0, nullable=False)
    
    # Run status
    status = Column(String(20), default="completed", nullable=False)  # completed, failed, partial
    error_message = Column(Text, nullable=True)
    
    # Strategy used
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)
    strategy_name = Column(String(100), nullable=True)  # Denormalized for performance
    
    # Run configuration (stored as JSON)
    run_config = Column(JSON, nullable=True)  # Parameters used for this run
    
    # Performance metrics
    duration_seconds = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="run_logs")
    strategy = relationship("Strategy")
    snapshots = relationship("ListingSnapshot", back_populates="run_log")

class ListingSnapshot(Base):
    """Snapshot of individual listing changes during a run"""
    __tablename__ = "listing_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    run_log_id = Column(Integer, ForeignKey("run_logs.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Listing identification
    listing_id = Column(Integer, nullable=False, index=True)  # Discogs listing ID
    release_id = Column(Integer, nullable=True)  # Discogs release ID
    
    # Price information
    before_price = Column(Integer, nullable=False)  # Price in cents
    after_price = Column(Integer, nullable=True)  # Price in cents (if applied)
    suggested_price = Column(Integer, nullable=False)  # Price in cents
    
    # Decision and reasoning
    decision = Column(String(20), nullable=False)  # applied, declined, skipped, flagged
    confidence = Column(String(10), nullable=False)  # high, medium, low
    reasoning = Column(Text, nullable=True)
    
    # Market data (stored as JSON)
    market_data = Column(JSON, nullable=True)  # Market statistics at time of run
    
    # Listing details (stored as JSON for flexibility)
    listing_details = Column(JSON, nullable=True)  # Title, artist, condition, etc.
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    run_log = relationship("RunLog", back_populates="snapshots")
    user = relationship("User", back_populates="listing_snapshots")

class PriceHistory(Base):
    """Historical price data for trend analysis"""
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Listing identification
    listing_id = Column(Integer, nullable=False, index=True)  # Discogs listing ID
    release_id = Column(Integer, nullable=True)  # Discogs release ID
    
    # Price data
    date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user_price = Column(Integer, nullable=False)  # User's price in cents
    market_median = Column(Integer, nullable=True)  # Market median in cents
    market_mean = Column(Integer, nullable=True)  # Market mean in cents
    market_min = Column(Integer, nullable=True)  # Market minimum in cents
    market_max = Column(Integer, nullable=True)  # Market maximum in cents
    market_count = Column(Integer, nullable=True)  # Number of active listings
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="price_history")
