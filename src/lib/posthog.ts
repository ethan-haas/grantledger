import posthog from "posthog-js";
import { getClientEnv } from "@/lib/env";

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && getClientEnv().NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(eventName, properties);
  }
}
