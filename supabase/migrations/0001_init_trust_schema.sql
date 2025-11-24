-- Beneficiaries
create table if not exists public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  status text not null default 'active', -- active | pending | removed
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Credit disputes (bureaus, creditors, etc.)
create table if not exists public.credit_disputes (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid references public.beneficiaries(id) on delete set null,
  creditor_name text not null,
  bureau text, -- Experian | Equifax | TransUnion | EWS | etc.
  account_number text,
  dispute_type text, -- metro2 | fdCPA | billing_error | etc.
  status text not null default 'draft', -- draft | sent | in_review | resolved | escalated
  amount numeric(14,2),
  opened_at date,
  closed_at date,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- UCC filings
create table if not exists public.ucc_filings (
  id uuid primary key default gen_random_uuid(),
  filing_number text,
  jurisdiction text,
  debtor_name text,
  secured_party text,
  collateral_desc text,
  status text default 'draft', -- draft | filed | lapsed | amended
  filed_date date,
  lapse_date date,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enforcement packets (full remedy bundles)
create table if not exists public.enforcement_packets (
  id uuid primary key default gen_random_uuid(),
  target_entity text not null,
  packet_type text not null, -- verizon_fios | dakota_financial | chase_ews | etc.
  dispute_id uuid references public.credit_disputes(id) on delete set null,
  status text not null default 'draft', -- draft | sent | in_process | completed
  tracking_numbers jsonb default '[]'::jsonb,
  storage_link text, -- link to Trust Vault / Drive
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Billing / payment events
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  source_system text not null, -- stripe | bluevine | verizon | etc.
  external_id text,
  beneficiary_id uuid references public.beneficiaries(id) on delete set null,
  amount numeric(14,2) not null,
  currency text not null default 'USD',
  event_type text not null, -- charge | refund | dispute | fee
  status text not null default 'open', -- open | reconciled | disputed
  occurred_at timestamptz not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Agent logs (AI/automation activity)
create table if not exists public.agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null, -- IKE Bot, BlackRoot Sentinel, etc.
  action text not null,     -- created_dispute, generated_notice, etc.
  entity_table text,
  entity_id uuid,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
