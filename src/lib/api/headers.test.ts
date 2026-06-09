import { describe, it, expect } from "vitest";
import { NO_CACHE_HEADERS } from "./headers";

describe("NO_CACHE_HEADERS", () => {
  it("includes Cache-Control with no-store", () => {
    expect(NO_CACHE_HEADERS["Cache-Control"]).toContain("no-store");
  });

  it("includes Pragma no-cache", () => {
    expect(NO_CACHE_HEADERS.Pragma).toBe("no-cache");
  });
});
