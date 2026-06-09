import { escapeHtml } from "@/lib/email/escape-html";

export function welcomeEmail(orgName: string, appUrl: string) {
  return {
    subject: "Welcome to GrantLedger",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="color:#1e40af;font-size:24px;margin:0 0 8px;">Welcome to GrantLedger</h1>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Your organization <strong>${escapeHtml(orgName)}</strong> is all set up with a 14-day free trial.
      </p>
      <h2 style="color:#1e293b;font-size:18px;margin:0 0 12px;">Get started in 3 steps:</h2>
      <ol style="color:#475569;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li>Create a grant and set your SF-424A budget categories</li>
        <li>Import expenses via CSV, QuickBooks, or Xero</li>
        <li>Review AI categorizations and generate audit-ready reports</li>
      </ol>
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">
        Go to Dashboard
      </a>
      <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">
        Your trial includes full access to all features. No credit card required.
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
