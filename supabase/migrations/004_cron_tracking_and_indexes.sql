-- Cron idempotency tracking columns
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS trial_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_expired_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ;

-- Remove duplicate indexes (covered by 001's composite indexes)
-- idx_expenses_external_id from 003 is a weaker duplicate of 001's UNIQUE composite index
DROP INDEX IF EXISTS idx_expenses_external_id;
-- idx_accounting_connections_org from 003 is covered by 001's idx_accounting_connections_org_provider
DROP INDEX IF EXISTS idx_accounting_connections_org;

-- Add index for cost principles category lookups
CREATE INDEX IF NOT EXISTS idx_cost_principles_category ON omb_cost_principles(sf424a_category);
