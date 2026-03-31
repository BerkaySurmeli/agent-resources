-- Migration: Add missing listing translation fields and table
-- Fixes: Issue #2 - Delete developer account has database error
-- The Listing model has original_language and translation_status fields
-- and a ListingTranslation relationship that weren't in the original migration

-- Add missing columns to listings table
ALTER TABLE listings 
    ADD COLUMN IF NOT EXISTS original_language VARCHAR(10) DEFAULT 'en',
    ADD COLUMN IF NOT EXISTS translation_status VARCHAR(50) DEFAULT 'pending';

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_listings_original_language ON listings(original_language);
CREATE INDEX IF NOT EXISTS idx_listings_translation_status ON listings(translation_status);

-- Create listing_translations table for multilingual support
CREATE TABLE IF NOT EXISTS listing_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    translated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one translation per language per listing
    UNIQUE(listing_id, language)
);

-- Create indexes for translations
CREATE INDEX IF NOT EXISTS idx_listing_translations_listing ON listing_translations(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_translations_language ON listing_translations(language);
