-- GrantLedger Initial Schema
-- 6 core tables with indexes, constraints, and auto-timestamping

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. ORGANIZATIONS
-- PK from Clerk org_id, Stripe subscription fields
-- ============================================================
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  subscription_plan TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. GRANTS
-- Award details with generated omb_framework column
-- ============================================================
CREATE TABLE grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  funding_agency TEXT NOT NULL,
  cfda_number TEXT,
  award_number TEXT,
  award_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
  omb_framework TEXT GENERATED ALWAYS AS (
    CASE WHEN award_date >= '2024-10-01' THEN 'post_oct_2024' ELSE 'pre_oct_2024' END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_period CHECK (period_end > period_start)
);

CREATE INDEX idx_grants_org_status ON grants(org_id, status);

CREATE TRIGGER grants_updated_at
  BEFORE UPDATE ON grants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. GRANT_BUDGETS
-- 10 SF-424A categories per grant
-- ============================================================
CREATE TABLE grant_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'personnel', 'fringe_benefits', 'travel', 'equipment', 'supplies',
    'contractual', 'construction', 'other', 'indirect_charges', 'total'
  )),
  budgeted_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (budgeted_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(grant_id, category)
);

CREATE TRIGGER grant_budgets_updated_at
  BEFORE UPDATE ON grant_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. ACCOUNTING_CONNECTIONS
-- OAuth tokens for QBO/Xero, encrypted at rest
-- ============================================================
CREATE TABLE accounting_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('quickbooks', 'xero', 'csv')),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  external_tenant_id TEXT,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounting_connections_org_provider ON accounting_connections(org_id, provider);

CREATE TRIGGER accounting_connections_updated_at
  BEFORE UPDATE ON accounting_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. EXPENSES
-- Transaction data with AI categorization fields
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  vendor TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  account TEXT,
  external_id TEXT,
  source TEXT NOT NULL DEFAULT 'csv' CHECK (source IN ('quickbooks', 'xero', 'csv')),
  ai_category TEXT CHECK (ai_category IS NULL OR ai_category IN (
    'personnel', 'fringe_benefits', 'travel', 'equipment', 'supplies',
    'contractual', 'construction', 'other', 'indirect_charges', 'total'
  )),
  ai_confidence TEXT CHECK (ai_confidence IS NULL OR ai_confidence IN ('high', 'medium', 'low')),
  ai_cfr_citation TEXT,
  confirmed_category TEXT CHECK (confirmed_category IS NULL OR confirmed_category IN (
    'personnel', 'fringe_benefits', 'travel', 'equipment', 'supplies',
    'contractual', 'construction', 'other', 'indirect_charges', 'total'
  )),
  confirmed_by TEXT,
  confirmed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'confirmed', 'excluded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_org_grant_date ON expenses(org_id, grant_id, date);
CREATE INDEX idx_expenses_org_status ON expenses(org_id, status);
CREATE UNIQUE INDEX idx_expenses_external_id ON expenses(org_id, external_id) WHERE external_id IS NOT NULL;

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. OMB_COST_PRINCIPLES
-- 56 items from 2 CFR 200 Subpart E (reference data)
-- ============================================================
CREATE TABLE omb_cost_principles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfr_section TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  allowability TEXT NOT NULL CHECK (allowability IN ('allowable', 'unallowable', 'conditional')),
  sf424a_category TEXT NOT NULL CHECK (sf424a_category IN (
    'personnel', 'fringe_benefits', 'travel', 'equipment', 'supplies',
    'contractual', 'construction', 'other', 'indirect_charges', 'total'
  )),
  conditions TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  framework TEXT NOT NULL DEFAULT 'both' CHECK (framework IN ('pre_oct_2024', 'post_oct_2024', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
