import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createRateLimiter, rateLimitResponse } from "@/lib/api/rate-limit";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  subject: z.enum(["general", "support", "billing", "partnership"]),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

const subjectLabels: Record<string, string> = {
  general: "General Inquiry",
  support: "Technical Support",
  billing: "Billing Question",
  partnership: "Partnership",
};

const limiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const limit = limiter.check(ip);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = parsed.data;
  const subjectLabel = subjectLabels[subject] || subject;

  try {
    await sendEmail({
      to: getServerEnv().CONTACT_EMAIL,
      subject: `[Contact Form] ${subjectLabel} from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subjectLabel)}</p>
        <hr />
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      `,
    });

    logger.info("Contact form submitted", { name, email, subject });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to send contact form email", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
