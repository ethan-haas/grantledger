import { describe, it, expect } from "vitest";
import { trialExpiredEmail } from "./trial-expired";

describe("trialExpiredEmail", () => {
  it("returns correct subject and HTML with org name", () => {
    const { subject, html } = trialExpiredEmail("Acme Nonprofit", "https://app.test.com");
    expect(subject).toBe("Your GrantLedger trial has expired");
    expect(html).toContain("Acme Nonprofit");
    expect(html).toContain("trial has expired");
  });

  it("escapes XSS in org name", () => {
    const { html } = trialExpiredEmail("<script>alert(1)</script>", "https://app.test.com");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("contains billing page CTA link", () => {
    const { html } = trialExpiredEmail("TestOrg", "https://app.test.com");
    expect(html).toContain("https://app.test.com/dashboard/settings/billing");
    expect(html).toContain("Subscribe Now");
  });

  it("appUrl appears in billing link", () => {
    const { html } = trialExpiredEmail("Org", "https://custom.example.com");
    expect(html).toContain("https://custom.example.com/dashboard/settings/billing");
  });
});
