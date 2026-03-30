-- Migration: Change listings.status from enum to varchar
-- This fixes the enum value issues

ALTER TABLE listings 
ALTER COLUMN status TYPE VARCHAR(50);

-- Update any existing rows that might have wrong values
UPDATE listings SET status = 'pending_payment' WHERE status = 'PENDING_PAYMENT';
UPDATE listings SET status = 'pending_scan' WHERE status = 'PENDING_SCAN';
UPDATE listings SET status = 'scanning' WHERE status = 'SCANNING';
UPDATE listings SET status = 'approved' WHERE status = 'APPROVED';
UPDATE listings SET status = 'rejected' WHERE status = 'REJECTED';
UPDATE listings SET status = 'payment_failed' WHERE status = 'PAYMENT_FAILED';
