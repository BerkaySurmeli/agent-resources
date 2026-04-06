-- Add admin fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_master_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_master_admin ON users(is_master_admin);

-- Set berkay@shopagentresources.com as master admin if exists
UPDATE users SET is_admin = TRUE, is_master_admin = TRUE WHERE email = 'berkay@shopagentresources.com';
