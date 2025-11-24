-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  trust_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on trust_id for faster queries
CREATE INDEX IF NOT EXISTS idx_disputes_trust_id ON disputes(trust_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Create index on priority for filtering
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON disputes(priority);

-- Add trigger to update updated_at on row update
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
