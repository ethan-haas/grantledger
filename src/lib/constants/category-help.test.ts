import { describe, it, expect } from "vitest";
import { CATEGORY_HELP } from "./category-help";

const expectedCategories = [
  "personnel", "fringe_benefits", "travel", "equipment",
  "supplies", "contractual", "construction", "other", "indirect_charges",
];

describe("CATEGORY_HELP", () => {
  it("has help text for all 9 SF-424A categories (excluding total)", () => {
    expectedCategories.forEach((cat) => {
      expect(CATEGORY_HELP[cat]).toBeDefined();
    });
  });

  it("each category has all required fields", () => {
    expectedCategories.forEach((cat) => {
      const help = CATEGORY_HELP[cat];
      expect(help.definition).toBeTruthy();
      expect(help.examples.length).toBeGreaterThan(0);
      expect(help.cfrReference).toBeTruthy();
      expect(help.commonMistakes.length).toBeGreaterThan(0);
    });
  });
});
