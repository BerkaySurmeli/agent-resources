-- Fix transactions table:
-- 1. Remove the unique constraint on stripe_payment_intent_id (breaks multi-item cart checkouts
--    where multiple Transaction rows share one payment_intent_id).
-- 2. Make buyer_id/seller_id nullable so delete_account can anonymize them without crashing.
-- 3. Add a composite unique index on (stripe_payment_intent_id, product_id) instead, which
--    is what the idempotency check in payments.py actually relies on.

ALTER TABLE transactions
    ALTER COLUMN buyer_id DROP NOT NULL,
    ALTER COLUMN seller_id DROP NOT NULL;

ALTER TABLE transactions
    DROP CONSTRAINT IF EXISTS transactions_stripe_payment_intent_id_key;

DROP INDEX IF EXISTS transactions_stripe_payment_intent_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_intent_product
    ON transactions (stripe_payment_intent_id, product_id);
