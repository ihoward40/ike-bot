-- Add description column to enforcement_packets table
ALTER TABLE enforcement_packets
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN enforcement_packets.description IS 'Brief description of the enforcement packet purpose and details';
