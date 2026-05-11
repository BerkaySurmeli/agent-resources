-- Add expires_at column to guest_download_tokens table
-- Migration: 027_add_guest_token_expiry.sql
-- Date: 2026-05-11

ALTER TABLE guest_download_tokens
ADD COLUMN expires_at TIMESTAMP;

-- Set expiry to 90 days from creation for existing tokens
-- This gives existing guests a grace period rather than immediately invalidating their links
UPDATE guest_download_tokens
SET expires_at = created_at + INTERVAL '90 days'
WHERE expires_at IS NULL;

-- Add comment explaining the field
COMMENT ON COLUMN guest_download_tokens.expires_at IS 'Token expiration timestamp. Tokens expire 90 days after purchase to encourage account creation while respecting guest checkout convenience.';
