-- Migration: 001_initial_schema
-- Created: 2026-03-27
-- Author: Chen (Coder-Agent)
-- Status: DB-001 through DB-004 consolidated

BEGIN;

-- ENUMS
DO $$ BEGIN
    CREATE TYPE product_category AS ENUM ('persona', 'skill', 'mcp_server', 'bundle');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE privacy_level AS ENUM ('local', 'hybrid', 'cloud');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 email TEXT UNIQUE NOT NULL,
 stripe_connect_id TEXT UNIQUE,
 stripe_status TEXT DEFAULT 'pending',
 stripe_charges_enabled BOOLEAN DEFAULT FALSE,
 stripe_payouts_enabled BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS
CREATE TABLE products (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
 name TEXT NOT NULL,
 slug TEXT UNIQUE NOT NULL,
 description TEXT,
 category product_category NOT NULL,
 category_tags TEXT[] DEFAULT '{}',
 privacy_level privacy_level DEFAULT 'local',
 price_cents INTEGER DEFAULT 0,
 one_click_json JSONB DEFAULT '{}',
 is_active BOOLEAN DEFAULT TRUE,
 is_verified BOOLEAN DEFAULT FALSE,
 download_count INTEGER DEFAULT 0,
 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VERSIONS
CREATE TABLE versions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id UUID REFERENCES products(id) ON DELETE CASCADE,
 semver TEXT NOT NULL,
 mcp_manifest JSONB NOT NULL,
 download_url TEXT NOT NULL,
 compatibility_matrix JSONB DEFAULT '{}',
 checksum TEXT NOT NULL,
 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MCP_DETAILS (Runtime Metadata)
CREATE TABLE mcp_details (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id UUID REFERENCES products(id) ON DELETE CASCADE,
 version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
 command TEXT NOT NULL,
 args TEXT[] DEFAULT '{}',
 env_vars_required TEXT[] DEFAULT '{}',
 manifest_url TEXT,
 runtime_env TEXT NOT NULL,
 memory_limit_mb INTEGER DEFAULT 512,
 timeout_seconds INTEGER DEFAULT 30
);

-- 5. TRANSACTIONS
CREATE TABLE transactions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 buyer_id UUID REFERENCES users(id),
 seller_id UUID REFERENCES users(id),
 product_id UUID REFERENCES products(id),
 amount_cents INTEGER NOT NULL,
 platform_fee_cents INTEGER NOT NULL,
 stripe_payment_intent_id TEXT UNIQUE NOT NULL,
 stripe_transfer_id TEXT UNIQUE,
 status TEXT DEFAULT 'pending',
 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REVIEWS
CREATE TABLE reviews (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id UUID REFERENCES users(id) ON DELETE SET NULL,
 product_id UUID REFERENCES products(id) ON DELETE CASCADE,
 rating INTEGER CHECK (rating >= 1 AND rating <= 5),
 comment TEXT,
 is_verified_purchase BOOLEAN DEFAULT TRUE,
 created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
