"""
Item-specific strategy assignment models for WaxValue
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class ItemStrategy(Base):
    """Individual item strategy assignments"""
    __tablename__ = "item_strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    listing_id = Column(Integer, nullable=False, index=True)  # Discogs listing ID
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=False)
    
    # Strategy override settings (optional)
    override_settings = Column(JSON, nullable=True)  # {"offsetValue": 10, "maxChangePercent": 20}
    
    # Assignment metadata
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_by = Column(String(50), nullable=True)  # 'user', 'bulk', 'auto'
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Unique constraint: one active strategy per listing per user
    __table_args__ = (
        UniqueConstraint('user_id', 'listing_id', 'is_active', name='unique_active_item_strategy'),
    )
    
    # Relationships
    strategy = relationship("Strategy", back_populates="item_assignments")
    user = relationship("User", back_populates="item_strategies")

class ItemStrategyHistory(Base):
    """History of strategy changes for audit trail"""
    __tablename__ = "item_strategy_history"
    
    id = Column(Integer, primary_key=True, index=True)
    item_strategy_id = Column(Integer, ForeignKey("item_strategies.id"), nullable=False)
    action = Column(String(20), nullable=False)  # 'assigned', 'modified', 'removed'
    
    # Change details
    old_strategy_id = Column(Integer, nullable=True)
    new_strategy_id = Column(Integer, nullable=True)
    old_settings = Column(JSON, nullable=True)
    new_settings = Column(JSON, nullable=True)
    
    # Metadata
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    changed_by = Column(String(50), nullable=True)
    reason = Column(String(200), nullable=True)  # User-provided reason for change
