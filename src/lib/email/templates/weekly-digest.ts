import { escapeHtml } from "@/lib/email/escape-html";

interface DigestData {
  orgName: string;
  totalGrants: number;
  newExpenses: number;
  categorizedExpenses: number;
  pendingReview: number;
  alerts: { grantName: string; category: string; utilization: number }[];
  appUrl: string;
}

export function weeklyDigestEmail(data: DigestData) {
  const alertRows = data.alerts
    .map(
      (a) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-size:14px;">${escapeHtml(a.grantName)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-size:14px;">${escapeHtml(a.category)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:${a.utilization >= 90 ? "#dc2626" : "#d97706"};font-size:14px;font-weight:600;">${a.utilization}%</td>
        </tr>`
    )
    .join("");

  const alertsSection =
    data.alerts.length > 0
      ? `
      <h2 style="color:#1e293b;font-size:16px;margin:24px 0 12px;">Budget Alerts</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Grant</th>
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Category</th>
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#64748b;border-bottom:1px solid #e2e8f0;">Utilization</th>
          </tr>
        </thead>
        <tbody>${alertRows}</tbody>
      </table>`
      : "";

  return {
    subject: `GrantLedger Weekly Digest — ${data.pendingReview} expenses need review`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="color:#1e40af;font-size:24px;margin:0 0 8px;">Weekly Digest</h1>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">${escapeHtml(data.orgName)} &mdash; Week in review</p>

      <div style="display:flex;gap:12px;margin:0 0 24px;">
        <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
          <div style="color:#1e293b;font-size:24px;font-weight:700;">${data.totalGrants}</div>
          <div style="color:#64748b;font-size:13px;">Active Grants</div>
        </div>
        <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
          <div style="color:#1e293b;font-size:24px;font-weight:700;">${data.newExpenses}</div>
          <div style="color:#64748b;font-size:13px;">New Expenses</div>
        </div>
        <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
          <div style="color:#1e293b;font-size:24px;font-weight:700;">${data.pendingReview}</div>
          <div style="color:#64748b;font-size:13px;">Pending Review</div>
        </div>
      </div>

      ${data.pendingReview > 0 ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:0 0 24px;">
        <p style="color:#92400e;font-size:14px;margin:0;">
          <strong>${data.pendingReview} expense${data.pendingReview === 1 ? "" : "s"}</strong> awaiting your review. AI categorizations are ready for confirmation.
        </p>
      </div>` : ""}

      ${alertsSection}

      <div style="margin:24px 0 0;">
        <a href="${data.appUrl}/dashboard"
           style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;">
          Open Dashboard
        </a>
      </div>
    </div>
    <p style="color:#94a3b8;font-size:11px;margin:24px 0 0;text-align:center;">
      GrantLedger, Inc. &bull; <a href="mailto:support@grantledger.com" style="color:#94a3b8;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`,
  };
}
