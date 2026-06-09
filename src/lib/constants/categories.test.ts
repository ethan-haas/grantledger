import { describe, it, expect } from "vitest";
import { SF424A_CATEGORIES, SF424A_CATEGORY_VALUES, CATEGORY_COLORS } from "./categories";

describe("SF424A constants", () => {
  it("SF424A_CATEGORIES has exactly 10 items (9 categories + total)", () => {
    expect(SF424A_CATEGORIES).toHaveLength(10);
    const values = SF424A_CATEGORIES.map((c) => c.value);
    expect(values).toContain("total");
  });

  it("SF424A_CATEGORY_VALUES excludes total and has 9 entries", () => {
    expect(SF424A_CATEGORY_VALUES).toHaveLength(9);
    expect(SF424A_CATEGORY_VALUES).not.toContain("total");
  });

  it("CATEGORY_COLORS has entries for all SF424A category values plus total", () => {
    for (const cat of SF424A_CATEGORIES) {
      expect(CATEGORY_COLORS).toHaveProperty(cat.value);
      expect(typeof CATEGORY_COLORS[cat.value]).toBe("string");
    }
  });

  it("all 9 category values are unique (no duplicates)", () => {
    expect(new Set(SF424A_CATEGORY_VALUES).size).toBe(9);
  });

  it("all categories have non-empty labels and descriptions", () => {
    for (const cat of SF424A_CATEGORIES) {
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.description.length).toBeGreaterThan(0);
    }
  });

  it('SF424A_CATEGORY_VALUES starts with "personnel" and ends with "indirect_charges"', () => {
    expect(SF424A_CATEGORY_VALUES[0]).toBe("personnel");
    expect(SF424A_CATEGORY_VALUES[SF424A_CATEGORY_VALUES.length - 1]).toBe("indirect_charges");
  });
});
