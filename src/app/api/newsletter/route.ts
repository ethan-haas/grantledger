import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { createRateLimiter, rateLimitResponse } from "@/lib/api/rate-limit";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

const limiter = createRateLimiter({ max: 3, windowMs: 15 * 60 * 1000 });

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

  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email } = result.data;

  // Add contact to Resend audience if API key is configured.
  // Intentional direct process.env access (not env.ts schema) — allows graceful
  // degradation when Resend is not configured, instead of throwing at startup.
  const resendKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!resendKey || !audienceId) {
    logger.warn("Newsletter subscription — Resend not configured", { email });
    return NextResponse.json({ success: true, warning: "Newsletter service not configured" });
  }

  try {
    const resend = new Resend(resendKey);
    await resend.contacts.create({
      email,
      audienceId,
      unsubscribed: false,
    });
    logger.info("Newsletter subscription added to Resend audience", { email });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Failed to add contact to Resend audience", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
