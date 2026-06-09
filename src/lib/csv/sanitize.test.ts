import { describe, it, expect } from "vitest";
import { sanitizeCsvValue } from "./sanitize";

describe("sanitizeCsvValue", () => {
  it("prefixes values starting with =", () => {
    expect(sanitizeCsvValue("=SUM(A1)")).toBe("'=SUM(A1)");
  });

  it("prefixes values starting with +", () => {
    expect(sanitizeCsvValue("+1-555-1234")).toBe("'+1-555-1234");
  });

  it("prefixes values starting with -", () => {
    expect(sanitizeCsvValue("-100")).toBe("'-100");
  });

  it("prefixes values starting with @", () => {
    expect(sanitizeCsvValue("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("leaves normal strings unchanged", () => {
    expect(sanitizeCsvValue("Office Supplies")).toBe("Office Supplies");
  });

  it("handles empty strings", () => {
    expect(sanitizeCsvValue("")).toBe("");
  });

  it("handles null and undefined", () => {
    expect(sanitizeCsvValue(null)).toBe("");
    expect(sanitizeCsvValue(undefined)).toBe("");
  });

  it("handles numeric values", () => {
    expect(sanitizeCsvValue(42)).toBe("42");
    expect(sanitizeCsvValue(0)).toBe("0");
  });

  it("tab-prefixed value passes through unchanged", () => {
    expect(sanitizeCsvValue("\t=SUM(A1)")).toBe("\t=SUM(A1)");
  });

  it("does not double-prefix already-sanitized values", () => {
    expect(sanitizeCsvValue("'=SUM(A1)")).toBe("'=SUM(A1)");
  });

  it("whitespace-only input passes through unchanged", () => {
    expect(sanitizeCsvValue("   ")).toBe("   ");
  });

  it("boolean input converted to string", () => {
    expect(sanitizeCsvValue(true)).toBe("true");
    expect(sanitizeCsvValue(false)).toBe("false");
  });

  it("object with toString returning formula prefix gets sanitized", () => {
    const obj = { toString: () => "=EVIL" };
    expect(sanitizeCsvValue(obj)).toBe("'=EVIL");
  });
});
