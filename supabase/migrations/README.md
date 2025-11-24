# Database Migrations

This directory contains SQL migration files for setting up the Trust Navigator database schema in Supabase.

## Tables

### 1. Beneficiaries (`beneficiaries`)
Stores information about trust beneficiaries.

**Columns:**
- `id` (UUID, Primary Key)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, NOT NULL)
- `phone` (TEXT)
- `relationship` (TEXT, NOT NULL)
- `trust_id` (TEXT, NOT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 2. Disputes (`disputes`)
Tracks disputes and issues related to trusts.

**Columns:**
- `id` (UUID, Primary Key)
- `title` (TEXT, NOT NULL)
- `description` (TEXT, NOT NULL)
- `status` (TEXT, NOT NULL) - Values: 'open', 'in_progress', 'resolved', 'closed'
- `priority` (TEXT, NOT NULL) - Values: 'low', 'medium', 'high', 'critical'
- `trust_id` (TEXT, NOT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 3. Billing Alerts (`billing_alerts`)
Manages billing alerts and payment notifications.

**Columns:**
- `id` (UUID, Primary Key)
- `amount` (DECIMAL(10, 2), NOT NULL)
- `due_date` (DATE, NOT NULL)
- `description` (TEXT, NOT NULL)
- `status` (TEXT, NOT NULL) - Values: 'pending', 'paid', 'overdue', 'cancelled'
- `trust_id` (TEXT, NOT NULL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Running Migrations

### Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase (if not already done):
   ```bash
   supabase init
   ```

3. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

### Manual Setup

Alternatively, you can run these SQL files manually in the Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the content of each migration file in order (001, 002, 003)
4. Execute each migration

## Notes

- All tables include automatic `created_at` and `updated_at` timestamps
- The `updated_at` field is automatically updated via database triggers
- Indexes are created for common query patterns (trust_id, status, etc.)
- UUIDs are automatically generated for primary keys
