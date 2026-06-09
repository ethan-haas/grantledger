import type {
  OmbFramework,
  Sf424aCategory,
  ExpenseStatus,
  AiConfidence,
  SubscriptionStatus,
  GrantStatus,
} from "@/lib/supabase/database.types";

interface Grant {
  id: string;
  org_id: string;
  name: string;
  funding_agency: string;
  cfda_number: string | null;
  award_number: string | null;
  award_date: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  omb_framework: OmbFramework;
  status: GrantStatus;
  created_at: string;
  updated_at: string;
}

interface Expense {
  id: string;
  org_id: string;
  grant_id: string;
  date: string;
  vendor: string;
  description: string;
  amount: number;
  account: string | null;
  source: string;
  external_id: string | null;
  ai_category: Sf424aCategory | null;
  ai_confidence: AiConfidence | null;
  ai_cfr_citation: string | null;
  confirmed_category: Sf424aCategory | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  status: ExpenseStatus;
  created_at: string;
}

interface Budget {
  id: string;
  grant_id: string;
  category: Sf424aCategory;
  budgeted_amount: number;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  plan: string;
  trial_ends_at: string | null;
  notify_weekly_digest: boolean;
  notify_trial_reminders: boolean;
  notify_budget_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export function createGrant(overrides?: Partial<Grant>): Grant {
  return {
    id: "grant_001",
    org_id: "org_123",
    name: "HUD Community Development",
    funding_agency: "Dept. of Housing & Urban Development",
    cfda_number: "14.218",
    award_number: "B-24-MC-01-0001",
    award_date: "2024-06-15",
    period_start: "2024-07-01",
    period_end: "2025-06-30",
    total_amount: 500000,
    omb_framework: "pre_oct_2024",
    status: "active",
    created_at: "2024-06-15T00:00:00Z",
    updated_at: "2024-06-15T00:00:00Z",
    ...overrides,
  };
}

export function createExpense(overrides?: Partial<Expense>): Expense {
  return {
    id: "exp_001",
    org_id: "org_123",
    grant_id: "grant_001",
    date: "2024-08-15",
    vendor: "Office Depot",
    description: "Office supplies for grant activities",
    amount: 245.99,
    account: null,
    source: "csv",
    external_id: null,
    ai_category: "supplies",
    ai_confidence: "high",
    ai_cfr_citation: "2 CFR 200.94",
    confirmed_category: null,
    confirmed_by: null,
    confirmed_at: null,
    status: "pending_review",
    created_at: "2024-08-15T00:00:00Z",
    ...overrides,
  };
}

export function createBudget(overrides?: Partial<Budget>): Budget {
  return {
    id: "budget_001",
    grant_id: "grant_001",
    category: "personnel",
    budgeted_amount: 100000,
    created_at: "2024-06-15T00:00:00Z",
    ...overrides,
  };
}

export function createOrganization(overrides?: Partial<Organization>): Organization {
  return {
    id: "org_123",
    name: "Test Nonprofit",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: "trialing",
    plan: "trial",
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    notify_weekly_digest: true,
    notify_trial_reminders: true,
    notify_budget_alerts: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}
