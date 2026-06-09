import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ TOKEN_ENCRYPTION_KEY: "test-secret-key-for-unit-tests-32chars!" }),
}));

import { generateOAuthState, verifyOAuthState } from "./oauth-state";

describe("OAuth State", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("generates state with 4 colon-separated parts", () => {
    const state = generateOAuthState("org_123");
    const parts = state.split(":");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe("org_123");
  });

  it("round-trips: generate then verify returns orgId", () => {
    const orgId = "org_test_456";
    const state = generateOAuthState(orgId);
    const result = verifyOAuthState(state);
    expect(result).toBe(orgId);
  });

  it("rejects tampered signature", () => {
    const state = generateOAuthState("org_123");
    const parts = state.split(":");
    parts[3] = "0".repeat(parts[3].length); // Replace signature with zeros
    const tampered = parts.join(":");
    expect(verifyOAuthState(tampered)).toBeNull();
  });

  it("rejects expired state (> 10 minutes)", () => {
    const orgId = "org_789";
    const state = generateOAuthState(orgId);

    // Fast-forward time by 11 minutes
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 11 * 60 * 1000);

    expect(verifyOAuthState(state)).toBeNull();

    vi.useRealTimers();
  });

  it("rejects malformed state (wrong number of parts)", () => {
    expect(verifyOAuthState("only:two:parts")).toBeNull();
    expect(verifyOAuthState("a:b:c:d:e")).toBeNull();
    expect(verifyOAuthState("")).toBeNull();
  });

  it("generates unique nonces for each call", () => {
    const state1 = generateOAuthState("org_123");
    const state2 = generateOAuthState("org_123");
    expect(state1).not.toBe(state2);
  });

  it("nonce part is 32-char hex string (16 bytes)", () => {
    const state = generateOAuthState("org_123");
    const parts = state.split(":");
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
  });

  it("timestamp part is a valid number", () => {
    const before = Date.now();
    const state = generateOAuthState("org_123");
    const after = Date.now();
    const parts = state.split(":");
    const ts = parseInt(parts[2], 10);
    expect(isNaN(ts)).toBe(false);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("signature part is valid hex string", () => {
    const state = generateOAuthState("org_123");
    const parts = state.split(":");
    expect(parts[3]).toMatch(/^[0-9a-f]+$/);
  });

  it("verifyOAuthState returns null for non-numeric timestamp", () => {
    const state = "org_123:aabbccdd00112233aabbccdd00112233:abc:deadbeef";
    expect(verifyOAuthState(state)).toBeNull();
  });
});
