"""
User and authentication models for WaxValue
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    """User model for authentication and profile management"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    
    # Discogs integration
    discogs_user_id = Column(Integer, nullable=True, unique=True, index=True)
    discogs_username = Column(String(100), nullable=True)
    discogs_access_token = Column(Text, nullable=True)
    discogs_access_token_secret = Column(Text, nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    strategies = relationship("Strategy", back_populates="user")
    run_logs = relationship("RunLog", back_populates="user")
    listing_snapshots = relationship("ListingSnapshot", back_populates="user")
    price_history = relationship("PriceHistory", back_populates="user")

class UserSettings(Base):
    """User configuration and preferences"""
    __tablename__ = "user_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # Currency and localization
    currency = Column(String(3), default="USD", nullable=False)
    
    # Automation settings
    default_dry_run = Column(Boolean, default=True, nullable=False)
    daily_schedule = Column(String(5), default="09:00", nullable=True)  # HH:MM format
    auto_update_increases = Column(Boolean, default=False, nullable=False)
    alert_threshold = Column(Integer, default=25, nullable=False)  # Percentage
    
    # Price safeguards
    global_floor = Column(Integer, default=5, nullable=True)  # Minimum price in cents
    global_ceiling = Column(Integer, default=100000, nullable=True)  # Maximum price in cents
    max_change_percent = Column(Integer, default=25, nullable=False)
    
    # API settings
    api_rate_limit_seconds = Column(Integer, default=120, nullable=False)  # In milliseconds
    
    # Data retention
    log_retention_days = Column(Integer, default=90, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="settings")
