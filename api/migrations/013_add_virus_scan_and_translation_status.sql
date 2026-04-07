-- Add virus_scan_status and translation_status columns to listings table

-- Add virus_scan_status column
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS virus_scan_status VARCHAR(20) DEFAULT 'pending';

-- Add translation_status column  
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS translation_status VARCHAR(20) DEFAULT 'pending';

-- Update existing listings to have appropriate status
UPDATE listings SET virus_scan_status = 'clean' WHERE status = 'approved';
UPDATE listings SET virus_scan_status = 'scanning' WHERE status = 'scanning';
UPDATE listings SET virus_scan_status = 'infected' WHERE status = 'rejected';
UPDATE listings SET virus_scan_status = 'pending' WHERE status IN ('pending_payment', 'pending_scan');

-- Set translation status for existing listings
UPDATE listings SET translation_status = 'completed' WHERE status = 'approved';
UPDATE listings SET translation_status = 'pending' WHERE status != 'approved';
