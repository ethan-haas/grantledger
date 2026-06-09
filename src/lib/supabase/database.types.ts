export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OmbFramework = "pre_oct_2024" | "post_oct_2024";
export type ExpenseStatus = "pending_review" | "confirmed" | "excluded";
export type AiConfidence = "high" | "medium" | "low";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";
export type AccountingProvider = "quickbooks" | "xero" | "csv";

export type GrantStatus = "active" | "closed" | "draft";
export type ConnectionStatus = "connected" | "disconnected" | "error";

export type ActivityAction =
  | "grant_created"
  | "grant_updated"
  | "grant_deleted"
  | "expense_confirmed"
  | "expense_excluded"
  | "expense_deleted"
  | "expenses_imported"
  | "bulk_confirmed"
  | "report_generated"
  | "member_invited"
  | "member_role_changed"
  | "member_removed";

export type Sf424aCategory =
  | "personnel"
  | "fringe_benefits"
  | "travel"
  | "equipment"
  | "supplies"
  | "contractual"
  | "construction"
  | "other"
  | "indirect_charges"
  | "total";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: SubscriptionStatus;
          subscription_plan: string | null;
          trial_ends_at: string | null;
          trial_reminder_sent_at: string | null;
          trial_expired_email_sent_at: string | null;
          last_digest_sent_at: string | null;
          notify_weekly_digest: boolean;
          notify_trial_reminders: boolean;
          notify_budget_alerts: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          subscription_plan?: string | null;
          trial_ends_at?: string | null;
          trial_reminder_sent_at?: string | null;
          trial_expired_email_sent_at?: string | null;
          last_digest_sent_at?: string | null;
          notify_weekly_digest?: boolean;
          notify_trial_reminders?: boolean;
          notify_budget_alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: SubscriptionStatus;
          subscription_plan?: string | null;
          trial_ends_at?: string | null;
          trial_reminder_sent_at?: string | null;
          trial_expired_email_sent_at?: string | null;
          last_digest_sent_at?: string | null;
          notify_weekly_digest?: boolean;
          notify_trial_reminders?: boolean;
          notify_budget_alerts?: boolean;
          updated_at?: string;
        };
      };
      grants: {
        Row: {
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
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          funding_agency: string;
          cfda_number?: string | null;
          award_number?: string | null;
          award_date: string;
          period_start: string;
          period_end: string;
          total_amount: number;
          status?: GrantStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          funding_agency?: string;
          cfda_number?: string | null;
          award_number?: string | null;
          award_date?: string;
          period_start?: string;
          period_end?: string;
          total_amount?: number;
          status?: GrantStatus;
          updated_at?: string;
        };
      };
      grant_budgets: {
        Row: {
          id: string;
          grant_id: string;
          category: Sf424aCategory;
          budgeted_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          grant_id: string;
          category: Sf424aCategory;
          budgeted_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          budgeted_amount?: number;
          updated_at?: string;
        };
      };
      accounting_connections: {
        Row: {
          id: string;
          org_id: string;
          provider: AccountingProvider;
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          external_tenant_id: string | null;
          status: ConnectionStatus;
          last_synced_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          provider: AccountingProvider;
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          external_tenant_id?: string | null;
          status?: ConnectionStatus;
          last_synced_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          external_tenant_id?: string | null;
          status?: ConnectionStatus;
          last_synced_at?: string | null;
          error_message?: string | null;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          org_id: string;
          grant_id: string;
          date: string;
          vendor: string;
          description: string;
          amount: number;
          account: string | null;
          external_id: string | null;
          source: AccountingProvider;
          ai_category: Sf424aCategory | null;
          ai_confidence: AiConfidence | null;
          ai_cfr_citation: string | null;
          confirmed_category: Sf424aCategory | null;
          confirmed_by: string | null;
          confirmed_at: string | null;
          status: ExpenseStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          grant_id: string;
          date: string;
          vendor: string;
          description: string;
          amount: number;
          account?: string | null;
          external_id?: string | null;
          source: AccountingProvider;
          ai_category?: Sf424aCategory | null;
          ai_confidence?: AiConfidence | null;
          ai_cfr_citation?: string | null;
          confirmed_category?: Sf424aCategory | null;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          status?: ExpenseStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          ai_category?: Sf424aCategory | null;
          ai_confidence?: AiConfidence | null;
          ai_cfr_citation?: string | null;
          confirmed_category?: Sf424aCategory | null;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          status?: ExpenseStatus;
          updated_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          org_id: string;
          grant_id: string | null;
          expense_id: string | null;
          actor_id: string;
          actor_email: string;
          action: ActivityAction;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          grant_id?: string | null;
          expense_id?: string | null;
          actor_id: string;
          actor_email: string;
          action: ActivityAction;
          details?: Json;
          created_at?: string;
        };
        Update: {
          details?: Json;
        };
      };
      omb_cost_principles: {
        Row: {
          id: string;
          cfr_section: string;
          title: string;
          allowability: string;
          sf424a_category: Sf424aCategory;
          conditions: string | null;
          keywords: string[];
          framework: OmbFramework | "both";
          created_at: string;
        };
        Insert: {
          id?: string;
          cfr_section: string;
          title: string;
          allowability: string;
          sf424a_category: Sf424aCategory;
          conditions?: string | null;
          keywords?: string[];
          framework?: OmbFramework | "both";
          created_at?: string;
        };
        Update: {
          cfr_section?: string;
          title?: string;
          allowability?: string;
          sf424a_category?: Sf424aCategory;
          conditions?: string | null;
          keywords?: string[];
          framework?: OmbFramework | "both";
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      requesting_org_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
