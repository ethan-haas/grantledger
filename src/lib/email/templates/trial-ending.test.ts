import { describe, it, expect } from "vitest";
import { trialEndingEmail } from "./trial-ending";

describe("trialEndingEmail", () => {
  it("clamps negative days to 0", () => {
    const { subject } = trialEndingEmail("Org", -2, "https://app.test.com");
    expect(subject).toContain("0 days");
  });

  it("clamps excess days to 14", () => {
    const { subject } = trialEndingEmail("Org", 20, "https://app.test.com");
    expect(subject).toContain("14 days");
  });

  it("escapes org name in HTML", () => {
    const { html } = trialEndingEmail("<script>alert(1)</script>", 3, "https://app.test.com");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("appUrl appears in billing link", () => {
    const { html } = trialEndingEmail("Org", 3, "https://app.test.com");
    expect(html).toContain("https://app.test.com/dashboard/settings/billing");
  });
});
