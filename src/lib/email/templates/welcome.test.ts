import { describe, it, expect } from "vitest";
import { welcomeEmail } from "./welcome";

describe("welcomeEmail", () => {
  it("contains the unsubscribe footer", () => {
    const { html } = welcomeEmail("Acme Nonprofit", "https://app.test.com");
    expect(html).toContain("Unsubscribe");
    expect(html).toContain("mailto:support@grantledger.com");
  });

  it("escapes HTML characters in orgName", () => {
    const { html } = welcomeEmail('<script>alert("xss")</script>', "https://app.test.com");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("appUrl appears in dashboard link", () => {
    const { html } = welcomeEmail("Acme Nonprofit", "https://app.test.com");
    expect(html).toContain("https://app.test.com/dashboard");
  });
});
