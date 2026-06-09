import { createAdminClient } from "@/lib/supabase/admin";
import { transformQBOExpenses } from "./quickbooks/transform";
import { transformXeroExpenses } from "./xero/transform";
import { decryptToken } from "@/lib/crypto/tokens";
import { getXeroTenantId } from "./xero/auth";
import { refreshTokenWithLock } from "./token-refresh";
import { buildCategorizationPrompt } from "@/lib/openai/prompts";
import { batchCategorize } from "@/lib/openai/batch-categorize";
import { fetchWithTimeout } from "./fetch-timeout";
import { getExistingExternalIds } from "@/lib/expenses/dedup";
import { batchUpdateExpenseCategories } from "@/lib/expenses/batch-update-categories";

import { logger } from "@/lib/logger";
import type { MappedExpense } from "@/lib/types/mapped-expense";
import type { Database } from "@/lib/supabase/database.types";

type ConnectionRow = Database["public"]["Tables"]["accounting_connections"]["Row"];

/**
 * Orchestrates the full sync pipeline for an accounting connection:
 * 1. Fetch expenses from the provider (QBO or Xero)
 * 2. Deduplicate against existing expenses by external_id
 * 3. Insert new expenses into the database
 * 4. Trigger batch AI categorization on inserted expenses
 */
export async function syncConnection(
  connectionId: string,
  grantId: string,
  orgId: string
): Promise<{ synced: number; categorized: number }> {
  const supabase = createAdminClient();

  // Fetch connection details
  const { data: connection, error: connError } = await supabase
    .from("accounting_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("org_id", orgId)
    .single();

  if (connError || !connection) {
    throw new Error(`Connection not found: ${connectionId}`);
  }

  if (connection.status !== "connected") {
    throw new Error(`Connection is not active: ${connection.status}`);
  }

  // Fetch grant for org_id and OMB framework
  const { data: grant, error: grantError } = await supabase
    .from("grants")
    .select("id, org_id, omb_framework")
    .eq("id", grantId)
    .eq("org_id", orgId)
    .single();

  if (grantError || !grant) {
    throw new Error(`Grant not found: ${grantId}`);
  }

  // Step 1: Fetch expenses from the provider
  let mappedExpenses: MappedExpense[] = [];

  if (connection.provider === "quickbooks") {
    mappedExpenses = await fetchQBOExpenses(connection);
  } else if (connection.provider === "xero") {
    mappedExpenses = await fetchXeroExpenses(connection);
  } else {
    throw new Error(`Unsupported provider: ${connection.provider}`);
  }

  if (mappedExpenses.length === 0) {
    // Update last_synced_at even if nothing new
    const { error: updateError } = await supabase
      .from("accounting_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", connectionId)
      .eq("org_id", orgId);

    if (updateError) logger.error("Failed to update last_synced_at", { connectionId, error: updateError.message });

    return { synced: 0, categorized: 0 };
  }

  // Step 2: Deduplicate — check which external_ids already exist
  const externalIds = mappedExpenses
    .map((e) => e.external_id)
    .filter((id): id is string => id !== null);

  const existingIds = await getExistingExternalIds(supabase, grantId, orgId, externalIds);

  const newExpenses = mappedExpenses.filter(
    (e) => !e.external_id || !existingIds.has(e.external_id)
  );

  if (newExpenses.length === 0) {
    const { error: updateError } = await supabase
      .from("accounting_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", connectionId)
      .eq("org_id", orgId);

    if (updateError) logger.error("Failed to update last_synced_at", { connectionId, error: updateError.message });

    return { synced: 0, categorized: 0 };
  }

  // Step 3: Insert new expenses
  const source = connection.provider === "quickbooks" ? "quickbooks" : "xero";
  const expenseRows = newExpenses.map((exp) => ({
    org_id: orgId,
    grant_id: grantId,
    date: exp.date,
    vendor: exp.vendor,
    description: exp.description,
    amount: exp.amount,
    account: exp.account,
    external_id: exp.external_id,
    source,
    status: "pending_review",
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("expenses")
    .insert(expenseRows)
    .select("id, vendor, description, amount, account");

  if (insertError) {
    logger.error("Failed to insert expenses", { error: insertError.message });
    throw new Error("Failed to insert expenses. Please try again.");
  }

  // Step 4: Trigger batch AI categorization
  let categorizedCount = 0;

  if (inserted && inserted.length > 0) {
    try {
      // Load cost principles for the grant's OMB framework
      const { data: costPrinciples, error: costPrinciplesError } = await supabase
        .from("omb_cost_principles")
        .select(
          "cfr_section, title, allowability, sf424a_category, conditions, keywords"
        )
        .or(`framework.eq.both,framework.eq.${grant.omb_framework}`);

      if (costPrinciplesError) {
        logger.error("Failed to load cost principles for categorization", { error: costPrinciplesError.message });
      }

      const systemPrompt = buildCategorizationPrompt(
        costPrinciples || [],
        grant.omb_framework
      );

      const results = await batchCategorize(
        systemPrompt,
        inserted.map((e: { id: string; vendor: string; description: string; amount: number; account?: string | null }) => ({
          id: e.id,
          vendor: e.vendor,
          description: e.description,
          amount: e.amount,
          account: e.account,
        })),
        5
      );

      // Update expenses with AI results in batches of 50
      categorizedCount = await batchUpdateExpenseCategories(supabase, results, orgId);
    } catch (error) {
      // Log but don't fail the sync — expenses are already inserted
      logger.error("Categorization failed during sync", error instanceof Error ? error : undefined);
    }
  }

  // Update last_synced_at and clear any previous error
  const { error: finalUpdateError } = await supabase
    .from("accounting_connections")
    .update({
      last_synced_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", connectionId)
    .eq("org_id", orgId);

  if (finalUpdateError) logger.error("Failed to update last_synced_at after sync", { connectionId, error: finalUpdateError.message });

  return { synced: inserted.length, categorized: categorizedCount };
}

// ---------------------------------------------------------------------------
// Internal helpers — fetch raw expenses from providers
// ---------------------------------------------------------------------------

async function fetchQBOExpenses(connection: ConnectionRow): Promise<MappedExpense[]> {
  if (!connection.access_token_encrypted) {
    throw new Error("Connection missing access token");
  }
  let accessToken = decryptToken(connection.access_token_encrypted);

  // Refresh token if expired (with lock to prevent race conditions)
  const tokenExpiry = connection.token_expires_at ? new Date(connection.token_expires_at) : new Date(0);
  if (tokenExpiry <= new Date()) {
    const refreshed = await refreshTokenWithLock(connection.id, "quickbooks", connection.org_id);
    accessToken = refreshed.accessToken;
  }

  const fallback = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sinceDate = connection.last_synced_at
    ? new Date(connection.last_synced_at)
    : fallback;

  if (isNaN(sinceDate.getTime())) {
    throw new Error("Invalid last_synced_at date on connection");
  }

  const since = sinceDate.toISOString();
  const query = `SELECT * FROM Purchase WHERE MetaData.LastUpdatedTime > '${since}'`;
  const encodedQuery = encodeURIComponent(query);
  const url = `https://quickbooks.api.intuit.com/v3/company/${connection.external_tenant_id}/query?query=${encodedQuery}`;

  const response = await fetchWithTimeout(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QBO API error: ${response.status} ${errorText}`);
  }

  const ct = response.headers.get("content-type");
  if (!ct?.includes("application/json")) {
    throw new Error(`QBO API returned unexpected content-type: ${ct}`);
  }

  const data = await response.json();
  return transformQBOExpenses(data?.QueryResponse?.Purchase || []);
}

async function fetchXeroExpenses(connection: ConnectionRow): Promise<MappedExpense[]> {
  if (!connection.access_token_encrypted) {
    throw new Error("Connection missing access token");
  }
  let accessToken = decryptToken(connection.access_token_encrypted);

  // Refresh token if expired (with lock to prevent race conditions)
  const tokenExpiry = connection.token_expires_at ? new Date(connection.token_expires_at) : new Date(0);
  if (tokenExpiry <= new Date()) {
    const refreshed = await refreshTokenWithLock(connection.id, "xero", connection.org_id);
    accessToken = refreshed.accessToken;
  }

  const tenantId =
    connection.external_tenant_id || (await getXeroTenantId(accessToken));

  const xeroFallback = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const xeroSinceDate = connection.last_synced_at
    ? new Date(connection.last_synced_at)
    : xeroFallback;

  if (isNaN(xeroSinceDate.getTime())) {
    throw new Error("Invalid last_synced_at date on connection");
  }

  const since = xeroSinceDate.toUTCString();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Xero-Tenant-Id": tenantId,
    Accept: "application/json",
    "If-Modified-Since": since,
  };

  // Fetch BankTransactions (SPEND type)
  const bankRes = await fetchWithTimeout(
    `https://api.xero.com/api.xro/2.0/BankTransactions?where=Type=="SPEND"`,
    { headers }
  );

  if (!bankRes.ok) {
    throw new Error(`Xero BankTransactions error: ${bankRes.status}`);
  }

  const bankCt = bankRes.headers.get("content-type");
  if (!bankCt?.includes("application/json")) {
    throw new Error(`Xero BankTransactions returned unexpected content-type: ${bankCt}`);
  }

  const bankData = await bankRes.json();
  const bankTxns = bankData?.BankTransactions || [];

  // Fetch Invoices (ACCPAY type — bills)
  const invoiceRes = await fetchWithTimeout(
    `https://api.xero.com/api.xro/2.0/Invoices?where=Type=="ACCPAY"`,
    { headers }
  );

  if (!invoiceRes.ok) {
    throw new Error(`Xero Invoices error: ${invoiceRes.status}`);
  }

  const invoiceCt = invoiceRes.headers.get("content-type");
  if (!invoiceCt?.includes("application/json")) {
    throw new Error(`Xero Invoices returned unexpected content-type: ${invoiceCt}`);
  }

  const invoiceData = await invoiceRes.json();
  const invoices = invoiceData?.Invoices || [];

  return transformXeroExpenses([...bankTxns, ...invoices]);
}
