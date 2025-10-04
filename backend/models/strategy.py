"""
Pricing strategy models for WaxValue
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class Strategy(Base):
    """Pricing strategy configuration"""
    __tablename__ = "strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Basic strategy info
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Pricing configuration
    anchor = Column(String(20), nullable=False)  # mean, median, mode, cheapest, most_expensive, percentile
    offset_type = Column(String(10), nullable=False)  # percentage, fixed
    offset_value = Column(Float, nullable=False)
    
    # Condition weights (stored as JSON)
    condition_weights = Column(JSON, nullable=False, default={"media": 0.7, "sleeve": 0.3})
    
    # Scarcity boost configuration (stored as JSON)
    scarcity_boost = Column(JSON, nullable=True)  # {"threshold": 5, "boost_percent": 15}
    
    # Price limits
    floor = Column(Integer, nullable=True)  # Minimum price in cents
    ceiling = Column(Integer, nullable=True)  # Maximum price in cents
    
    # Rounding and change limits
    rounding = Column(Float, default=0.50, nullable=False)  # Rounding increment
    max_change_percent = Column(Integer, default=25, nullable=False)
    
    # Strategy status
    is_active = Column(Boolean, default=False, nullable=False)
    is_preset = Column(Boolean, default=False, nullable=False)  # System vs user-created
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="strategies")
