import { escapeHtml } from "@/lib/email/escape-html";

export function trialEndingEmail(orgName: string, daysRemaining: number, appUrl: string) {
  const days = Math.max(0, Math.min(14, Math.round(daysRemaining)));
  return {
    subject: `Your GrantLedger trial ends in ${days} days`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="color:#1e40af;font-size:24px;margin:0 0 8px;">Your trial is ending soon</h1>
      <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 16px;">
        <strong>${escapeHtml(orgName)}</strong>'s free trial ends in <strong>${days} day${days === 1 ? "" : "s"}</strong>.
      </p>
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Subscribe now to keep your grants, categorizations, and reports. Your data stays safe &mdash; we never delete it during a grace period.
      </p>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="color:#0c4a6e;font-size:14px;margin:0;"><strong>Save 17%</strong> with annual billing: $1,490/year vs $149/month.</p>
      </div>
      <a href="${appUrl}/dashboard/settings/billing"
         style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">
        Subscribe Now
      </a>
    </div>
    <p style="color:#94a3b8;font-size:11px;margin:24px 0 0;text-align:center;">
      GrantLedger, Inc. &bull; <a href="mailto:support@grantledger.com" style="color:#94a3b8;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`,
  };
}
