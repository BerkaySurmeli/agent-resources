-- Change virustotal_report column from TEXT to JSONB
ALTER TABLE listings ALTER COLUMN virustotal_report TYPE JSONB USING virustotal_report::JSONB;
