-- Manual migration to add virus_scan_status and translation_status
-- This migration assumes all previous migrations are already applied

DO $$
BEGIN
    -- Add virus_scan_status column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' AND column_name = 'virus_scan_status'
    ) THEN
        ALTER TABLE listings ADD COLUMN virus_scan_status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Add translation_status column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' AND column_name = 'translation_status'
    ) THEN
        ALTER TABLE listings ADD COLUMN translation_status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- Update existing listings
UPDATE listings SET virus_scan_status = 'clean' WHERE status = 'approved' AND virus_scan_status = 'pending';
UPDATE listings SET virus_scan_status = 'scanning' WHERE status = 'scanning' AND virus_scan_status = 'pending';
UPDATE listings SET virus_scan_status = 'infected' WHERE status = 'rejected' AND virus_scan_status = 'pending';
UPDATE listings SET translation_status = 'completed' WHERE status = 'approved' AND translation_status = 'pending';
