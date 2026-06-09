"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorCard } from "@/components/ui/error-card";
import { Alert } from "@/components/ui/alert";
import { ProgressiveSkeleton } from "@/components/ui/progressive-skeleton";
import { Select } from "@/components/ui/select";

interface Connection {
  id: string;
  provider: "quickbooks" | "xero" | "csv";
  status: "connected" | "disconnected" | "error";
  last_synced_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface Grant {
  id: string;
  name: string;
}

const providerConfig = {
  quickbooks: {
    name: "QuickBooks Online",
    description: "Import expenses automatically via QuickBooks Change Data Capture API.",
    authorizeUrl: "/api/connections/quickbooks/authorize",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
        <rect width="24" height="24" rx="4" fill="#2CA01C" />
        <path
          d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm-1.5 12.5c-2.49 0-4.5-2.01-4.5-4.5S8.01 7.5 10.5 7.5c.55 0 1 .45 1 1s-.45 1-1 1c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5c0-.55.45-1 1-1s1 .45 1 1c0 2.49-2.01 4.5-4.5 4.5zm5 0c-.55 0-1-.45-1-1s.45-1 1-1c1.38 0 2.5-1.12 2.5-2.5S16.88 9.5 15.5 9.5 13 10.62 13 12c0 .55-.45 1-1 1s-1-.45-1-1c0-2.49 2.01-4.5 4.5-4.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"
          fill="white"
        />
      </svg>
    ),
  },
  xero: {
    name: "Xero",
    description: "Import expenses from Xero BankTransactions and Invoices.",
    authorizeUrl: "/api/connections/xero/authorize",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
        <rect width="24" height="24" rx="4" fill="#13B5EA" />
        <path
          d="M7.5 8.5l4.5 4.5-4.5 4.5M12 13l4.5-4.5M12 13l4.5 4.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
} as const;

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [selectedGrant, setSelectedGrant] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<string | null>(null);

  const fetchConnections = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/connections", { signal });
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) throw new Error("Unexpected response format");
        const data = await res.json();
        setConnections(data);
        setFetchError(null);
      } else {
        setFetchError("Failed to load connections");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setFetchError("Failed to load connections");
    }
  }, []);

  const fetchGrants = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/grants", { signal });
      if (res.ok) {
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) throw new Error("Unexpected response format");
        const data = await res.json();
        const grantList = data.grants || data;
        setGrants(grantList);
        setFetchError(null);
        if (grantList.length > 0 && !selectedGrant) {
          setSelectedGrant(grantList[0].id);
        }
      } else {
        setFetchError("Failed to load grants");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setFetchError("Failed to load grants");
    }
  }, [selectedGrant]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetchConnections(controller.signal),
      fetchGrants(controller.signal),
    ]).finally(() => setLoading(false));
    return () => controller.abort();
  }, [fetchConnections, fetchGrants]);

  // Check URL params for OAuth callback results
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success) {
      setMessage({
        type: "success",
        text: `${success === "quickbooks" ? "QuickBooks" : "Xero"} connected successfully!`,
      });
      fetchConnections();
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error) {
      const errorMessages: Record<string, string> = {
        qbo_auth_failed: "QuickBooks authorization was denied or failed.",
        xero_auth_failed: "Xero authorization was denied or failed.",
        qbo_token_exchange: "Failed to complete QuickBooks connection. Please try again.",
        xero_token_exchange: "Failed to complete Xero connection. Please try again.",
        missing_params: "OAuth callback was missing required parameters.",
      };
      setMessage({
        type: "error",
        text: errorMessages[error] || "Connection failed. Please try again.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchConnections]);

  async function handleSync(connectionId: string) {
    if (!selectedGrant) {
      setMessage({ type: "error", text: "Please select a grant first." });
      return;
    }

    setSyncing(connectionId);
    setMessage(null);

    try {
      const res = await fetch(`/api/connections/${connectionId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant_id: selectedGrant }),
      });

      if (!res.ok) {
        let error = "Sync failed.";
        try { const data = await res.json(); error = data.error || error; } catch {}
        setMessage({ type: "error", text: error });
        return;
      }

      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) throw new Error("Unexpected response format");
      const data = await res.json();
      setMessage({
        type: "success",
        text: `Sync complete! ${data.synced} expense${data.synced !== 1 ? "s" : ""} imported, ${data.categorized} categorized.`,
      });
      fetchConnections();
    } catch {
      setMessage({ type: "error", text: "Failed to connect to the server." });
    } finally {
      setSyncing(null);
    }
  }

  async function handleDisconnect(connectionId: string) {
    setDisconnecting(connectionId);
    setMessage(null);

    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        let error = "Disconnect failed.";
        try { const data = await res.json(); error = data.error || error; } catch {}
        setMessage({ type: "error", text: error });
        return;
      }

      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) throw new Error("Unexpected response format");
      const data = await res.json();
      setMessage({ type: "success", text: data.message });
      fetchConnections();
    } catch {
      setMessage({ type: "error", text: "Failed to connect to the server." });
    } finally {
      setDisconnecting(null);
    }
  }

  function getConnection(provider: string): Connection | undefined {
    return connections.find(
      (c) => c.provider === provider && c.status !== "disconnected"
    );
  }

  function formatLastSynced(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Connections</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your accounting integrations.</p>
        </div>
        <ProgressiveSkeleton shape="grant-card" count={2} className="space-y-4" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Connections</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Connect your accounting software to automatically import expenses.
        </p>
      </div>

      {/* Fetch error */}
      {fetchError && (
        <ErrorCard message={fetchError} onRetry={() => { fetchConnections(); fetchGrants(); }} />
      )}

      {/* Status message */}
      {message && (
        <Alert variant={message.type === "success" ? "success" : "danger"} dismissible>
          {message.text}
        </Alert>
      )}

      {/* Grant selector for sync */}
      {grants.length > 0 && (
        <Card>
          <CardTitle>Sync Target</CardTitle>
          <CardDescription>
            Select which grant to import expenses into when syncing.
          </CardDescription>
          <div className="mt-3">
            <Select
              id="sync-grant"
              aria-label="Select grant for sync"
              options={grants.map((g) => ({ value: g.id, label: g.name }))}
              value={selectedGrant}
              onChange={(e) => setSelectedGrant(e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* Provider cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(["quickbooks", "xero"] as const).map((provider) => {
          const config = providerConfig[provider];
          const connection = getConnection(provider);
          const isConnected = connection?.status === "connected";
          const hasError = connection?.status === "error";

          return (
            <Card key={provider}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-1.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle>{config.name}</CardTitle>
                    {isConnected && (
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
                        </span>
                        <Badge variant="success">Connected</Badge>
                      </div>
                    )}
                    {hasError && (
                      <Badge variant="danger">Error</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {config.description}
                  </CardDescription>

                  {/* Error message */}
                  {hasError && connection?.error_message && (
                    <p className="mt-2 text-xs text-danger-600 dark:text-danger-400">
                      {connection.error_message}
                    </p>
                  )}

                  {/* Connected state: show last synced + actions */}
                  {isConnected && connection && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Last synced: {formatLastSynced(connection.last_synced_at)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSync(connection.id)}
                          loading={syncing === connection.id}
                          disabled={syncing !== null || !selectedGrant}
                        >
                          Sync Now
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDisconnectTarget(connection.id)}
                          loading={disconnecting === connection.id}
                          disabled={disconnecting !== null}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Error state: reconnect prompt */}
                  {hasError && (
                    <div className="mt-4">
                      <a href={config.authorizeUrl}>
                        <Button size="sm" variant="secondary">
                          Reconnect {config.name}
                        </Button>
                      </a>
                    </div>
                  )}

                  {/* Not connected: connect button */}
                  {!isConnected && !hasError && (
                    <div className="mt-4">
                      <a href={config.authorizeUrl}>
                        <Button size="sm">
                          Connect {config.name}
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* CSV note */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
              <rect width="24" height="24" rx="4" fill="#64748B" />
              <path
                d="M8 7h8M8 11h8M8 15h5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <CardTitle>CSV Import</CardTitle>
            <CardDescription>
              No connection needed. Upload CSV files directly when importing
              expenses into a grant.
            </CardDescription>
            <div className="mt-4">
              <Link href="/dashboard/grants">
                <Button size="sm" variant="secondary">
                  Browse grants
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={!!disconnectTarget}
        title="Disconnect Integration"
        message="This will remove the connection and stop syncing. You can reconnect later."
        confirmLabel="Disconnect"
        variant="danger"
        loading={disconnecting !== null}
        onConfirm={() => {
          if (disconnectTarget) handleDisconnect(disconnectTarget);
          setDisconnectTarget(null);
        }}
        onCancel={() => setDisconnectTarget(null)}
      />
    </div>
  );
}
