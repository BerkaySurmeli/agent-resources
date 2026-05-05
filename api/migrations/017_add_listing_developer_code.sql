-- Move developer incentive tracking from users to listings.
-- A developer_code is now attached to a listing at creation time.
-- When that listing makes its first sale, the seller earns the $20 bonus.

ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS developer_code VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS bonus_paid BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_listings_developer_code ON listings(developer_code);

-- Clean up the old user-level field that held the code in the wrong place
ALTER TABLE users
    DROP COLUMN IF EXISTS developer_code_used;
