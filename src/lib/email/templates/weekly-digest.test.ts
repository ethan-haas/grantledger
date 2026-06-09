import { describe, it, expect } from "vitest";
import { weeklyDigestEmail } from "./weekly-digest";

const baseData = {
  orgName: "Test Org",
  totalGrants: 3,
  newExpenses: 10,
  categorizedExpenses: 7,
  pendingReview: 5,
  alerts: [],
  appUrl: "https://app.test.com",
};

describe("weeklyDigestEmail", () => {
  it("includes pending count in subject and org name in HTML", () => {
    const { subject, html } = weeklyDigestEmail(baseData);
    expect(subject).toContain("5");
    expect(html).toContain("Test Org");
  });

  it("escapes category in alert rows", () => {
    const { html } = weeklyDigestEmail({
      ...baseData,
      alerts: [{ grantName: "Grant A", category: "<img onerror=alert(1)>", utilization: 85 }],
    });
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img onerror=alert(1)>");
  });

  it("escapes grant name in alert rows", () => {
    const { html } = weeklyDigestEmail({
      ...baseData,
      alerts: [{ grantName: '"><script>', category: "personnel", utilization: 90 }],
    });
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
    expect(html).not.toContain('"><script>');
  });

  it("appUrl appears in dashboard link", () => {
    const { html } = weeklyDigestEmail(baseData);
    expect(html).toContain("https://app.test.com/dashboard");
  });
});
