-- Add developer_code column to waitlist table
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS developer_code VARCHAR(255) UNIQUE;
