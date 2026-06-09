import { describe, it, expect } from "vitest";
import { CFR_CITATIONS } from "./cfr-citations";

describe("CFR_CITATIONS", () => {
  it("has entries", () => {
    expect(Object.keys(CFR_CITATIONS).length).toBeGreaterThan(10);
  });

  it("all values are non-empty strings", () => {
    Object.entries(CFR_CITATIONS).forEach(([, value]) => {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    });
  });

  it("has key cost principle sections", () => {
    expect(CFR_CITATIONS["200.430"]).toBeDefined(); // Personnel
    expect(CFR_CITATIONS["200.431"]).toBeDefined(); // Fringe
    expect(CFR_CITATIONS["200.474"]).toBeDefined(); // Travel
    expect(CFR_CITATIONS["200.439"]).toBeDefined(); // Equipment
    expect(CFR_CITATIONS["200.453"]).toBeDefined(); // Supplies
    expect(CFR_CITATIONS["200.414"]).toBeDefined(); // Indirect
  });

  it('all keys follow "200.XXX" format (3-digit section numbers)', () => {
    for (const key of Object.keys(CFR_CITATIONS)) {
      expect(key).toMatch(/^200\.\d{3}$/);
    }
  });

  it("all descriptions are substantive (>20 chars)", () => {
    for (const [, value] of Object.entries(CFR_CITATIONS)) {
      expect(value.length).toBeGreaterThan(20);
    }
  });

  it('contains 200.501 (single audit requirements)', () => {
    expect(CFR_CITATIONS["200.501"]).toBeDefined();
    expect(CFR_CITATIONS["200.501"].toLowerCase()).toContain("audit");
  });
});
