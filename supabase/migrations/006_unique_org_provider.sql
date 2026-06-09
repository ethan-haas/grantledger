-- SC20: Replace non-unique index with UNIQUE constraint on accounting_connections(org_id, provider)
-- Enables upsert-based OAuth callback pattern to prevent race conditions

DROP INDEX IF EXISTS idx_accounting_connections_org_provider;
CREATE UNIQUE INDEX idx_accounting_connections_org_provider ON accounting_connections(org_id, provider);
