-- Guest checkout support
-- is_guest: user row created by webhook, no password set yet
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE;

-- Permanent download tokens sent via email for guest purchases
CREATE TABLE IF NOT EXISTS guest_download_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(128) UNIQUE NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_guest_download_tokens_token ON guest_download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_guest_download_tokens_email ON guest_download_tokens(buyer_email);
