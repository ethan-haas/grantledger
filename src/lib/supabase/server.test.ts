import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({})),
}));

const mockGetToken = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => Promise.resolve({ getToken: mockGetToken })),
}));

const mockCreateClient = vi.mocked(createClient);

describe("createServerClient", () => {
  beforeEach(() => {
    mockGetToken.mockReset();
    mockCreateClient.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws in production when JWT template is missing", async () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error — NODE_ENV reassignment for test
    process.env.NODE_ENV = "production";
    mockGetToken.mockRejectedValue(new Error("Template not found"));

    const { createServerClient } = await import("./server");

    await expect(createServerClient()).rejects.toThrow(
      "Clerk JWT template 'supabase' is required in production"
    );

    // @ts-expect-error — restore
    process.env.NODE_ENV = originalEnv;
  });

  it("dev fallback: uses service role key when JWT template missing", async () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error — NODE_ENV reassignment for test
    process.env.NODE_ENV = "development";
    mockGetToken.mockRejectedValue(new Error("Template not found"));

    vi.resetModules();
    const { createServerClient } = await import("./server");
    await createServerClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "service-key"
    );

    // @ts-expect-error — restore
    process.env.NODE_ENV = originalEnv;
  });

  it("successful token: uses anon key with Bearer header", async () => {
    mockGetToken.mockResolvedValue("test-jwt-token");

    vi.resetModules();
    const { createServerClient } = await import("./server");
    await createServerClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "anon-key",
      {
        global: {
          headers: {
            Authorization: "Bearer test-jwt-token",
          },
        },
      }
    );
  });

  it("calls getToken with template 'supabase'", async () => {
    mockGetToken.mockResolvedValue("test-jwt-token");

    vi.resetModules();
    const { createServerClient } = await import("./server");
    await createServerClient();

    expect(mockGetToken).toHaveBeenCalledWith({ template: "supabase" });
  });

  it("dev fallback logs warning", async () => {
    const originalEnv = process.env.NODE_ENV;
    // @ts-expect-error — NODE_ENV reassignment for test
    process.env.NODE_ENV = "development";
    mockGetToken.mockRejectedValue(new Error("Template not found"));

    vi.resetModules();
    const { logger } = await import("@/lib/logger");
    const { createServerClient } = await import("./server");
    await createServerClient();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("using service role key")
    );

    // @ts-expect-error — restore
    process.env.NODE_ENV = originalEnv;
  });
});
