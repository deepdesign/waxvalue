#!/usr/bin/env python3
"""
Criteria Matching Logic for WaxValue Wanted List

This module handles the evaluation of marketplace listings against
user-defined alert criteria.

Follows development guidelines:
- Proper error handling and logging
- Type safety and validation
- Performance optimization
- Clear business logic separation
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class MatchType(Enum):
    """Types of matches that can occur."""
    PRICE_MATCHED = "price_matched"
    UNDERPRICED = "underpriced"
    NEW_LISTING = "new_listing"
    CONDITION_UPGRADE = "condition_upgrade"

@dataclass
class ListingCriteria:
    """Criteria for evaluating listings."""
    max_price: Optional[float]
    max_price_currency: str
    min_condition: Optional[str]
    location_filter: Optional[str]
    min_seller_rating: Optional[float]
    underpriced_percentage: Optional[int]

@dataclass
class MarketplaceListing:
    """Marketplace listing data."""
    id: int
    price: float
    currency: str
    condition: str
    sleeve_condition: str
    seller_name: str
    seller_rating: float
    location: str
    url: str
    date_added: Optional[str] = None

@dataclass
class MatchResult:
    """Result of criteria matching."""
    matches: bool
    match_type: Optional[MatchType]
    reason: str
    confidence_score: float  # 0.0 to 1.0
    additional_info: Dict[str, Any]

class CriteriaMatcher:
    """
    Evaluates marketplace listings against user-defined criteria.
    
    Provides sophisticated matching logic for:
    - Price thresholds and currency conversion
    - Condition requirements and grading
    - Geographic filtering
    - Seller reputation requirements
    - Underpriced detection
    """
    
    def __init__(self):
        # Condition order for comparison (higher number = better condition)
        self.condition_order = {
            'M': 6,     # Mint
            'NM': 5,    # Near Mint
            'VG+': 4,   # Very Good Plus
            'VG': 3,    # Very Good
            'G+': 2,    # Good Plus
            'G': 1      # Good
        }
        
        # Currency conversion rates (would be fetched from API in production)
        self.currency_rates = {
            'USD': 1.0,
            'EUR': 0.85,
            'GBP': 0.73,
            'CAD': 1.35,
            'AUD': 1.52,
            'JPY': 110.0
        }
        
        # Geographic filter mappings
        self.location_mappings = {
            'EU': ['europe', 'eu', 'european union'],
            'UK': ['united kingdom', 'uk', 'britain', 'england', 'scotland', 'wales'],
            'US': ['united states', 'usa', 'us', 'america'],
            'CA': ['canada', 'ca'],
            'AU': ['australia', 'au'],
            'JP': ['japan', 'jp']
        }
    
    def evaluate_listing(
        self, 
        listing: MarketplaceListing, 
        criteria: ListingCriteria,
        historical_data: Optional[Dict[str, Any]] = None
    ) -> MatchResult:
        """
        Evaluate a listing against user criteria.
        
        Args:
            listing: The marketplace listing to evaluate
            criteria: User-defined alert criteria
            historical_data: Optional historical pricing data
            
        Returns:
            MatchResult with detailed evaluation
        """
        try:
            logger.debug(f"Evaluating listing {listing.id} against criteria")
            
            # Check basic requirements first
            basic_checks = self._check_basic_requirements(listing, criteria)
            if not basic_checks['passes']:
                return MatchResult(
                    matches=False,
                    match_type=None,
                    reason=basic_checks['reason'],
                    confidence_score=0.0,
                    additional_info=basic_checks
                )
            
            # Evaluate different match types
            price_match = self._check_price_criteria(listing, criteria)
            condition_match = self._check_condition_criteria(listing, criteria)
            underpriced_match = self._check_underpriced_criteria(listing, criteria, historical_data)
            
            # Determine the best match
            best_match = self._determine_best_match(
                price_match, condition_match, underpriced_match
            )
            
            return best_match
            
        except Exception as e:
            logger.error(f"Error evaluating listing {listing.id}: {e}")
            return MatchResult(
                matches=False,
                match_type=None,
                reason=f"Evaluation error: {str(e)}",
                confidence_score=0.0,
                additional_info={'error': str(e)}
            )
    
    def _check_basic_requirements(
        self, 
        listing: MarketplaceListing, 
        criteria: ListingCriteria
    ) -> Dict[str, Any]:
        """Check basic requirements that must all pass."""
        checks = {
            'passes': True,
            'reason': '',
            'details': {}
        }
        
        # Check seller rating
        if criteria.min_seller_rating and listing.seller_rating < criteria.min_seller_rating:
            checks['passes'] = False
            checks['reason'] = f"Seller rating {listing.seller_rating}% below minimum {criteria.min_seller_rating}%"
            checks['details']['seller_rating'] = {
                'actual': listing.seller_rating,
                'required': criteria.min_seller_rating,
                'passes': False
            }
            return checks
        
        checks['details']['seller_rating'] = {
            'actual': listing.seller_rating,
            'required': criteria.min_seller_rating,
            'passes': True
        }
        
        # Check location filter
        if criteria.location_filter:
            location_passes = self._check_location_filter(listing.location, criteria.location_filter)
            if not location_passes:
                checks['passes'] = False
                checks['reason'] = f"Location '{listing.location}' doesn't match filter '{criteria.location_filter}'"
                checks['details']['location'] = {
                    'actual': listing.location,
                    'required': criteria.location_filter,
                    'passes': False
                }
                return checks
            
            checks['details']['location'] = {
                'actual': listing.location,
                'required': criteria.location_filter,
                'passes': True
            }
        
        return checks
    
    def _check_price_criteria(
        self, 
        listing: MarketplaceListing, 
        criteria: ListingCriteria
    ) -> Optional[MatchResult]:
        """Check if listing meets price criteria."""
        if not criteria.max_price:
            return None
        
        try:
            # Convert listing price to criteria currency
            listing_price_usd = self._convert_currency(
                listing.price, listing.currency, 'USD'
            )
            criteria_price_usd = self._convert_currency(
                criteria.max_price, criteria.max_price_currency, 'USD'
            )
            
            if listing_price_usd <= criteria_price_usd:
                confidence = max(0.0, 1.0 - (listing_price_usd / criteria_price_usd))
                
                return MatchResult(
                    matches=True,
                    match_type=MatchType.PRICE_MATCHED,
                    reason=f"Price ${listing.price:.2f} {listing.currency} (${listing_price_usd:.2f} USD) within budget ${criteria.max_price:.2f} {criteria.max_price_currency}",
                    confidence_score=confidence,
                    additional_info={
                        'listing_price_usd': listing_price_usd,
                        'criteria_price_usd': criteria_price_usd,
                        'savings': criteria_price_usd - listing_price_usd
                    }
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking price criteria: {e}")
            return None
    
    def _check_condition_criteria(
        self, 
        listing: MarketplaceListing, 
        criteria: ListingCriteria
    ) -> Optional[MatchResult]:
        """Check if listing meets condition criteria."""
        if not criteria.min_condition:
            return None
        
        try:
            listing_score = self.condition_order.get(listing.condition, 0)
            min_score = self.condition_order.get(criteria.min_condition, 0)
            
            if listing_score >= min_score:
                confidence = listing_score / 6.0  # Normalize to 0-1
                
                return MatchResult(
                    matches=True,
                    match_type=MatchType.CONDITION_UPGRADE if listing_score > min_score else MatchType.PRICE_MATCHED,
                    reason=f"Condition {listing.condition} meets or exceeds required {criteria.min_condition}",
                    confidence_score=confidence,
                    additional_info={
                        'listing_condition': listing.condition,
                        'required_condition': criteria.min_condition,
                        'condition_score': listing_score
                    }
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking condition criteria: {e}")
            return None
    
    def _check_underpriced_criteria(
        self, 
        listing: MarketplaceListing, 
        criteria: ListingCriteria,
        historical_data: Optional[Dict[str, Any]] = None
    ) -> Optional[MatchResult]:
        """Check if listing is underpriced compared to market."""
        if not criteria.underpriced_percentage:
            return None
        
        try:
            # Calculate median price (placeholder - would use real market data)
            median_price = self._calculate_median_price(listing, historical_data)
            
            if median_price is None:
                return None
            
            # Convert listing price to same currency as median
            listing_price_usd = self._convert_currency(
                listing.price, listing.currency, 'USD'
            )
            
            # Calculate discount percentage
            discount_percentage = ((median_price - listing_price_usd) / median_price) * 100
            
            if discount_percentage >= criteria.underpriced_percentage:
                confidence = min(1.0, discount_percentage / 50.0)  # Cap at 50% discount
                
                return MatchResult(
                    matches=True,
                    match_type=MatchType.UNDERPRICED,
                    reason=f"Underpriced by {discount_percentage:.1f}% (${listing_price_usd:.2f} vs ${median_price:.2f} median)",
                    confidence_score=confidence,
                    additional_info={
                        'listing_price_usd': listing_price_usd,
                        'median_price_usd': median_price,
                        'discount_percentage': discount_percentage,
                        'savings': median_price - listing_price_usd
                    }
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking underpriced criteria: {e}")
            return None
    
    def _check_location_filter(self, listing_location: str, filter_location: str) -> bool:
        """Check if listing location matches the filter."""
        if not filter_location:
            return True
        
        listing_location_lower = listing_location.lower()
        filter_location_upper = filter_location.upper()
        
        # Direct match
        if filter_location_upper in listing_location_lower:
            return True
        
        # Check mapped locations
        if filter_location_upper in self.location_mappings:
            for keyword in self.location_mappings[filter_location_upper]:
                if keyword in listing_location_lower:
                    return True
        
        return False
    
    def _convert_currency(self, amount: float, from_currency: str, to_currency: str) -> float:
        """Convert currency amount (simplified - would use real API in production)."""
        if from_currency == to_currency:
            return amount
        
        from_rate = self.currency_rates.get(from_currency, 1.0)
        to_rate = self.currency_rates.get(to_currency, 1.0)
        
        # Convert to USD first, then to target currency
        usd_amount = amount / from_rate
        return usd_amount * to_rate
    
    def _calculate_median_price(
        self, 
        listing: MarketplaceListing, 
        historical_data: Optional[Dict[str, Any]] = None
    ) -> Optional[float]:
        """Calculate median price for underpriced detection."""
        try:
            # Placeholder implementation - would use real market data
            if historical_data and 'median_price' in historical_data:
                return float(historical_data['median_price'])
            
            # Simple heuristic based on condition
            condition_multipliers = {
                'M': 1.2,
                'NM': 1.1,
                'VG+': 1.0,
                'VG': 0.9,
                'G+': 0.8,
                'G': 0.7
            }
            
            base_price = 25.0  # Placeholder base price
            multiplier = condition_multipliers.get(listing.condition, 1.0)
            
            return base_price * multiplier
            
        except Exception as e:
            logger.error(f"Error calculating median price: {e}")
            return None
    
    def _determine_best_match(
        self, 
        price_match: Optional[MatchResult],
        condition_match: Optional[MatchResult],
        underpriced_match: Optional[MatchResult]
    ) -> MatchResult:
        """Determine the best match from all possible matches."""
        matches = [m for m in [price_match, condition_match, underpriced_match] if m is not None]
        
        if not matches:
            return MatchResult(
                matches=False,
                match_type=None,
                reason="No criteria matched",
                confidence_score=0.0,
                additional_info={}
            )
        
        # Sort by confidence score (highest first)
        matches.sort(key=lambda x: x.confidence_score, reverse=True)
        best_match = matches[0]
        
        # Combine additional info from all matches
        combined_info = {}
        for match in matches:
            combined_info.update(match.additional_info)
        
        best_match.additional_info = combined_info
        
        return best_match
    
    def batch_evaluate_listings(
        self, 
        listings: List[MarketplaceListing], 
        criteria: ListingCriteria,
        historical_data: Optional[Dict[str, Any]] = None
    ) -> List[Tuple[MarketplaceListing, MatchResult]]:
        """
        Evaluate multiple listings in batch for performance.
        
        Returns list of tuples (listing, match_result) for listings that match.
        """
        try:
            results = []
            
            for listing in listings:
                result = self.evaluate_listing(listing, criteria, historical_data)
                if result.matches:
                    results.append((listing, result))
            
            # Sort by confidence score (highest first)
            results.sort(key=lambda x: x[1].confidence_score, reverse=True)
            
            logger.info(f"Batch evaluation: {len(results)} matches out of {len(listings)} listings")
            return results
            
        except Exception as e:
            logger.error(f"Error in batch evaluation: {e}")
            return []

# Global matcher instance
criteria_matcher = CriteriaMatcher()
