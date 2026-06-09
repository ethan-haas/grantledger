-- Performance indexes for common query patterns

-- Expenses: frequently queried by grant_id + status (expense listing, dashboard counts)
CREATE INDEX IF NOT EXISTS idx_expenses_grant_status ON expenses(grant_id, status);

-- Expenses: queried by org_id + grant_id (overview metrics)
CREATE INDEX IF NOT EXISTS idx_expenses_org_grant ON expenses(org_id, grant_id);

-- (idx_expenses_external_id removed — covered by 001's UNIQUE composite index)

-- Grant budgets: always fetched by grant_id
CREATE INDEX IF NOT EXISTS idx_grant_budgets_grant ON grant_budgets(grant_id);

-- Grants: listed by org_id
CREATE INDEX IF NOT EXISTS idx_grants_org ON grants(org_id);

-- (idx_accounting_connections_org removed — covered by 001's idx_accounting_connections_org_provider)
