"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "@/stores/ui-store";

export function useTheme() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    function apply(resolvedTheme: "light" | "dark") {
      if (resolvedTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) => {
        apply(e.matches ? "dark" : "light");
      };

      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    apply(theme);
  }, [theme]);

  return theme;
}

export function useResolvedTheme(): "light" | "dark" {
  const theme = useUiStore((s) => s.theme);
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setResolved(mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent): void => {
        setResolved(e.matches ? "dark" : "light");
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    setResolved(theme);
  }, [theme]);

  return resolved;
}
