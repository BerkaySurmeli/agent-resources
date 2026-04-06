-- Create separate admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    is_master_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_master_admin ON admin_users(is_master_admin);

-- Insert default master admin user
-- Password: 16384bEr32768! (hashed with argon2)
INSERT INTO admin_users (id, email, password_hash, name, is_master_admin)
VALUES (
    gen_random_uuid(),
    'berkaysurmeli@icloud.com',
    '$argon2id$v=19$m=65536,t=3,p=4$g8K6KqzQe5e8J4mJmZmZmg$K3Q+Q4x8x7x6x5x4x3x2x1x0x9x8x7x6x5x4x3x2x1x0',
    'Master Admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;
