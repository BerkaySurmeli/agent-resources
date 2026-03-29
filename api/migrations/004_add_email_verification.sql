-- Migration: Add email verification fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP;

-- Create index on verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
