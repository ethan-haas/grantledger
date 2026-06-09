-- ============================================================
-- GrantLedger Sample Data Seed
-- Run in Supabase SQL Editor
-- Org: org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3
-- ============================================================

-- Upsert the organization (in case auto-provision already created it)
INSERT INTO organizations (id, name, subscription_status, subscription_plan, trial_ends_at)
VALUES (
  'org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3',
  'Ethan''s Organization',
  'trialing',
  'pro',
  (NOW() + INTERVAL '14 days')::timestamptz
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subscription_status = 'trialing',
  trial_ends_at = (NOW() + INTERVAL '14 days')::timestamptz;

-- ============================================================
-- Grant 1: Community Health Initiative (post-Oct 2024 framework)
-- ============================================================
INSERT INTO grants (id, org_id, name, funding_agency, cfda_number, award_number, award_date, period_start, period_end, total_amount, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3',
  'Community Health Initiative',
  'Department of Health and Human Services',
  '93.224',
  'HHS-2025-001',
  '2025-01-15',
  '2025-02-01',
  '2026-01-31',
  500000,
  'active'
);

-- Grant 1 Budgets (SF-424A categories)
INSERT INTO grant_budgets (grant_id, category, budgeted_amount) VALUES
  ('11111111-1111-1111-1111-111111111111', 'personnel',        180000),
  ('11111111-1111-1111-1111-111111111111', 'fringe_benefits',   54000),
  ('11111111-1111-1111-1111-111111111111', 'travel',            25000),
  ('11111111-1111-1111-1111-111111111111', 'equipment',         40000),
  ('11111111-1111-1111-1111-111111111111', 'supplies',          30000),
  ('11111111-1111-1111-1111-111111111111', 'contractual',       75000),
  ('11111111-1111-1111-1111-111111111111', 'construction',          0),
  ('11111111-1111-1111-1111-111111111111', 'other',             21000),
  ('11111111-1111-1111-1111-111111111111', 'indirect_charges',  75000);

-- Grant 1 Expenses — mix of confirmed, pending, and excluded
INSERT INTO expenses (org_id, grant_id, date, vendor, description, amount, account, source, ai_category, ai_confidence, ai_cfr_citation, confirmed_category, confirmed_by, confirmed_at, status) VALUES
  -- Confirmed personnel expenses
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-02-15', 'ADP Payroll Services', 'February payroll - Program Director', 7500.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', 'personnel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-02-15', 'ADP Payroll Services', 'February payroll - Health Coordinator', 5200.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', 'personnel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-03-15', 'ADP Payroll Services', 'March payroll - Program Director', 7500.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', 'personnel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-03-15', 'ADP Payroll Services', 'March payroll - Health Coordinator', 5200.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', 'personnel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Confirmed fringe
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-02-28', 'BlueCross BlueShield', 'February health insurance premiums - staff', 3800.00, 'Benefits', 'csv', 'fringe_benefits', 'high', '2 CFR 200.431', 'fringe_benefits', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-03-31', 'BlueCross BlueShield', 'March health insurance premiums - staff', 3800.00, 'Benefits', 'csv', 'fringe_benefits', 'high', '2 CFR 200.431', 'fringe_benefits', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Confirmed travel
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-03-10', 'Delta Airlines', 'Flight to HHS regional conference - DC', 485.00, 'Travel', 'csv', 'travel', 'high', '2 CFR 200.474', 'travel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-03-10', 'Marriott Hotels', 'Hotel 3 nights - HHS conference', 750.00, 'Travel', 'csv', 'travel', 'high', '2 CFR 200.474', 'travel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-03-12', 'Enterprise Rent-A-Car', 'Rental car for site visits', 225.00, 'Travel', 'csv', 'travel', 'medium', '2 CFR 200.474', 'travel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Confirmed equipment (post-Oct 2024 = $10K threshold)
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-02-20', 'Dell Technologies', 'Laptop workstations x3 for field staff', 12500.00, 'Equipment', 'csv', 'equipment', 'high', '2 CFR 200.439', 'equipment', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Confirmed supplies
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-02-05', 'Staples', 'Office supplies - paper, toner, folders', 342.50, 'Office Supplies', 'csv', 'supplies', 'high', '2 CFR 200.453', 'supplies', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-03-01', 'Amazon Business', 'Blood pressure monitors x10 for clinics', 1250.00, 'Medical Supplies', 'csv', 'supplies', 'medium', '2 CFR 200.453', 'supplies', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Confirmed contractual
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-02-28', 'Garcia Consulting LLC', 'Community needs assessment - Phase 1', 15000.00, 'Professional Services', 'csv', 'contractual', 'high', '2 CFR 200.318', 'contractual', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-03-15', 'TechBridge Solutions', 'Patient portal development - milestone 1', 22000.00, 'Professional Services', 'csv', 'contractual', 'high', '2 CFR 200.318', 'contractual', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Confirmed indirect charges
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-02-28', 'Internal Allocation', 'February indirect costs @ 15% de minimis', 6750.00, 'Indirect', 'csv', 'indirect_charges', 'high', '2 CFR 200.414', 'indirect_charges', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Confirmed other
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-03-05', 'The Print Shop', 'Community health brochures - 5000 copies', 2100.00, 'Printing', 'csv', 'other', 'medium', '2 CFR 200.461', 'other', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- PENDING REVIEW expenses (AI categorized, awaiting human confirmation)
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-04-01', 'ADP Payroll Services', 'April payroll - Program Director', 7500.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', NULL, NULL, NULL, 'pending_review'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-04-01', 'ADP Payroll Services', 'April payroll - Health Coordinator', 5200.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', NULL, NULL, NULL, 'pending_review'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-04-05', 'Uber Business', 'Ride to community outreach event', 42.50, 'Transportation', 'csv', 'travel', 'medium', '2 CFR 200.474', NULL, NULL, NULL, 'pending_review'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-04-08', 'Zoom Video Communications', 'Annual subscription - telehealth platform', 1800.00, 'Software', 'csv', 'other', 'low', '2 CFR 200.453', NULL, NULL, NULL, 'pending_review'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-04-10', 'FedEx', 'Shipping medical supplies to field sites', 185.00, 'Shipping', 'csv', 'supplies', 'medium', '2 CFR 200.453', NULL, NULL, NULL, 'pending_review'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-04-12', 'Catering by Maria', 'Lunch for community advisory board meeting', 650.00, 'Meals', 'csv', 'other', 'low', '2 CFR 200.456', NULL, NULL, NULL, 'pending_review'),

  -- EXCLUDED expense
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '11111111-1111-1111-1111-111111111111', '2025-03-20', 'Flowers & Gifts Inc', 'Staff appreciation flowers', 125.00, 'Miscellaneous', 'csv', 'other', 'low', '2 CFR 200.421', NULL, 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'excluded');


-- ============================================================
-- Grant 2: STEM Education Outreach (pre-Oct 2024 framework)
-- ============================================================
INSERT INTO grants (id, org_id, name, funding_agency, cfda_number, award_number, award_date, period_start, period_end, total_amount, status)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3',
  'STEM Education Outreach Program',
  'National Science Foundation',
  '47.076',
  'NSF-DUE-2024-5678',
  '2024-07-01',
  '2024-08-01',
  '2025-07-31',
  250000,
  'active'
);

-- Grant 2 Budgets
INSERT INTO grant_budgets (grant_id, category, budgeted_amount) VALUES
  ('22222222-2222-2222-2222-222222222222', 'personnel',        95000),
  ('22222222-2222-2222-2222-222222222222', 'fringe_benefits',  28500),
  ('22222222-2222-2222-2222-222222222222', 'travel',           15000),
  ('22222222-2222-2222-2222-222222222222', 'equipment',        20000),
  ('22222222-2222-2222-2222-222222222222', 'supplies',         25000),
  ('22222222-2222-2222-2222-222222222222', 'contractual',      30000),
  ('22222222-2222-2222-2222-222222222222', 'construction',         0),
  ('22222222-2222-2222-2222-222222222222', 'other',            11500),
  ('22222222-2222-2222-2222-222222222222', 'indirect_charges', 25000);

-- Grant 2 Expenses
INSERT INTO expenses (org_id, grant_id, date, vendor, description, amount, account, source, ai_category, ai_confidence, ai_cfr_citation, confirmed_category, confirmed_by, confirmed_at, status) VALUES
  -- Confirmed
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-08-15', 'ADP Payroll Services', 'Aug payroll - STEM Program Manager', 6000.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', 'personnel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-09-15', 'ADP Payroll Services', 'Sep payroll - STEM Program Manager', 6000.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', 'personnel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-10-15', 'ADP Payroll Services', 'Oct payroll - STEM Program Manager', 6000.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', 'personnel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-11-15', 'ADP Payroll Services', 'Nov payroll - STEM Program Manager', 6000.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', 'personnel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-12-15', 'ADP Payroll Services', 'Dec payroll - STEM Program Manager', 6000.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', 'personnel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2025-01-15', 'ADP Payroll Services', 'Jan payroll - STEM Program Manager', 6000.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', 'personnel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Fringe
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-09-30', 'BlueCross BlueShield', 'Q3 health insurance - STEM staff', 5400.00, 'Benefits', 'csv', 'fringe_benefits', 'high', '2 CFR 200.431', 'fringe_benefits', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-12-31', 'BlueCross BlueShield', 'Q4 health insurance - STEM staff', 5400.00, 'Benefits', 'csv', 'fringe_benefits', 'high', '2 CFR 200.431', 'fringe_benefits', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Travel
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-10-05', 'Southwest Airlines', 'Flight to NSF PI meeting - Arlington VA', 380.00, 'Travel', 'csv', 'travel', 'high', '2 CFR 200.474', 'travel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-10-06', 'Hilton Hotels', 'Hotel 2 nights - NSF PI meeting', 520.00, 'Travel', 'csv', 'travel', 'high', '2 CFR 200.474', 'travel', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Equipment (pre-Oct 2024 = $5K threshold)
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-09-01', 'Apple Education', '10x iPad for STEM lab', 8500.00, 'Equipment', 'csv', 'equipment', 'high', '2 CFR 200.439', 'equipment', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Supplies
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-08-20', 'Fisher Scientific', 'Lab supplies - chemistry kits x30', 4500.00, 'Lab Supplies', 'csv', 'supplies', 'high', '2 CFR 200.453', 'supplies', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-11-10', 'Arduino Store', 'Robotics kits x20 for workshop', 3200.00, 'Lab Supplies', 'csv', 'supplies', 'high', '2 CFR 200.453', 'supplies', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Contractual
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-09-30', 'Dr. Sarah Kim', 'Curriculum development consulting - Phase 1', 8000.00, 'Professional Services', 'csv', 'contractual', 'high', '2 CFR 200.318', 'contractual', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2025-01-15', 'EvalMetrics Inc', 'Program evaluation - midpoint report', 12000.00, 'Professional Services', 'csv', 'contractual', 'high', '2 CFR 200.318', 'contractual', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Indirect
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-12-31', 'Internal Allocation', 'H2 2024 indirect costs @ 10% de minimis', 8500.00, 'Indirect', 'csv', 'indirect_charges', 'high', '2 CFR 200.414', 'indirect_charges', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Other
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2024-10-15', 'University Press', 'STEM curriculum workbooks - 200 copies', 3400.00, 'Printing', 'csv', 'other', 'medium', '2 CFR 200.461', 'other', 'user_3A0fd6wZoGXOvFkxFmev1NESfe5', NOW(), 'confirmed'),

  -- Pending review
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2025-02-15', 'ADP Payroll Services', 'Feb payroll - STEM Program Manager', 6000.00, 'Payroll', 'csv', 'personnel', 'high', '2 CFR 200.430', NULL, NULL, NULL, 'pending_review'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2025-02-20', 'MakerBot', '3D printer filament bulk order', 890.00, 'Lab Supplies', 'csv', 'supplies', 'medium', '2 CFR 200.453', NULL, NULL, NULL, 'pending_review'),
  ('org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3', '22222222-2222-2222-2222-222222222222', '2025-02-25', 'Local School District', 'Facility rental for Saturday STEM workshops', 2400.00, 'Rental', 'csv', 'other', 'low', '2 CFR 200.465', NULL, NULL, NULL, 'pending_review');

-- Verify counts
SELECT 'organizations' AS table_name, COUNT(*) AS row_count FROM organizations WHERE id = 'org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3'
UNION ALL
SELECT 'grants', COUNT(*) FROM grants WHERE org_id = 'org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3'
UNION ALL
SELECT 'grant_budgets', COUNT(*) FROM grant_budgets WHERE grant_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses WHERE org_id = 'org_3A0iJtoHuHAgfkQVCiKXEQ6cAl3'
ORDER BY table_name;
