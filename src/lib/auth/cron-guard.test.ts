import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ CRON_SECRET: "test-secret-123" }),
}));

import { verifyCronSecret } from "./cron-guard";

function makeRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader) {
    headers.set("authorization", authHeader);
  }
  return new Request("https://example.com/api/cron/test", { headers });
}

describe("verifyCronSecret", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for valid secret", () => {
    const result = verifyCronSecret(makeRequest("Bearer test-secret-123"));
    expect(result).toBeNull();
  });

  it("returns 401 for invalid secret", () => {
    const result = verifyCronSecret(makeRequest("Bearer wrong-secret"));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it("returns 401 when no authorization header", () => {
    const result = verifyCronSecret(makeRequest());
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it("rejects secret without 'Bearer ' prefix", () => {
    const result = verifyCronSecret(makeRequest("test-secret-123"));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it("rejects empty authorization header", () => {
    const result = verifyCronSecret(makeRequest(""));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it("response body contains { error: 'Unauthorized' }", async () => {
    const result = verifyCronSecret(makeRequest("Bearer wrong"));
    expect(result).not.toBeNull();
    const body = await result!.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("rejects 'Bearer  ' with double space before secret", () => {
    const result = verifyCronSecret(makeRequest("Bearer  test-secret-123"));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it("valid secret returns exactly null (not undefined)", () => {
    const result = verifyCronSecret(makeRequest("Bearer test-secret-123"));
    expect(result).toBeNull();
    expect(result === null).toBe(true);
  });
});
