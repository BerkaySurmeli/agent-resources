-- Migration: Change products.category and products.privacy_level from enum to varchar

ALTER TABLE products 
ALTER COLUMN category TYPE VARCHAR(50);

ALTER TABLE products 
ALTER COLUMN privacy_level TYPE VARCHAR(50);
