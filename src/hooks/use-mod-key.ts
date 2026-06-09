"use client";

import { useEffect, useState } from "react";

/** Returns "⌘" on Mac, "Ctrl" elsewhere. Safe for SSR — always returns "Ctrl" on first render to avoid hydration mismatch. */
export function useModKey(): string {
  const [modKey, setModKey] = useState("Ctrl");

  useEffect(() => {
    if (/Mac/.test(navigator.userAgent)) {
      setModKey("\u2318");
    }
  }, []);

  return modKey;
}
