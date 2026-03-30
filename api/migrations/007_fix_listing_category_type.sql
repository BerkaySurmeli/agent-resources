-- Migration: Change listings.category from enum to varchar
-- This fixes the enum value issues with category

ALTER TABLE listings 
ALTER COLUMN category TYPE VARCHAR(50);
