import { escapeHtml } from "@/lib/email/escape-html";

export function subscriptionConfirmedEmail(orgName: string, planName: string, appUrl: string) {
  return {
    subject: "Your GrantLedger subscription is active",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#f0fdf4;border-radius:8px;padding:12px 16px;margin:0 0 24px;display:inline-block;">
        <span style="color:#166534;font-size:14px;font-weight:600;">Subscription Active</span>
      </div>
      <h1 style="color:#1e40af;font-size:24px;margin:0 0 8px;">You're all set!</h1>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 16px;">
        <strong>${escapeHtml(orgName)}</strong> is now on the <strong>${escapeHtml(planName)}</strong> plan. You have full access to all GrantLedger features.
      </p>
      <h2 style="color:#1e293b;font-size:16px;margin:0 0 12px;">What you get:</h2>
      <ul style="color:#475569;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li>Unlimited grants and expense imports</li>
        <li>AI-powered 2 CFR 200 categorization with CFR citations</li>
        <li>Budget-to-actual dashboards with overspend alerts</li>
        <li>QuickBooks and Xero integrations</li>
        <li>PDF and CSV compliance reports</li>
        <li>Dual-framework OMB compliance (pre/post Oct 2024)</li>
      </ul>
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">
        Go to Dashboard
      </a>
      <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">
        Manage your subscription anytime from Settings &rarr; Billing.
      </p>
    </div>
    <p style="color:#94a3b8;font-size:11px;margin:24px 0 0;text-align:center;">
      GrantLedger, Inc. &bull; <a href="mailto:support@grantledger.com" style="color:#94a3b8;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`,
  };
}
