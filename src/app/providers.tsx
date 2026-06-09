"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, useRef } from "react";
import { getClientEnv } from "@/lib/env";
import { useTheme } from "@/hooks/use-theme";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const posthogKey = getClientEnv().NEXT_PUBLIC_POSTHOG_KEY;

  useEffect(() => {
    if (!initialized.current && posthogKey) {
      posthog.init(posthogKey, {
        api_host: "https://us.i.posthog.com",
        capture_pageview: false,
      });
      initialized.current = true;
    }
  }, [posthogKey]);

  const content = posthogKey ? (
    <PostHogProvider client={posthog}>{children}</PostHogProvider>
  ) : (
    <>{children}</>
  );

  return <ThemeProvider>{content}</ThemeProvider>;
}
