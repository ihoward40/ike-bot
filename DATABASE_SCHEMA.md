# IKE BOT Database Schema

This document describes the Supabase database schema required for the IKE BOT application.

## Tables

### users
Authentication and user management table.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### beneficiaries
Store information about trust beneficiaries.

```sql
CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  relationship VARCHAR(100) NOT NULL,
  trust_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_beneficiaries_email ON beneficiaries(email);
CREATE INDEX idx_beneficiaries_trust_id ON beneficiaries(trust_id);
```

### trust_notices
Store trust-related notices and communications.

```sql
CREATE TABLE trust_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  notice_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'expired')),
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trust_notices_status ON trust_notices(status);
CREATE INDEX idx_trust_notices_beneficiary_id ON trust_notices(beneficiary_id);
```

### disputes
Track disputes and their resolution.

```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_priority ON disputes(priority);
CREATE INDEX idx_disputes_beneficiary_id ON disputes(beneficiary_id);
```

### billing_alerts
Manage billing alerts and payment notifications.

```sql
CREATE TABLE billing_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN ('payment_due', 'overdue', 'payment_received', 'refund')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_alerts_status ON billing_alerts(status);
CREATE INDEX idx_billing_alerts_beneficiary_id ON billing_alerts(beneficiary_id);
```

### webhook_events
Store incoming webhook events from various sources.

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  source VARCHAR(100) NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_source ON webhook_events(source);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);
```

## Row Level Security (RLS)

Enable Row Level Security on all tables:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
```

### Example RLS Policies

```sql
-- Allow users to read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to view all beneficiaries
CREATE POLICY "Authenticated users can view beneficiaries" ON beneficiaries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to create beneficiaries
CREATE POLICY "Authenticated users can create beneficiaries" ON beneficiaries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## Setup Instructions

1. Create a new Supabase project at https://supabase.com
2. Navigate to the SQL Editor in your Supabase dashboard
3. Execute the SQL commands above in order
4. Configure your `.env` file with the Supabase credentials
5. Update RLS policies based on your specific access control requirements
