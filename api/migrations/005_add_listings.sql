-- Migration: Add listings table with security scan support
-- Created: 2026-03-29

-- Create enum type for listing status (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE listing_status AS ENUM (
            'pending_payment',
            'pending_scan',
            'scanning',
            'approved',
            'rejected',
            'payment_failed'
        );
    END IF;
END $$;

-- Create listings table (if not exists)
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id),
    
    -- Listing details
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category product_category NOT NULL,
    category_tags TEXT[] DEFAULT '{}',
    price_cents INTEGER NOT NULL DEFAULT 0,
    
    -- File storage
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    file_count INTEGER NOT NULL DEFAULT 0,
    
    -- Security scan
    status listing_status NOT NULL DEFAULT 'pending_payment',
    scan_started_at TIMESTAMP,
    scan_completed_at TIMESTAMP,
    scan_results JSONB DEFAULT '{}',
    virustotal_report TEXT,
    rejection_reason TEXT,
    
    -- Payment
    listing_fee_cents INTEGER NOT NULL DEFAULT 0,
    payment_intent_id VARCHAR(255),
    payment_status VARCHAR(50) DEFAULT 'pending',
    
    -- Published product reference
    product_id UUID REFERENCES products(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_product ON listings(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);

-- Create trigger to update updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_listings_updated_at') THEN
        CREATE TRIGGER update_listings_updated_at
            BEFORE UPDATE ON listings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
