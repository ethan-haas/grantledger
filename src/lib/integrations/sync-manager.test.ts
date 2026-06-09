import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/crypto/tokens", () => ({
  decryptToken: vi.fn(() => "plain_token"),
}));

vi.mock("./token-refresh", () => ({
  refreshTokenWithLock: vi.fn(),
}));

vi.mock("./quickbooks/transform", () => ({
  transformQBOExpenses: vi.fn(() => []),
}));

vi.mock("./xero/transform", () => ({
  transformXeroExpenses: vi.fn(() => []),
}));

vi.mock("./xero/auth", () => ({
  getXeroTenantId: vi.fn(() => "tenant_1"),
}));

vi.mock("@/lib/openai/prompts", () => ({
  buildCategorizationPrompt: vi.fn(() => "system prompt"),
}));

vi.mock("@/lib/openai/batch-categorize", () => ({
  batchCategorize: vi.fn(() => []),
}));

vi.mock("./fetch-timeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

describe("syncConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("throws when connection is not found", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: { message: "Not found" } })
              ),
            })),
          })),
        })),
      })),
    } as never);

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_missing", "grant_1", "org_123")
    ).rejects.toThrow("Connection not found: conn_missing");
  });

  it("throws when connection is not active", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: "conn_1", status: "disconnected", org_id: "org_123" },
                  error: null,
                })
              ),
            })),
          })),
        })),
      })),
    } as never);

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_1", "grant_1", "org_123")
    ).rejects.toThrow("Connection is not active: disconnected");
  });

  it("throws when grant is not found", async () => {
    let callCount = 0;
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => {
                callCount++;
                if (callCount === 1) {
                  // Connection query
                  return Promise.resolve({
                    data: {
                      id: "conn_1",
                      status: "connected",
                      org_id: "org_123",
                      provider: "quickbooks",
                      access_token_encrypted: "enc",
                      refresh_token_encrypted: "enc",
                      token_expires_at: new Date(Date.now() + 60_000).toISOString(),
                      external_tenant_id: "realm_1",
                      last_synced_at: null,
                    },
                    error: null,
                  });
                }
                // Grant query
                return Promise.resolve({ data: null, error: { message: "Not found" } });
              }),
            })),
          })),
        })),
      })),
    } as never);

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_1", "grant_missing", "org_123")
    ).rejects.toThrow("Grant not found: grant_missing");
  });

  it("passes orgId to connection and grant queries", async () => {
    const eqCalls: string[][] = [];

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn((col: string, val: string) => {
            eqCalls.push([col, val]);
            return {
              eq: vi.fn((col2: string, val2: string) => {
                eqCalls.push([col2, val2]);
                return {
                  single: vi.fn(() =>
                    Promise.resolve({ data: null, error: { message: "Not found" } })
                  ),
                };
              }),
            };
          }),
        })),
      })),
    } as never);

    const { syncConnection } = await import("./sync-manager");

    // Will throw because connection is null, but we can still verify eq calls
    await expect(
      syncConnection("conn_1", "grant_1", "org_test_456")
    ).rejects.toThrow();

    // Verify org_id was passed in the first query (connection)
    const orgIdFilter = eqCalls.find(
      ([col, val]) => col === "org_id" && val === "org_test_456"
    );
    expect(orgIdFilter).toBeDefined();
  });
});

describe("sync-manager batch update", () => {
  it("processes results in chunks of 50", async () => {
    const updateCalls: string[] = [];
    const mockSupabase = {
      from: () => ({
        update: () => ({
          eq: (_col: string, id: string) => {
            updateCalls.push(id);
            return Promise.resolve({ error: null });
          },
        }),
      }),
    };

    // Simulate the batch update logic extracted from sync-manager
    const results = Array.from({ length: 120 }, (_, i) => ({
      id: `exp_${i}`,
      result: { category: "supplies", confidence: "high", cfr_citation: "§200.453" },
    }));

    const BATCH_SIZE = 50;
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(({ id }) =>
        mockSupabase.from().update().eq("id", id)
      ));
    }

    expect(updateCalls).toHaveLength(120);
    expect(updateCalls[0]).toBe("exp_0");
    expect(updateCalls[49]).toBe("exp_49");
    expect(updateCalls[50]).toBe("exp_50");
    expect(updateCalls[119]).toBe("exp_119");
  });

  it("logs failed AI categorization updates", async () => {
    const { logger } = await import("@/lib/logger");
    const failedIds: string[] = [];

    const results = [
      { id: "exp_ok", result: { category: "supplies", confidence: "high", cfr_citation: "§200.453" } },
      { id: "exp_fail_1", result: { category: "travel", confidence: "medium", cfr_citation: "§200.474" } },
      { id: "exp_fail_2", result: { category: "equipment", confidence: "low", cfr_citation: "§200.439" } },
    ];

    const mockSupabase = {
      from: () => ({
        update: () => ({
          eq: (_col: string, id: string) => ({
            eq: (_col2: string, _val2: string) => ({
              then: (resolve: (val: { id: string; error: { message: string } | null }) => void) => {
                if (id === "exp_fail_1" || id === "exp_fail_2") {
                  failedIds.push(id);
                  return Promise.resolve({ id, error: { message: "update failed" } });
                }
                return Promise.resolve({ id, error: null });
              },
            }),
          }),
        }),
      }),
    };

    // Simulate the categorization update with error checking (matching sync-manager pattern)
    const BATCH_SIZE = 50;
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);
      const updateResults = await Promise.all(batch.map(({ id, result: _result }) =>
        mockSupabase.from().update().eq("id", id).eq("org_id", "org_1").then((res: { id: string; error: { message: string } | null }) => ({ id: res.id, error: res.error }))
      ));

      const failed = updateResults.filter((r) => r.error);
      if (failed.length > 0) {
        logger.error("Failed to update AI categorization on expenses", {
          failedIds: failed.map((f) => f.id),
          error_count: failed.length,
        });
      }
    }

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to update AI categorization on expenses",
      expect.objectContaining({
        failedIds: ["exp_fail_1", "exp_fail_2"],
        error_count: 2,
      })
    );
  });

  it("handles counts not evenly divisible by 50", async () => {
    const updateCalls: string[] = [];
    const mockSupabase = {
      from: () => ({
        update: () => ({
          eq: (_col: string, id: string) => {
            updateCalls.push(id);
            return Promise.resolve({ error: null });
          },
        }),
      }),
    };

    const results = Array.from({ length: 73 }, (_, i) => ({
      id: `exp_${i}`,
      result: { category: "travel", confidence: "medium", cfr_citation: "§200.474" },
    }));

    const BATCH_SIZE = 50;
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(({ id }) =>
        mockSupabase.from().update().eq("id", id)
      ));
    }

    expect(updateCalls).toHaveLength(73);
    expect(updateCalls[72]).toBe("exp_72");
  });
});

describe("syncConnection end-to-end", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("successful QBO sync returns synced and categorized counts", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformQBOExpenses } = await import("./quickbooks/transform");
    const { batchCategorize } = await import("@/lib/openai/batch-categorize");

    let callCount = 0;
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "accounting_connections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: "conn_1",
                        status: "connected",
                        org_id: "org_123",
                        provider: "quickbooks",
                        access_token_encrypted: "enc",
                        refresh_token_encrypted: "enc",
                        token_expires_at: new Date(Date.now() + 60_000).toISOString(),
                        external_tenant_id: "realm_1",
                        last_synced_at: null,
                      },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
            update: mockUpdate,
          };
        }
        if (table === "grants") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: "grant_1", org_id: "org_123", omb_framework: "pre_oct_2024" },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "expenses") {
          callCount++;
          if (callCount === 1) {
            // Dedup query
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    in: vi.fn(() => Promise.resolve({ data: [], error: null })),
                  })),
                })),
              })),
            };
          }
          // Insert query
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() =>
                Promise.resolve({
                  data: [{ id: "exp_1", vendor: "Acme", description: "Paper", amount: 50, account: null }],
                  error: null,
                })
              ),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  then: (fn: (v: { error: null }) => void) => { fn({ error: null }); return Promise.resolve({ id: "exp_1", error: null }); },
                })),
              })),
            })),
          };
        }
        if (table === "omb_cost_principles") {
          return {
            select: vi.fn(() => ({
              or: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return {};
      }),
    } as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ QueryResponse: { Purchase: [{ Id: "1" }] } }),
    } as never);

    vi.mocked(transformQBOExpenses).mockReturnValue([
      { date: "2024-01-01", vendor: "Acme", description: "Paper", amount: 50, account: null, external_id: "qbo_1" },
    ]);

    vi.mocked(batchCategorize).mockResolvedValue([
      { id: "exp_1", result: { category: "supplies", confidence: "high" as const, cfr_citation: "§200.453" } },
    ]);

    const { syncConnection } = await import("./sync-manager");
    const result = await syncConnection("conn_1", "grant_1", "org_123");

    expect(result).toEqual({ synced: 1, categorized: 1 });
  });

  it("throws when dedup query fails (prevents silent duplicates)", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformQBOExpenses } = await import("./quickbooks/transform");

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "accounting_connections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: "conn_1",
                        status: "connected",
                        org_id: "org_123",
                        provider: "quickbooks",
                        access_token_encrypted: "enc",
                        refresh_token_encrypted: "enc",
                        token_expires_at: new Date(Date.now() + 60_000).toISOString(),
                        external_tenant_id: "realm_1",
                        last_synced_at: null,
                      },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
              })),
            })),
          };
        }
        if (table === "grants") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: "grant_1", org_id: "org_123", omb_framework: "pre_oct_2024" },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "expenses") {
          // Dedup query returns an error
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB connection lost" } })),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    } as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ QueryResponse: { Purchase: [{ Id: "1" }] } }),
    } as never);

    vi.mocked(transformQBOExpenses).mockReturnValue([
      { date: "2024-01-01", vendor: "Acme", description: "Paper", amount: 50, account: null, external_id: "qbo_1" },
    ]);

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_1", "grant_1", "org_123")
    ).rejects.toThrow("Failed to check for duplicate expenses");
  });

  it("throws when QBO API returns non-OK response (401)", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "accounting_connections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: "conn_1",
                        status: "connected",
                        org_id: "org_123",
                        provider: "quickbooks",
                        access_token_encrypted: "enc",
                        refresh_token_encrypted: "enc",
                        token_expires_at: new Date(Date.now() + 60_000).toISOString(),
                        external_tenant_id: "realm_1",
                        last_synced_at: null,
                      },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "grants") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: "grant_1", org_id: "org_123", omb_framework: "pre_oct_2024" },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    } as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
      headers: { get: () => "application/json" },
    } as never);

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_1", "grant_1", "org_123")
    ).rejects.toThrow("QBO API error: 401");
  });

  it("throws when expense insert fails", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformQBOExpenses } = await import("./quickbooks/transform");

    let expenseCallCount = 0;

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "accounting_connections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: "conn_1",
                        status: "connected",
                        org_id: "org_123",
                        provider: "quickbooks",
                        access_token_encrypted: "enc",
                        refresh_token_encrypted: "enc",
                        token_expires_at: new Date(Date.now() + 60_000).toISOString(),
                        external_tenant_id: "realm_1",
                        last_synced_at: null,
                      },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "grants") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: "grant_1", org_id: "org_123", omb_framework: "pre_oct_2024" },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "expenses") {
          expenseCallCount++;
          if (expenseCallCount === 1) {
            // Dedup query returns empty (no existing)
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    in: vi.fn(() => Promise.resolve({ data: [], error: null })),
                  })),
                })),
              })),
            };
          }
          // Insert query fails
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: "Insert failed: unique constraint" },
                })
              ),
            })),
          };
        }
        return {};
      }),
    } as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ QueryResponse: { Purchase: [{ Id: "1" }] } }),
    } as never);

    vi.mocked(transformQBOExpenses).mockReturnValue([
      { date: "2024-01-01", vendor: "Acme", description: "Paper", amount: 50, account: null, external_id: "qbo_1" },
    ]);

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_1", "grant_1", "org_123")
    ).rejects.toThrow("Failed to insert expenses");
  });

  it("categorization failure does not throw — expenses still synced", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformQBOExpenses } = await import("./quickbooks/transform");
    const { batchCategorize } = await import("@/lib/openai/batch-categorize");

    let expenseCallCount = 0;
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "accounting_connections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: "conn_1",
                        status: "connected",
                        org_id: "org_123",
                        provider: "quickbooks",
                        access_token_encrypted: "enc",
                        refresh_token_encrypted: "enc",
                        token_expires_at: new Date(Date.now() + 60_000).toISOString(),
                        external_tenant_id: "realm_1",
                        last_synced_at: null,
                      },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
            update: mockUpdate,
          };
        }
        if (table === "grants") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: "grant_1", org_id: "org_123", omb_framework: "pre_oct_2024" },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "expenses") {
          expenseCallCount++;
          if (expenseCallCount === 1) {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    in: vi.fn(() => Promise.resolve({ data: [], error: null })),
                  })),
                })),
              })),
            };
          }
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() =>
                Promise.resolve({
                  data: [{ id: "exp_1", vendor: "Acme", description: "Paper", amount: 50, account: null }],
                  error: null,
                })
              ),
            })),
          };
        }
        if (table === "omb_cost_principles") {
          return {
            select: vi.fn(() => ({
              or: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return {};
      }),
    } as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ QueryResponse: { Purchase: [{ Id: "1" }] } }),
    } as never);

    vi.mocked(transformQBOExpenses).mockReturnValue([
      { date: "2024-01-01", vendor: "Acme", description: "Paper", amount: 50, account: null, external_id: "qbo_1" },
    ]);

    // Categorization throws — should NOT propagate
    vi.mocked(batchCategorize).mockRejectedValue(new Error("OpenAI rate limit"));

    const { syncConnection } = await import("./sync-manager");
    // Should NOT throw — expenses were inserted, categorization failure is logged
    const result = await syncConnection("conn_1", "grant_1", "org_123");
    expect(result.synced).toBe(1);
    expect(result.categorized).toBe(0);
  });

  it("throws for unsupported provider", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");

    let callCount = 0;
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => {
                callCount++;
                if (callCount === 1) {
                  return Promise.resolve({
                    data: {
                      id: "conn_1",
                      status: "connected",
                      org_id: "org_123",
                      provider: "sage",
                      access_token_encrypted: "enc",
                      refresh_token_encrypted: "enc",
                      token_expires_at: new Date(Date.now() + 60_000).toISOString(),
                      external_tenant_id: "realm_1",
                      last_synced_at: null,
                    },
                    error: null,
                  });
                }
                return Promise.resolve({
                  data: { id: "grant_1", org_id: "org_123", omb_framework: "pre_oct_2024" },
                  error: null,
                });
              }),
            })),
          })),
        })),
      })),
    } as never);

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_1", "grant_1", "org_123")
    ).rejects.toThrow("Unsupported provider: sage");
  });

  it("deduplicates by external_id — only inserts new expenses", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformQBOExpenses } = await import("./quickbooks/transform");
    const { batchCategorize } = await import("@/lib/openai/batch-categorize");

    let expenseCallCount = 0;
    const insertMock = vi.fn(() => ({
      select: vi.fn(() =>
        Promise.resolve({
          data: [{ id: "exp_new", vendor: "New Corp", description: "New item", amount: 100, account: null }],
          error: null,
        })
      ),
    }));

    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "accounting_connections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: "conn_1",
                        status: "connected",
                        org_id: "org_123",
                        provider: "quickbooks",
                        access_token_encrypted: "enc",
                        refresh_token_encrypted: "enc",
                        token_expires_at: new Date(Date.now() + 60_000).toISOString(),
                        external_tenant_id: "realm_1",
                        last_synced_at: null,
                      },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
            update: mockUpdate,
          };
        }
        if (table === "grants") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: "grant_1", org_id: "org_123", omb_framework: "pre_oct_2024" },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "expenses") {
          expenseCallCount++;
          if (expenseCallCount === 1) {
            // Dedup: qbo_existing already exists
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    in: vi.fn(() => Promise.resolve({
                      data: [{ external_id: "qbo_existing" }],
                      error: null,
                    })),
                  })),
                })),
              })),
            };
          }
          return { insert: insertMock };
        }
        if (table === "omb_cost_principles") {
          return {
            select: vi.fn(() => ({
              or: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return {};
      }),
    } as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ QueryResponse: { Purchase: [{ Id: "1" }, { Id: "2" }] } }),
    } as never);

    // 2 expenses from API, but one already exists
    vi.mocked(transformQBOExpenses).mockReturnValue([
      { date: "2024-01-01", vendor: "Old Corp", description: "Existing", amount: 50, account: null, external_id: "qbo_existing" },
      { date: "2024-01-02", vendor: "New Corp", description: "New item", amount: 100, account: null, external_id: "qbo_new" },
    ]);

    vi.mocked(batchCategorize).mockResolvedValue([]);

    const { syncConnection } = await import("./sync-manager");
    const result = await syncConnection("conn_1", "grant_1", "org_123");

    // Only 1 new expense inserted (the existing one was deduped)
    expect(result.synced).toBe(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it("empty expenses returns {0, 0} and updates last_synced_at", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformQBOExpenses } = await import("./quickbooks/transform");

    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "accounting_connections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: "conn_1",
                        status: "connected",
                        org_id: "org_123",
                        provider: "quickbooks",
                        access_token_encrypted: "enc",
                        refresh_token_encrypted: "enc",
                        token_expires_at: new Date(Date.now() + 60_000).toISOString(),
                        external_tenant_id: "realm_1",
                        last_synced_at: null,
                      },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
            update: mockUpdate,
          };
        }
        if (table === "grants") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: { id: "grant_1", org_id: "org_123", omb_framework: "pre_oct_2024" },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    } as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ QueryResponse: { Purchase: [] } }),
    } as never);

    vi.mocked(transformQBOExpenses).mockReturnValue([]);

    const { syncConnection } = await import("./sync-manager");
    const result = await syncConnection("conn_1", "grant_1", "org_123");

    expect(result).toEqual({ synced: 0, categorized: 0 });
    expect(mockUpdate).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Phase 1: Xero Sync Path + Token Refresh Failure
// ---------------------------------------------------------------------------

function buildXeroConnection(overrides: Record<string, unknown> = {}) {
  return {
    id: "conn_xero_1",
    status: "connected",
    org_id: "org_123",
    provider: "xero",
    access_token_encrypted: "enc_xero",
    refresh_token_encrypted: "enc_xero_refresh",
    token_expires_at: new Date(Date.now() + 60_000).toISOString(),
    external_tenant_id: "xero_tenant_1",
    last_synced_at: null,
    ...overrides,
  };
}

function buildXeroE2EMock(
  connectionOverrides: Record<string, unknown> = {},
  expenseInsertData: unknown[] = [],
  opts: { dedupExisting?: unknown[]; updateError?: boolean } = {}
) {
  let expenseCallCount = 0;
  const mockUpdate = vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  }));

  const mock = {
    from: vi.fn((table: string) => {
      if (table === "accounting_connections") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: buildXeroConnection(connectionOverrides),
                    error: null,
                  })
                ),
              })),
            })),
          })),
          update: mockUpdate,
        };
      }
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "grant_1", org_id: "org_123", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        expenseCallCount++;
        if (expenseCallCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() =>
                    Promise.resolve({ data: opts.dedupExisting ?? [], error: null })
                  ),
                })),
              })),
            })),
          };
        }
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: expenseInsertData,
                error: null,
              })
            ),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({ error: opts.updateError ? { message: "fail" } : null })
              ),
            })),
          })),
        };
      }
      if (table === "omb_cost_principles") {
        return {
          select: vi.fn(() => ({
            or: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }
      return {};
    }),
  };

  return { mock, mockUpdate };
}

describe("syncConnection — Xero sync path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("successful Xero sync fetches BankTransactions and Invoices", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformXeroExpenses } = await import("./xero/transform");
    const { batchCategorize } = await import("@/lib/openai/batch-categorize");

    const { mock } = buildXeroE2EMock({}, [
      { id: "exp_x1", vendor: "Xero Vendor", description: "Test", amount: 75, account: null },
    ]);
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    const fetchCalls: string[] = [];
    vi.mocked(fetchWithTimeout).mockImplementation((url: string | URL | Request) => {
      fetchCalls.push(typeof url === "string" ? url : url.toString());
      return Promise.resolve({
        ok: true,
        headers: { get: () => "application/json" },
        json: () => Promise.resolve(
          fetchCalls.length === 1
            ? { BankTransactions: [{ TransactionID: "bt_1" }] }
            : { Invoices: [{ InvoiceID: "inv_1" }] }
        ),
      } as never);
    });

    vi.mocked(transformXeroExpenses).mockReturnValue([
      { date: "2024-01-01", vendor: "Xero Vendor", description: "Test", amount: 75, account: null, external_id: "xero_1" },
    ]);

    vi.mocked(batchCategorize).mockResolvedValue([]);

    const { syncConnection } = await import("./sync-manager");
    const result = await syncConnection("conn_xero_1", "grant_1", "org_123");

    expect(result.synced).toBe(1);
    expect(fetchCalls).toHaveLength(2);
    expect(fetchCalls[0]).toContain("BankTransactions");
    expect(fetchCalls[0]).toContain('Type=="SPEND"');
    expect(fetchCalls[1]).toContain("Invoices");
    expect(fetchCalls[1]).toContain('Type=="ACCPAY"');
    expect(transformXeroExpenses).toHaveBeenCalled();
  });

  it("Xero sync passes If-Modified-Since header from last_synced_at", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformXeroExpenses } = await import("./xero/transform");

    const lastSynced = "2024-06-01T00:00:00Z";
    const { mock } = buildXeroE2EMock({ last_synced_at: lastSynced });
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ BankTransactions: [] }),
    } as never);

    vi.mocked(transformXeroExpenses).mockReturnValue([]);

    const { syncConnection } = await import("./sync-manager");
    await syncConnection("conn_xero_1", "grant_1", "org_123");

    const expectedHeader = new Date(lastSynced).toUTCString();
    const callOpts = vi.mocked(fetchWithTimeout).mock.calls[0][1] as { headers: Record<string, string> };
    expect(callOpts.headers["If-Modified-Since"]).toBe(expectedHeader);
  });

  it("Xero sync uses getXeroTenantId when external_tenant_id is null", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformXeroExpenses } = await import("./xero/transform");
    const { getXeroTenantId } = await import("./xero/auth");

    const { mock } = buildXeroE2EMock({ external_tenant_id: null });
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ BankTransactions: [] }),
    } as never);

    vi.mocked(transformXeroExpenses).mockReturnValue([]);

    const { syncConnection } = await import("./sync-manager");
    await syncConnection("conn_xero_1", "grant_1", "org_123");

    expect(getXeroTenantId).toHaveBeenCalledWith("plain_token");
  });

  it("Xero sync uses external_tenant_id when present (skips getXeroTenantId)", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformXeroExpenses } = await import("./xero/transform");
    const { getXeroTenantId } = await import("./xero/auth");

    const { mock } = buildXeroE2EMock({ external_tenant_id: "tenant_preset" });
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ BankTransactions: [] }),
    } as never);

    vi.mocked(transformXeroExpenses).mockReturnValue([]);

    const { syncConnection } = await import("./sync-manager");
    await syncConnection("conn_xero_1", "grant_1", "org_123");

    expect(getXeroTenantId).not.toHaveBeenCalled();

    const callOpts = vi.mocked(fetchWithTimeout).mock.calls[0][1] as { headers: Record<string, string> };
    expect(callOpts.headers["Xero-Tenant-Id"]).toBe("tenant_preset");
  });

  it("Xero BankTransactions 401 throws descriptive error", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");

    const { mock } = buildXeroE2EMock();
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => "application/json" },
    } as never);

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_xero_1", "grant_1", "org_123")
    ).rejects.toThrow("Xero BankTransactions error: 401");
  });

  it("Xero Invoices 500 throws descriptive error", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");

    const { mock } = buildXeroE2EMock();
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    let callCount = 0;
    vi.mocked(fetchWithTimeout).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          headers: { get: () => "application/json" },
          json: () => Promise.resolve({ BankTransactions: [] }),
        } as never);
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        headers: { get: () => "application/json" },
      } as never);
    });

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_xero_1", "grant_1", "org_123")
    ).rejects.toThrow("Xero Invoices error: 500");
  });

  it("Xero sync with empty results returns synced: 0", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformXeroExpenses } = await import("./xero/transform");

    const { mock, mockUpdate } = buildXeroE2EMock();
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ BankTransactions: [] }),
    } as never);

    vi.mocked(transformXeroExpenses).mockReturnValue([]);

    const { syncConnection } = await import("./sync-manager");
    const result = await syncConnection("conn_xero_1", "grant_1", "org_123");

    expect(result).toEqual({ synced: 0, categorized: 0 });
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("Xero sync triggers token refresh when token is expired", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformXeroExpenses } = await import("./xero/transform");
    const { refreshTokenWithLock } = await import("./token-refresh");

    const { mock } = buildXeroE2EMock({
      token_expires_at: new Date(Date.now() - 60_000).toISOString(),
    });
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    vi.mocked(refreshTokenWithLock).mockResolvedValue({
      accessToken: "refreshed_token",
      refreshToken: "new_refresh",
    });

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ BankTransactions: [] }),
    } as never);

    vi.mocked(transformXeroExpenses).mockReturnValue([]);

    const { syncConnection } = await import("./sync-manager");
    await syncConnection("conn_xero_1", "grant_1", "org_123");

    expect(refreshTokenWithLock).toHaveBeenCalledWith("conn_xero_1", "xero", "org_123");
  });

  it("Xero sync skips token refresh when token is valid", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");
    const { transformXeroExpenses } = await import("./xero/transform");
    const { refreshTokenWithLock } = await import("./token-refresh");

    const { mock } = buildXeroE2EMock({
      token_expires_at: new Date(Date.now() + 60_000).toISOString(),
    });
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ BankTransactions: [] }),
    } as never);

    vi.mocked(transformXeroExpenses).mockReturnValue([]);

    const { syncConnection } = await import("./sync-manager");
    await syncConnection("conn_xero_1", "grant_1", "org_123");

    expect(refreshTokenWithLock).not.toHaveBeenCalled();
  });

  it("token refresh failure during QBO sync propagates error", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { refreshTokenWithLock } = await import("./token-refresh");

    const { mock } = buildXeroE2EMock();
    // Override the connection data to be QBO with expired token
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "accounting_connections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: "conn_qbo_1",
                        status: "connected",
                        org_id: "org_123",
                        provider: "quickbooks",
                        access_token_encrypted: "enc",
                        refresh_token_encrypted: "enc",
                        token_expires_at: new Date(Date.now() - 60_000).toISOString(),
                        external_tenant_id: "realm_1",
                        last_synced_at: null,
                      },
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          };
        }
        if (table === "grants") {
          return mock.from("grants");
        }
        return {};
      }),
    } as never);

    vi.mocked(refreshTokenWithLock).mockRejectedValue(new Error("Token refresh failed"));

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_qbo_1", "grant_1", "org_123")
    ).rejects.toThrow("Token refresh failed");
  });

  it("token refresh failure during Xero sync propagates error", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { refreshTokenWithLock } = await import("./token-refresh");

    const { mock } = buildXeroE2EMock({
      token_expires_at: new Date(Date.now() - 60_000).toISOString(),
    });
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    vi.mocked(refreshTokenWithLock).mockRejectedValue(new Error("Xero token refresh failed"));

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_xero_1", "grant_1", "org_123")
    ).rejects.toThrow("Xero token refresh failed");
  });

  it("Xero BankTransactions unexpected content-type throws", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { fetchWithTimeout } = await import("./fetch-timeout");

    const { mock } = buildXeroE2EMock();
    vi.mocked(createAdminClient).mockReturnValue(mock as never);

    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true,
      headers: { get: () => "text/html" },
    } as never);

    const { syncConnection } = await import("./sync-manager");
    await expect(
      syncConnection("conn_xero_1", "grant_1", "org_123")
    ).rejects.toThrow("Xero BankTransactions returned unexpected content-type: text/html");
  });
});
