import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(getServerEnv().RESEND_API_KEY);
  }
  return resendInstance;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  const resend = getResend();
  const senderEmail = from || getServerEnv().RESEND_FROM_EMAIL;

  const { data, error } = await resend.emails.send({
    from: `GrantLedger <${senderEmail}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<mailto:${getServerEnv().CONTACT_EMAIL}>`,
    },
  });

  if (error) {
    logger.error("Failed to send email", { error: error.message });
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}
