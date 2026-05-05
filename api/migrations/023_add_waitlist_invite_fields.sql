-- Add invite tracking fields to waitlist table
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_waitlist_invite_code ON waitlist (invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_invited_at ON waitlist (invited_at) WHERE invited_at IS NULL;
