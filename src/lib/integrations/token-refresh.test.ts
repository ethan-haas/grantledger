import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/crypto/tokens", () => ({
  decryptToken: vi.fn(),
  encryptToken: vi.fn((v: string) => `encrypted_${v}`),
}));

vi.mock("./quickbooks/auth", () => ({
  refreshQBOToken: vi.fn(),
}));

vi.mock("./xero/auth", () => ({
  refreshXeroToken: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

describe("refreshTokenWithLock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns cached token when still valid (no refresh)", async () => {
    const futureExpiry = new Date(Date.now() + 60_000).toISOString();

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "conn_1",
                    status: "connected",
                    token_expires_at: futureExpiry,
                    access_token_encrypted: "enc_access",
                    refresh_token_encrypted: "enc_refresh",
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                })
              ),
            })),
          })),
        })),
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockImplementation((val: string) => {
      if (val === "enc_access") return "plain_access";
      if (val === "enc_refresh") return "plain_refresh";
      return val;
    });

    const { refreshTokenWithLock } = await import("./token-refresh");
    const result = await refreshTokenWithLock("conn_1", "quickbooks", "org_123");

    expect(result.accessToken).toBe("plain_access");
    expect(result.refreshToken).toBe("plain_refresh");

    // Should NOT have called the actual refresh function
    const { refreshQBOToken } = await import("./quickbooks/auth");
    expect(refreshQBOToken).not.toHaveBeenCalled();
  });

  it("throws descriptive error when token data is corrupted", async () => {
    const futureExpiry = new Date(Date.now() + 60_000).toISOString();

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "conn_1",
                    status: "connected",
                    token_expires_at: futureExpiry,
                    access_token_encrypted: "corrupted_data",
                    refresh_token_encrypted: "corrupted_data",
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                })
              ),
            })),
          })),
        })),
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockImplementation(() => {
      throw new Error("Invalid ciphertext format");
    });

    const { refreshTokenWithLock } = await import("./token-refresh");

    await expect(
      refreshTokenWithLock("conn_1", "quickbooks", "org_123")
    ).rejects.toThrow("Corrupted token data for connection conn_1. Please reconnect.");
  });

  it("throws descriptive error when token update fails in DB", async () => {
    const expiredDate = new Date(Date.now() - 60_000).toISOString();
    const oldUpdatedAt = new Date(Date.now() - 120_000).toISOString();

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "conn_1",
                    status: "connected",
                    token_expires_at: expiredDate,
                    access_token_encrypted: "enc_access",
                    refresh_token_encrypted: "enc_refresh",
                    updated_at: oldUpdatedAt,
                  },
                  error: null,
                })
              ),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({ error: { message: "DB write failed" } })
            ),
          })),
        })),
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockReturnValue("plain_refresh");

    const { refreshQBOToken } = await import("./quickbooks/auth");
    vi.mocked(refreshQBOToken).mockResolvedValue({
      access_token: "new_access",
      refresh_token: "new_refresh",
      expires_in: 3600,
    });

    const { refreshTokenWithLock } = await import("./token-refresh");

    await expect(
      refreshTokenWithLock("conn_1", "quickbooks", "org_123")
    ).rejects.toThrow("Failed to save refreshed tokens. Please reconnect.");
  });

  it("passes org_id to initial read query", async () => {
    const futureExpiry = new Date(Date.now() + 60_000).toISOString();
    const eqCalls: string[][] = [];

    const innerEq = vi.fn((col: string, val: string) => {
      eqCalls.push([col, val]);
      return {
        single: vi.fn(() =>
          Promise.resolve({
            data: {
              id: "conn_1",
              status: "connected",
              token_expires_at: futureExpiry,
              access_token_encrypted: "enc_access",
              refresh_token_encrypted: "enc_refresh",
              updated_at: new Date().toISOString(),
            },
            error: null,
          })
        ),
      };
    });

    const outerEq = vi.fn((col: string, val: string) => {
      eqCalls.push([col, val]);
      return { eq: innerEq };
    });

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq: outerEq })),
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockReturnValue("plain_token");

    const { refreshTokenWithLock } = await import("./token-refresh");
    await refreshTokenWithLock("conn_1", "quickbooks", "org_abc");

    const orgFilter = eqCalls.find(([col, val]) => col === "org_id" && val === "org_abc");
    expect(orgFilter).toBeDefined();
  });

  it("expired token triggers full refresh flow and returns new tokens", async () => {
    const expiredDate = new Date(Date.now() - 60_000).toISOString();
    const oldUpdatedAt = new Date(Date.now() - 120_000).toISOString();

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "conn_1",
                    status: "connected",
                    token_expires_at: expiredDate,
                    access_token_encrypted: "enc_access",
                    refresh_token_encrypted: "enc_refresh",
                    updated_at: oldUpdatedAt,
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
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockReturnValue("plain_refresh");

    const { refreshQBOToken } = await import("./quickbooks/auth");
    vi.mocked(refreshQBOToken).mockResolvedValue({
      access_token: "new_access_token",
      refresh_token: "new_refresh_token",
      expires_in: 3600,
    });

    const { refreshTokenWithLock } = await import("./token-refresh");
    const result = await refreshTokenWithLock("conn_1", "quickbooks", "org_123");

    expect(refreshQBOToken).toHaveBeenCalledWith("plain_refresh");
    expect(result.accessToken).toBe("new_access_token");
    expect(result.refreshToken).toBe("new_refresh_token");
  });

  it("refresh API returns error → throws with message", async () => {
    const expiredDate = new Date(Date.now() - 60_000).toISOString();
    const oldUpdatedAt = new Date(Date.now() - 120_000).toISOString();

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "conn_1",
                    status: "connected",
                    token_expires_at: expiredDate,
                    access_token_encrypted: "enc_access",
                    refresh_token_encrypted: "enc_refresh",
                    updated_at: oldUpdatedAt,
                  },
                  error: null,
                })
              ),
            })),
          })),
        })),
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockReturnValue("plain_refresh");

    const { refreshXeroToken } = await import("./xero/auth");
    vi.mocked(refreshXeroToken).mockRejectedValue(new Error("Invalid refresh token"));

    const { refreshTokenWithLock } = await import("./token-refresh");

    await expect(
      refreshTokenWithLock("conn_1", "xero", "org_123")
    ).rejects.toThrow("Invalid refresh token");
  });

  it("connection not found → throws 'Connection not found'", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: null })
              ),
            })),
          })),
        })),
      })),
    } as never);

    const { refreshTokenWithLock } = await import("./token-refresh");

    await expect(
      refreshTokenWithLock("conn_missing", "quickbooks", "org_123")
    ).rejects.toThrow("Connection not found: conn_missing");
  });

  it("re-read after wait still shows expired → triggers full refresh", async () => {
    const expiredDate = new Date(Date.now() - 60_000).toISOString();
    // updated_at is recent (within LOCK_TIMEOUT_MS) to trigger the wait-and-reread path
    const recentUpdatedAt = new Date(Date.now() - 5_000).toISOString();

    let selectCallCount = 0;
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => {
                selectCallCount++;
                if (selectCallCount === 1) {
                  // Initial read: expired, recently updated (another refresh in progress)
                  return Promise.resolve({
                    data: {
                      id: "conn_1",
                      status: "connected",
                      token_expires_at: expiredDate,
                      access_token_encrypted: "enc_access",
                      refresh_token_encrypted: "enc_refresh",
                      updated_at: recentUpdatedAt,
                    },
                    error: null,
                  });
                }
                // Re-read after wait: still expired
                return Promise.resolve({
                  data: {
                    access_token_encrypted: "enc_access",
                    refresh_token_encrypted: "enc_refresh",
                    token_expires_at: expiredDate,
                  },
                  error: null,
                });
              }),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockReturnValue("plain_refresh");

    const { refreshQBOToken } = await import("./quickbooks/auth");
    vi.mocked(refreshQBOToken).mockResolvedValue({
      access_token: "final_access",
      refresh_token: "final_refresh",
      expires_in: 3600,
    });

    const { refreshTokenWithLock } = await import("./token-refresh");
    const result = await refreshTokenWithLock("conn_1", "quickbooks", "org_123");

    // Should have triggered full refresh since re-read still expired
    expect(refreshQBOToken).toHaveBeenCalled();
    expect(result.accessToken).toBe("final_access");
  }, 10_000);

  it("refresh returns new token_expires_at → stored via update", async () => {
    const expiredDate = new Date(Date.now() - 60_000).toISOString();
    const oldUpdatedAt = new Date(Date.now() - 120_000).toISOString();

    const updateMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "conn_1",
                    status: "connected",
                    token_expires_at: expiredDate,
                    access_token_encrypted: "enc_access",
                    refresh_token_encrypted: "enc_refresh",
                    updated_at: oldUpdatedAt,
                  },
                  error: null,
                })
              ),
            })),
          })),
        })),
        update: updateMock,
      })),
    } as never);

    const { decryptToken, encryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockReturnValue("plain_refresh");
    vi.mocked(encryptToken).mockImplementation((v: string) => `encrypted_${v}`);

    const { refreshQBOToken } = await import("./quickbooks/auth");
    vi.mocked(refreshQBOToken).mockResolvedValue({
      access_token: "new_access",
      refresh_token: "new_refresh",
      expires_in: 7200,
    });

    const { refreshTokenWithLock } = await import("./token-refresh");
    await refreshTokenWithLock("conn_1", "quickbooks", "org_123");

    // Verify update was called with encrypted tokens and a future expiry
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        access_token_encrypted: "encrypted_new_access",
        refresh_token_encrypted: "encrypted_new_refresh",
        token_expires_at: expect.any(String),
      })
    );

    // Verify the expiry is in the future (roughly 7200 seconds from now)
    const updateArg = (updateMock.mock.calls as unknown as Array<[Record<string, unknown>]>)[0][0] as { token_expires_at: string };
    const expiryMs = new Date(updateArg.token_expires_at).getTime();
    const expectedMs = Date.now() + 7200 * 1000;
    expect(Math.abs(expiryMs - expectedMs)).toBeLessThan(5000); // within 5s tolerance
  });

  it("passes org_id to UPDATE query", async () => {
    const expiredDate = new Date(Date.now() - 60_000).toISOString();
    const oldUpdatedAt = new Date(Date.now() - 120_000).toISOString();
    const updateEqCalls: string[][] = [];

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "conn_1",
                    status: "connected",
                    token_expires_at: expiredDate,
                    access_token_encrypted: "enc_access",
                    refresh_token_encrypted: "enc_refresh",
                    updated_at: oldUpdatedAt,
                  },
                  error: null,
                })
              ),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn((col: string, val: string) => {
            updateEqCalls.push([col, val]);
            return {
              eq: vi.fn((col2: string, val2: string) => {
                updateEqCalls.push([col2, val2]);
                return Promise.resolve({ error: null });
              }),
            };
          }),
        })),
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockReturnValue("plain_refresh");

    const { refreshQBOToken } = await import("./quickbooks/auth");
    vi.mocked(refreshQBOToken).mockResolvedValue({
      access_token: "new_access",
      refresh_token: "new_refresh",
      expires_in: 3600,
    });

    const { refreshTokenWithLock } = await import("./token-refresh");
    await refreshTokenWithLock("conn_1", "quickbooks", "org_xyz");

    const orgFilter = updateEqCalls.find(([col, val]) => col === "org_id" && val === "org_xyz");
    expect(orgFilter).toBeDefined();
  });

  it("calls refreshXeroToken (not QBO) for provider 'xero'", async () => {
    const expiredDate = new Date(Date.now() - 60_000).toISOString();
    const oldUpdatedAt = new Date(Date.now() - 120_000).toISOString();

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "conn_1",
                    status: "connected",
                    token_expires_at: expiredDate,
                    access_token_encrypted: "enc_access",
                    refresh_token_encrypted: "enc_refresh",
                    updated_at: oldUpdatedAt,
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
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockReturnValue("plain_refresh");

    const { refreshXeroToken } = await import("./xero/auth");
    vi.mocked(refreshXeroToken).mockResolvedValue({
      access_token: "xero_new_access",
      refresh_token: "xero_new_refresh",
      expires_in: 1800,
    });

    const { refreshQBOToken } = await import("./quickbooks/auth");

    const { refreshTokenWithLock } = await import("./token-refresh");
    const result = await refreshTokenWithLock("conn_1", "xero", "org_123");

    expect(refreshXeroToken).toHaveBeenCalledWith("plain_refresh");
    expect(refreshQBOToken).not.toHaveBeenCalled();
    expect(result.accessToken).toBe("xero_new_access");
  });

  it("expires_in of 0 stores expiry at approximately now", async () => {
    const expiredDate = new Date(Date.now() - 60_000).toISOString();
    const oldUpdatedAt = new Date(Date.now() - 120_000).toISOString();

    const updateMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "conn_1",
                    status: "connected",
                    token_expires_at: expiredDate,
                    access_token_encrypted: "enc_access",
                    refresh_token_encrypted: "enc_refresh",
                    updated_at: oldUpdatedAt,
                  },
                  error: null,
                })
              ),
            })),
          })),
        })),
        update: updateMock,
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockReturnValue("plain_refresh");

    const { refreshQBOToken } = await import("./quickbooks/auth");
    vi.mocked(refreshQBOToken).mockResolvedValue({
      access_token: "new_access",
      refresh_token: "new_refresh",
      expires_in: 0,
    });

    const { refreshTokenWithLock } = await import("./token-refresh");
    await refreshTokenWithLock("conn_1", "quickbooks", "org_123");

    const updateArg = (updateMock.mock.calls as unknown as Array<[Record<string, unknown>]>)[0][0] as { token_expires_at: string };
    const expiryMs = new Date(updateArg.token_expires_at).getTime();
    // expires_in = 0 → expiry should be within 5 seconds of now
    expect(Math.abs(expiryMs - Date.now())).toBeLessThan(5000);
  });

  it("re-read after wait returns valid token → skips refresh", async () => {
    const expiredDate = new Date(Date.now() - 60_000).toISOString();
    const recentUpdatedAt = new Date(Date.now() - 5_000).toISOString();
    const futureExpiry = new Date(Date.now() + 60_000).toISOString();

    let selectCallCount = 0;
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => {
                selectCallCount++;
                if (selectCallCount === 1) {
                  // Initial read: expired, recently updated (another refresh in progress)
                  return Promise.resolve({
                    data: {
                      id: "conn_1",
                      status: "connected",
                      token_expires_at: expiredDate,
                      access_token_encrypted: "enc_access",
                      refresh_token_encrypted: "enc_refresh",
                      updated_at: recentUpdatedAt,
                    },
                    error: null,
                  });
                }
                // Re-read after wait: token is now valid (another request refreshed it)
                return Promise.resolve({
                  data: {
                    access_token_encrypted: "enc_new_access",
                    refresh_token_encrypted: "enc_new_refresh",
                    token_expires_at: futureExpiry,
                  },
                  error: null,
                });
              }),
            })),
          })),
        })),
      })),
    } as never);

    const { decryptToken } = await import("@/lib/crypto/tokens");
    vi.mocked(decryptToken).mockImplementation((val: string) => {
      if (val === "enc_new_access") return "plain_new_access";
      if (val === "enc_new_refresh") return "plain_new_refresh";
      return val;
    });

    const { refreshQBOToken } = await import("./quickbooks/auth");

    const { refreshTokenWithLock } = await import("./token-refresh");
    const result = await refreshTokenWithLock("conn_1", "quickbooks", "org_123");

    // Should NOT have called the actual refresh — the re-read found a valid token
    expect(refreshQBOToken).not.toHaveBeenCalled();
    expect(result.accessToken).toBe("plain_new_access");
    expect(result.refreshToken).toBe("plain_new_refresh");
  }, 10_000);
});
