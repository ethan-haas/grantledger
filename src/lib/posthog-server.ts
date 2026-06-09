import { PostHog } from "posthog-node";
import { logger } from "@/lib/logger";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  client = new PostHog(key, {
    host: "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

  return client;
}

export function trackServerEvent(
  distinctId: string,
  eventName: string,
  properties?: Record<string, unknown>
): void {
  try {
    const ph = getClient();
    if (!ph) return;

    ph.capture({
      distinctId,
      event: eventName,
      properties,
    });
  } catch (err) {
    logger.warn("PostHog server event failed", {
      event: eventName,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
