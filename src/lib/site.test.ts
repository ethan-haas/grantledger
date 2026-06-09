import { describe, it, expect } from "vitest";
import { SITE_URL } from "./site";

describe("SITE_URL", () => {
  it("uses HTTPS", () => {
    expect(SITE_URL.startsWith("https://")).toBe(true);
  });

  it("has no trailing slash", () => {
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});
