-- Create billing_alerts table
CREATE TABLE IF NOT EXISTS billing_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  trust_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on trust_id for faster queries
CREATE INDEX IF NOT EXISTS idx_billing_alerts_trust_id ON billing_alerts(trust_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_billing_alerts_status ON billing_alerts(status);

-- Create index on due_date for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_billing_alerts_due_date ON billing_alerts(due_date);

-- Add trigger to update updated_at on row update
CREATE TRIGGER update_billing_alerts_updated_at
  BEFORE UPDATE ON billing_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
