-- Add notification preference columns to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS notify_weekly_digest BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_trial_reminders BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_budget_alerts BOOLEAN NOT NULL DEFAULT true;
