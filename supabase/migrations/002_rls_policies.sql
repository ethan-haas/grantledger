-- GrantLedger Row-Level Security Policies
-- All data scoped to org_id from Clerk JWT

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE omb_cost_principles ENABLE ROW LEVEL SECURITY;

-- Helper: extract org_id from Clerk JWT
-- Clerk JWT template "supabase" must include org_id claim
CREATE OR REPLACE FUNCTION requesting_org_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'org_id',
    (current_setting('request.jwt.claims', true)::json -> 'metadata' ->> 'org_id')
  );
$$ LANGUAGE sql STABLE;

-- ============================================================
-- ORGANIZATIONS: users can only see/modify their own org
-- ============================================================
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = requesting_org_id());

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = requesting_org_id());

-- Insert handled by webhook (service role), not user-facing
CREATE POLICY "org_insert_service" ON organizations
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- GRANTS: scoped to org_id
-- ============================================================
CREATE POLICY "grants_select" ON grants
  FOR SELECT USING (org_id = requesting_org_id());

CREATE POLICY "grants_insert" ON grants
  FOR INSERT WITH CHECK (org_id = requesting_org_id());

CREATE POLICY "grants_update" ON grants
  FOR UPDATE USING (org_id = requesting_org_id());

CREATE POLICY "grants_delete" ON grants
  FOR DELETE USING (org_id = requesting_org_id());

-- ============================================================
-- GRANT_BUDGETS: accessible via grant's org_id
-- ============================================================
CREATE POLICY "budgets_select" ON grant_budgets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM grants WHERE grants.id = grant_budgets.grant_id AND grants.org_id = requesting_org_id())
  );

CREATE POLICY "budgets_insert" ON grant_budgets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM grants WHERE grants.id = grant_budgets.grant_id AND grants.org_id = requesting_org_id())
  );

CREATE POLICY "budgets_update" ON grant_budgets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM grants WHERE grants.id = grant_budgets.grant_id AND grants.org_id = requesting_org_id())
  );

CREATE POLICY "budgets_delete" ON grant_budgets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM grants WHERE grants.id = grant_budgets.grant_id AND grants.org_id = requesting_org_id())
  );

-- ============================================================
-- ACCOUNTING_CONNECTIONS: scoped to org_id
-- ============================================================
CREATE POLICY "connections_select" ON accounting_connections
  FOR SELECT USING (org_id = requesting_org_id());

CREATE POLICY "connections_insert" ON accounting_connections
  FOR INSERT WITH CHECK (org_id = requesting_org_id());

CREATE POLICY "connections_update" ON accounting_connections
  FOR UPDATE USING (org_id = requesting_org_id());

CREATE POLICY "connections_delete" ON accounting_connections
  FOR DELETE USING (org_id = requesting_org_id());

-- ============================================================
-- EXPENSES: scoped to org_id
-- ============================================================
CREATE POLICY "expenses_select" ON expenses
  FOR SELECT USING (org_id = requesting_org_id());

CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT WITH CHECK (org_id = requesting_org_id());

CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE USING (org_id = requesting_org_id());

CREATE POLICY "expenses_delete" ON expenses
  FOR DELETE USING (org_id = requesting_org_id());

-- ============================================================
-- OMB_COST_PRINCIPLES: read-only for all authenticated users
-- ============================================================
CREATE POLICY "cost_principles_select" ON omb_cost_principles
  FOR SELECT USING (true);
