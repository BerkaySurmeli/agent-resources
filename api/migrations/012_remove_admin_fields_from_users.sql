-- Remove admin fields from users table
-- Note: These fields are no longer used, admin authentication is now handled by admin_users table

-- Drop indexes first
DROP INDEX IF EXISTS idx_users_is_admin;
DROP INDEX IF EXISTS idx_users_is_master_admin;

-- Remove columns
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;
ALTER TABLE users DROP COLUMN IF EXISTS is_master_admin;
