-- Migration: 002_add_waitlist
-- Created: 2026-03-28

BEGIN;

CREATE TABLE waitlist (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 email TEXT UNIQUE NOT NULL,
 source TEXT DEFAULT 'website',
 created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created ON waitlist(created_at);

COMMIT;
