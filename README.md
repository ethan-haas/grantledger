# GrantLedger — Federal Grant Compliance, Automated

GrantLedger is a B2B SaaS that helps nonprofits stay compliant on federal grant spending. It
auto-categorizes expenses into **2 CFR 200** budget categories, tracks budget-to-actual per
grant, and generates audit-ready compliance reports — pulling data straight from the books via
**QuickBooks Online / Xero**.

## The problem
Nonprofits spend hours (and risk audit findings) reconciling grant spend against federal
cost-principle categories by hand. GrantLedger does the categorization and budget tracking
automatically and keeps an audit trail.

## Features
- **Accounting integration** — QuickBooks Online / Xero OAuth; expenses sync automatically.
- **AI expense categorization** — each expense is classified into its 2 CFR 200 budget category.
- **Budget-to-actual tracking** — per grant, with cap monitoring and alerts.
- **Audit-ready reporting** — compliance reports and documentation export.
- **Multi-tenant** — organizations, authentication, and subscription billing.

## Stack
Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres) · Clerk (auth) ·
Stripe (billing) · OpenAI (categorization) · Resend (email) · Sentry · Vercel.

## Status
In active development — working app with database schema/migrations and accounting-integration
flow; the AI categorization engine is being refined.

## Local setup
```bash
npm install
cp .env.local.example .env.local    # add your own keys
npm run dev
```
Database migrations live in `supabase/`. Sample input data is in `sample-csv/`.
