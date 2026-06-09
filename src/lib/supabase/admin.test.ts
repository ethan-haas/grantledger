import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

const mockGetServerEnv = vi.fn(() => ({
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key-secret",
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => mockGetServerEnv(),
}));

import { createAdminClient } from "./admin";
import { createClient } from "@supabase/supabase-js";

const mockCreateClient = vi.mocked(createClient);

describe("createAdminClient", () => {
  beforeEach(() => {
    mockCreateClient.mockClear();
    mockGetServerEnv.mockClear();
  });

  it("creates client with NEXT_PUBLIC_SUPABASE_URL", () => {
    createAdminClient();
    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      expect.anything()
    );
  });

  it("creates client with SUPABASE_SERVICE_ROLE_KEY (not anon key)", () => {
    createAdminClient();
    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.anything(),
      "service-role-key-secret"
    );
  });

  it("returns a client object", () => {
    const client = createAdminClient();
    expect(client).toBeDefined();
    expect(client).not.toBeNull();
  });

  it("calls getServerEnv to retrieve credentials", () => {
    createAdminClient();
    expect(mockGetServerEnv).toHaveBeenCalledOnce();
  });
});
