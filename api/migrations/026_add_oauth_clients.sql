-- Migration: 021_add_oauth_clients
-- Phase 1: OAuth 2.1 Authorization Server

BEGIN;

CREATE TABLE oauth_clients (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id            TEXT UNIQUE NOT NULL,
    client_secret_hash   TEXT NOT NULL,
    name                 TEXT NOT NULL,
    grant_types          TEXT[] DEFAULT '{"client_credentials"}',
    scopes_allowed       TEXT[] DEFAULT '{"catalog:read"}',
    spending_limit_cents INTEGER DEFAULT 0,
    spent_cents          INTEGER DEFAULT 0,
    is_active            BOOLEAN DEFAULT TRUE,
    last_used_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oauth_clients_user_id   ON oauth_clients(user_id);
CREATE INDEX idx_oauth_clients_client_id ON oauth_clients(client_id);

CREATE TABLE idempotency_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL,
    client_id       TEXT NOT NULL,
    request_hash    TEXT NOT NULL,
    response_status INTEGER NOT NULL,
    response_body   JSONB NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_idempotency_key_client
    ON idempotency_records(idempotency_key, client_id);

COMMIT;
