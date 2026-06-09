-- Activity log for audit trail
-- Records all significant actions within the application

CREATE TABLE activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      text NOT NULL,
  grant_id    uuid REFERENCES grants(id) ON DELETE SET NULL,
  expense_id  uuid REFERENCES expenses(id) ON DELETE SET NULL,
  actor_id    text NOT NULL,
  actor_email text NOT NULL,
  action      text NOT NULL,
  details     jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_activity_log_org_created ON activity_log(org_id, created_at DESC);
CREATE INDEX idx_activity_log_grant ON activity_log(grant_id, created_at DESC) WHERE grant_id IS NOT NULL;

-- RLS policies
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org activity"
  ON activity_log FOR SELECT
  USING (org_id = requesting_org_id());

CREATE POLICY "Users can insert their org activity"
  ON activity_log FOR INSERT
  WITH CHECK (org_id = requesting_org_id());
