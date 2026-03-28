# Claw-Base Project Manifest

**Project:** Agent Resources Marketplace  
**Lead Architect:** Claudia 🎯  
**Date Initiated:** 2026-03-27  
**Status:** Phase 1 - Database & API Foundation

---

## Project Overview

A full-stack marketplace for OpenClaw Personas, Skills, and MCP Servers. Built for developers who want to ship, and users who want one-click installs.

---

## Directory Structure

```
/claw-base
├── /web      # Next.js frontend (Tailwind CSS)
├── /api      # FastAPI backend (PostgreSQL)
└── /docs     # Project planning & manifests
```

---

## Agent Specialization Protocol

| Agent | Role | Tone |
|-------|------|------|
| Chen (Coder) | Next.js, FastAPI, PostgreSQL | Technical, efficient |
| Stephen (Schema) | Data integrity, MCP JSON, versioning | Precise, systematic |
| Adrian (Growth) | No-Tech UX, onboarding, marketing | Friendly, conversion-focused |

---

## Phase 1: Database & API Foundation

### Database Schema Review

**Core Tables Defined:**

| Table | Purpose | Status |
|-------|---------|--------|
| `users` | Developers & Buyers | ✅ Defined |
| `products` | Main listings | ✅ Defined |
| `mcp_details` | MCP-specific metadata | ✅ Defined |
| `transactions` | Sales & splits | ✅ Defined |
| `reviews` | Trust & social proof | ✅ Defined |

**Schema Comparison - Berkay's SQL vs. Manifest:**

| Component | Berkay's Schema | Status |
|-----------|-----------------|--------|
| `users.stripe_connect_id` | ✅ Present | Confirmed |
| `products.one_click_json` | ✅ Present (renamed from `one_click_config`) | Confirmed |
| `transactions.stripe_transfer_id` | ✅ Present | Confirmed |
| `transactions.platform_fee_cents` | ✅ Present (15% cut logic) | Confirmed |
| `reviews` table | ✅ Present | Confirmed |

**Identified Gaps (Post-Review):**

1. **Stripe Connect Integration:**
   - `users.stripe_connect_id` ✅ (exists)
   - **MISSING:** `users.stripe_account_status` (pending/verified/rejected)
   - **MISSING:** `users.stripe_charges_enabled` (boolean)
   - **MISSING:** `transactions.stripe_payment_intent_id` (for refunds/tracking)

2. **MCP Versioning:**
   - **MISSING:** `versions` table entirely (for GitHub links, updates)
   - **MISSING:** `versions.mcp_manifest` (JSONB - full manifest.json content)
   - **MISSING:** `versions.compatibility_matrix` (JSONB - OpenClaw version constraints)

3. **Additional Considerations:**
   - **MISSING:** `products.category_tags` (array/text[] for discovery)
   - **MISSING:** `products.download_count` (analytics)
   - **MISSING:** `products.icon_url` or `products.screenshots` (visual assets)

---

## Finalized Schema (Merged)

```sql
-- --- 1. USERS & DEVELOPERS ---
CREATE TABLE users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 email TEXT UNIQUE NOT NULL,
 full_name TEXT,
 is_developer BOOLEAN DEFAULT FALSE,
 stripe_connect_id TEXT,
 stripe_account_status TEXT DEFAULT 'pending', -- pending/verified/rejected
 stripe_charges_enabled BOOLEAN DEFAULT FALSE,
 reputation_score INT DEFAULT 0,
 created_at TIMESTAMPTZ DEFAULT now()
);

-- --- 2. PRODUCTS ---
CREATE TYPE product_category AS ENUM ('persona', 'skill', 'mcp_server', 'bundle');

CREATE TABLE products (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 developer_id UUID REFERENCES users(id),
 category product_category NOT NULL,
 title TEXT NOT NULL,
 slug TEXT UNIQUE NOT NULL,
 description TEXT,
 price_cents INT DEFAULT 0,
 is_verified BOOLEAN DEFAULT FALSE,
 privacy_level TEXT DEFAULT 'local',
 one_click_json JSONB,
 category_tags TEXT[],
 download_count INT DEFAULT 0,
 icon_url TEXT,
 screenshots TEXT[],
 created_at TIMESTAMPTZ DEFAULT now()
);

-- --- 3. VERSIONS (for updates/GitHub links) ---
CREATE TABLE versions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id UUID REFERENCES products(id) ON DELETE CASCADE,
 version_number TEXT NOT NULL,
 download_url TEXT,
 checksum TEXT,
 mcp_manifest JSONB,
 compatibility_matrix JSONB,
 created_at TIMESTAMPTZ DEFAULT now()
);

-- --- 4. MCP SPECIFIC METADATA ---
CREATE TABLE mcp_details (
 product_id UUID REFERENCES products(id) ON DELETE CASCADE,
 runtime TEXT,
 command TEXT,
 args TEXT[],
 env_vars_required TEXT[],
 manifest_url TEXT
);

-- --- 5. SALES & REVENUE SHARING ---
CREATE TABLE transactions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id UUID REFERENCES products(id),
 buyer_id UUID REFERENCES users(id),
 seller_id UUID REFERENCES users(id),
 total_amount_cents INT NOT NULL,
 platform_fee_cents INT NOT NULL,
 seller_amount_cents INT NOT NULL,
 stripe_payment_intent_id TEXT,
 stripe_transfer_id TEXT,
 status TEXT DEFAULT 'pending',
 created_at TIMESTAMPTZ DEFAULT now()
);

-- --- 6. REVIEWS & TRUST ---
CREATE TABLE reviews (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id UUID REFERENCES products(id),
 user_id UUID REFERENCES users(id),
 rating INT CHECK (rating >= 1 AND rating <= 5),
 comment TEXT,
 created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Task Checklist

### Phase 1: Database & API Foundation

- [ ] **DB-001:** Create PostgreSQL migration with core tables
- [ ] **DB-002:** Add Stripe Connect fields to users & transactions
- [ ] **DB-003:** Add versions table with MCP manifest support
- [ ] **DB-004:** Add analytics fields (download_count, category_tags)
- [ ] **API-001:** FastAPI boilerplate with SQLAlchemy
- [ ] **API-002:** User authentication endpoints
- [ ] **API-003:** Product CRUD endpoints
- [ ] **API-004:** Stripe Connect onboarding flow
- [ ] **WEB-001:** Next.js boilerplate with Tailwind

### Phase 2: MCP Bridge (Upload System)

- [ ] **MCP-001:** Drag-and-drop upload component
- [ ] **MCP-002:** Manifest.json parser/validator
- [ ] **MCP-003:** Version management UI

### Phase 3: Discovery & No-Tech UX

- [ ] **UX-001:** App Store-style discovery page
- [ ] **UX-002:** One-click install flow
- [ ] **UX-003:** Copy-to-clipboard config generator

### Phase 4: Payments & Split

- [ ] **PAY-001:** Stripe Connect OAuth flow
- [ ] **PAY-002:** 15% platform fee logic
- [ ] **PAY-003:** Payout automation

---

## Handoff Log

| Timestamp | From | To | Status | Notes |
|-----------|------|-----|--------|-------|
| 2026-03-27 00:42 | Claudia | Chen | PENDING | DB-001 through DB-004 ready for implementation |
| 2026-03-27 00:42 | Claudia | Stephen | REVIEWED | Schema gaps identified, versions table added |

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-27 | one_click_json as JSONB | Berkay's naming confirmed - stores exact config for OpenClaw paste |
| 2026-03-27 | Separate mcp_details table | Keeps products table generic for Skills/Personas/MCPs |
| 2026-03-27 | 15% platform fee | Standard marketplace cut, competitive with industry |
| 2026-03-27 | versions table added | Required for GitHub-linked updates and MCP manifest storage |
| 2026-03-27 | stripe_account_status field | Tracks Connect onboarding state (pending → verified) |

---

## Bug Tracker

| ID | Description | Severity | Status | Assigned |
|----|-------------|----------|--------|----------|
| - | - | - | - | - |

---

_Last updated: 2026-03-27 00:42 PDT_
