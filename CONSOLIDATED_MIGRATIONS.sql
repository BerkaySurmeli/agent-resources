-- Consolidated Database Migrations for Agent Resources
-- Run this in Railway dashboard SQL console or psql
-- All migrations are idempotent (IF NOT EXISTS / IF EXISTS)

-- ============================================
-- Migration 016: Fix transactions schema
-- ============================================
-- Remove unique constraint on stripe_payment_intent_id (breaks multi-item cart)
-- Make buyer_id/seller_id nullable for account deletion anonymization
-- Add composite unique index on (stripe_payment_intent_id, product_id)

ALTER TABLE transactions
    ALTER COLUMN buyer_id DROP NOT NULL,
    ALTER COLUMN seller_id DROP NOT NULL;

ALTER TABLE transactions
    DROP CONSTRAINT IF EXISTS transactions_stripe_payment_intent_id_key;

DROP INDEX IF EXISTS transactions_stripe_payment_intent_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_intent_product
    ON transactions (stripe_payment_intent_id, product_id);

-- ============================================
-- Migration 017: Add listing developer code
-- ============================================
-- Move developer incentive tracking from users to listings

ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS developer_code VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS bonus_paid BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_listings_developer_code ON listings(developer_code);

-- Clean up old user-level field
ALTER TABLE users DROP COLUMN IF EXISTS developer_code_used;

-- ============================================
-- Migration 018: Add developer profile fields
-- ============================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_slug VARCHAR(60) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS website VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS twitter VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS github VARCHAR(100) DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_profile_slug ON users(profile_slug)
    WHERE profile_slug IS NOT NULL;

-- ============================================
-- Migration 019: Add product view count
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- Migration 020: Add collections
-- ============================================

CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(140) UNIQUE NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_owner ON collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);

CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    note VARCHAR(280),
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);

-- ============================================
-- Migration 021: Add product quality score
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS quality_score INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- Migration 022: Add subscriptions
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_free_until TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- ============================================
-- Migration 023: Add waitlist invite fields
-- ============================================

ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_waitlist_invite_code ON waitlist (invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_invited_at ON waitlist (invited_at) WHERE invited_at IS NULL;

-- ============================================
-- Migration 024: Add password reset
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users (password_reset_token) WHERE password_reset_token IS NOT NULL;

-- ============================================
-- Verify waitlist data is intact
-- ============================================
SELECT COUNT(*) as waitlist_count FROM waitlist;
SELECT COUNT(*) as users_count FROM users;
SELECT COUNT(*) as listings_count FROM listings;
