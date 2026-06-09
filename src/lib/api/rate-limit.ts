import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimiterOptions {
  max: number;
  windowMs: number;
}

const MAX_MAP_ENTRIES = 10_000;

export function createRateLimiter({ max, windowMs }: RateLimiterOptions) {
  const map = new Map<string, RateLimitEntry>();

  function pruneExpired() {
    if (map.size <= MAX_MAP_ENTRIES) return;
    const now = Date.now();
    map.forEach((entry, key) => {
      if (now > entry.resetAt) map.delete(key);
    });
  }

  function check(key: string): RateLimitResult {
    pruneExpired();
    const now = Date.now();
    const entry = map.get(key);

    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs;
      map.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: max - 1, resetAt };
    }

    if (entry.count >= max) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
  }

  return { check, _map: map };
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(retryAfter, 1)) },
    }
  );
}
