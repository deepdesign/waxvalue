-- WaxValue Wanted List Feature Database Schema
-- Created: December 2024
-- Purpose: Add tables for Discogs price alerts and wanted list functionality

-- Create wanted_list_entries table
CREATE TABLE IF NOT EXISTS wanted_list_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    discogs_release_id INTEGER NOT NULL,
    release_title VARCHAR,
    artist_name VARCHAR,
    release_year INTEGER,
    release_format VARCHAR,
    cover_image_url VARCHAR,
    
    -- Alert conditions
    max_price DECIMAL(10,2),
    max_price_currency VARCHAR(3) DEFAULT 'USD',
    min_condition VARCHAR(10),
    location_filter VARCHAR(100),
    min_seller_rating DECIMAL(3,2),
    underpriced_percentage INTEGER,
    
    -- Status and monitoring
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP,
    status VARCHAR(20) DEFAULT 'monitoring',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, discogs_release_id),
    CHECK (max_price > 0 OR max_price IS NULL),
    CHECK (min_seller_rating >= 0 AND min_seller_rating <= 100 OR min_seller_rating IS NULL),
    CHECK (underpriced_percentage > 0 AND underpriced_percentage <= 100 OR underpriced_percentage IS NULL),
    CHECK (status IN ('monitoring', 'price_matched', 'underpriced', 'no_listings', 'paused'))
);

-- Create alert_notifications table
CREATE TABLE IF NOT EXISTS alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wanted_list_entry_id UUID NOT NULL REFERENCES wanted_list_entries(id) ON DELETE CASCADE,
    listing_id INTEGER,
    listing_price DECIMAL(10,2),
    listing_currency VARCHAR(3),
    listing_condition VARCHAR(20),
    seller_name VARCHAR,
    seller_rating DECIMAL(3,2),
    listing_url VARCHAR,
    notification_type VARCHAR(20) NOT NULL,
    email_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CHECK (listing_price > 0 OR listing_price IS NULL),
    CHECK (seller_rating >= 0 AND seller_rating <= 100 OR seller_rating IS NULL),
    CHECK (notification_type IN ('price_matched', 'underpriced', 'new_listing'))
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_wanted_list_user_id ON wanted_list_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_wanted_list_active ON wanted_list_entries(is_active);
CREATE INDEX IF NOT EXISTS idx_wanted_list_release_id ON wanted_list_entries(discogs_release_id);
CREATE INDEX IF NOT EXISTS idx_wanted_list_status ON wanted_list_entries(status);
CREATE INDEX IF NOT EXISTS idx_wanted_list_last_checked ON wanted_list_entries(last_checked);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_entry_id ON alert_notifications(wanted_list_entry_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_type ON alert_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_created_at ON alert_notifications(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_wanted_list_entries_updated_at 
    BEFORE UPDATE ON wanted_list_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE wanted_list_entries IS 'Stores user wanted list entries with alert criteria for Discogs releases';
COMMENT ON TABLE alert_notifications IS 'Stores sent alert notifications for wanted list entries';

COMMENT ON COLUMN wanted_list_entries.user_id IS 'User identifier (session-based)';
COMMENT ON COLUMN wanted_list_entries.discogs_release_id IS 'Discogs release ID for monitoring';
COMMENT ON COLUMN wanted_list_entries.max_price IS 'Maximum price threshold for alerts';
COMMENT ON COLUMN wanted_list_entries.min_condition IS 'Minimum condition requirement (M, NM, VG+, VG, G+, G)';
COMMENT ON COLUMN wanted_list_entries.location_filter IS 'Geographic filter (e.g., EU, UK, US)';
COMMENT ON COLUMN wanted_list_entries.min_seller_rating IS 'Minimum seller rating percentage';
COMMENT ON COLUMN wanted_list_entries.underpriced_percentage IS 'Alert when underpriced by this percentage';
COMMENT ON COLUMN wanted_list_entries.status IS 'Current monitoring status';

COMMENT ON COLUMN alert_notifications.notification_type IS 'Type of alert sent (price_matched, underpriced, new_listing)';
COMMENT ON COLUMN alert_notifications.email_sent_at IS 'Timestamp when email was sent (NULL if not sent)';
