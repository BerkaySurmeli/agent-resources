-- Add developer incentive fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS developer_code VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS first_sale_bonus_paid BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_developer_code ON users(developer_code);
