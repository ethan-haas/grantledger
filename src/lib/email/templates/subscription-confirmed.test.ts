import { describe, it, expect } from "vitest";
import { subscriptionConfirmedEmail } from "./subscription-confirmed";

describe("subscriptionConfirmedEmail", () => {
  it("escapes HTML characters in orgName", () => {
    const { html } = subscriptionConfirmedEmail(
      '<script>alert("xss")</script>',
      "Pro",
      "https://app.test.com"
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML characters in planName", () => {
    const { html } = subscriptionConfirmedEmail(
      "Acme Corp",
      '<img src=x onerror="alert(1)">',
      "https://app.test.com"
    );
    expect(html).not.toContain('<img src=x');
    expect(html).toContain("&lt;img");
  });

  it("appUrl appears in dashboard link", () => {
    const { html } = subscriptionConfirmedEmail("Acme Corp", "Pro", "https://app.test.com");
    expect(html).toContain("https://app.test.com/dashboard");
  });
});
