import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter, rateLimitResponse } from "./rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 60_000 });
    const r1 = limiter.check("user1");
    const r2 = limiter.check("user1");

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
  });

  it("blocks at the limit", () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 60_000 });
    limiter.check("user1");
    limiter.check("user1");
    const r3 = limiter.check("user1");

    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    const r1 = limiter.check("user1");
    expect(r1.allowed).toBe(true);

    const r2 = limiter.check("user1");
    expect(r2.allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    const r3 = limiter.check("user1");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("returns correct remaining count", () => {
    const limiter = createRateLimiter({ max: 5, windowMs: 60_000 });
    expect(limiter.check("k").remaining).toBe(4);
    expect(limiter.check("k").remaining).toBe(3);
    expect(limiter.check("k").remaining).toBe(2);
    expect(limiter.check("k").remaining).toBe(1);
    expect(limiter.check("k").remaining).toBe(0);
  });

  it("prunes expired entries when map exceeds threshold", () => {
    const limiter = createRateLimiter({ max: 100, windowMs: 1_000 });

    // Fill map beyond 10K entries
    for (let i = 0; i < 10_001; i++) {
      limiter.check(`key-${i}`);
    }
    expect(limiter._map.size).toBe(10_001);

    // Advance past window so all entries expire
    vi.advanceTimersByTime(1_001);

    // Next check triggers pruning
    limiter.check("new-key");
    // All expired entries pruned, only "new-key" remains
    expect(limiter._map.size).toBe(1);
  });

  it("keeps separate state for different instances", () => {
    const limiterA = createRateLimiter({ max: 1, windowMs: 60_000 });
    const limiterB = createRateLimiter({ max: 1, windowMs: 60_000 });

    limiterA.check("user1");
    expect(limiterA.check("user1").allowed).toBe(false);
    expect(limiterB.check("user1").allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    limiter.check("user1");
    expect(limiter.check("user1").allowed).toBe(false);
    expect(limiter.check("user2").allowed).toBe(true);
  });
});

describe("rateLimitResponse", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 429 with Retry-After header", async () => {
    const resetAt = Date.now() + 30_000;
    const res = rateLimitResponse(resetAt);

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("Retry-After minimum is 1 second when resetAt is in the past", async () => {
    const res = rateLimitResponse(Date.now() - 5000);
    expect(res.headers.get("Retry-After")).toBe("1");
  });

  it("response body contains 'Too many requests' error message", async () => {
    const res = rateLimitResponse(Date.now() + 10_000);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });
});

describe("createRateLimiter edge cases", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resetAt from check is in the future", () => {
    const limiter = createRateLimiter({ max: 5, windowMs: 60_000 });
    const result = limiter.check("user1");
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("blocked response remaining stays at 0 on repeated calls", () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 60_000 });
    limiter.check("user1");
    limiter.check("user1");
    const r3 = limiter.check("user1");
    const r4 = limiter.check("user1");
    expect(r3.remaining).toBe(0);
    expect(r4.remaining).toBe(0);
  });

  it("first call after window reset gets full remaining count", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 60_000 });
    // Exhaust limit
    limiter.check("user1");
    limiter.check("user1");
    limiter.check("user1");
    expect(limiter.check("user1").allowed).toBe(false);

    // Advance past window
    vi.advanceTimersByTime(60_001);

    const result = limiter.check("user1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2); // max - 1
  });
});
