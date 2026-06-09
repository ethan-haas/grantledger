import { z } from "zod";

const serverSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // Clerk
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_WEBHOOK_SECRET: z.string().min(1, "CLERK_WEBHOOK_SECRET is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required"),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),

  // Resend
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  RESEND_FROM_EMAIL: z.string().email().optional().default("noreply@grantledger.com"),
  RESEND_AUDIENCE_ID: z.string().optional().default(""),

  // Contact
  CONTACT_EMAIL: z.string().email().optional().default("support@grantledger.com"),

  // QuickBooks
  QBO_CLIENT_ID: z.string().optional().default(""),
  QBO_CLIENT_SECRET: z.string().optional().default(""),

  // Xero
  XERO_CLIENT_ID: z.string().optional().default(""),
  XERO_CLIENT_SECRET: z.string().optional().default(""),

  // Encryption
  TOKEN_ENCRYPTION_KEY: z.string().length(64, "TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters").regex(/^[0-9a-fA-F]+$/, "TOKEN_ENCRYPTION_KEY must be a hex string"),

  // Cron
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required"),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
}).refine(
  (data) => (data.QBO_CLIENT_ID === "") === (data.QBO_CLIENT_SECRET === ""),
  { message: "QBO_CLIENT_ID and QBO_CLIENT_SECRET must both be set or both be empty", path: ["QBO_CLIENT_SECRET"] }
).refine(
  (data) => (data.XERO_CLIENT_ID === "") === (data.XERO_CLIENT_SECRET === ""),
  { message: "XERO_CLIENT_ID and XERO_CLIENT_SECRET must both be set or both be empty", path: ["XERO_CLIENT_SECRET"] }
);

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(""),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().default(""),
  NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID: z.string().optional().default("price_monthly"),
  NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID: z.string().optional().default("price_annual"),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

let _serverEnv: ServerEnv | null = null;
let _clientEnv: ClientEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const missing = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");
    throw new Error(`Missing or invalid environment variables:\n${missing}`);
  }

  _serverEnv = parsed.data;
  return _serverEnv;
}

export function getClientEnv(): ClientEnv {
  if (_clientEnv) return _clientEnv;

  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
    NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID,
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const missing = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");
    throw new Error(`Missing or invalid client environment variables:\n${missing}`);
  }

  _clientEnv = parsed.data;
  return _clientEnv;
}
