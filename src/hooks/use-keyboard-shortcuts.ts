"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface ShortcutDef {
  keys: string[];
  label: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const chordBufferRef = useRef<string[]>([]);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openHelp = useCallback(() => setShowHelp(true), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);

  const shortcuts: ShortcutDef[] = useMemo(() => [
    { keys: ["g", "d"], label: "Go to Dashboard", action: () => router.push("/dashboard") },
    { keys: ["g", "g"], label: "Go to Grants", action: () => router.push("/dashboard/grants") },
    { keys: ["g", "s"], label: "Go to Settings", action: () => router.push("/dashboard/settings") },
    { keys: ["g", "e"], label: "Go to Expenses", action: () => router.push("/dashboard/grants") },
    { keys: ["g", "r"], label: "Go to Reports", action: () => router.push("/dashboard/grants") },
    { keys: ["g", "i"], label: "Go to Import", action: () => router.push("/dashboard/grants") },
    { keys: ["?"], label: "Show keyboard shortcuts", action: openHelp },
  ], [router, openHelp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      // Cmd+N / Ctrl+N for new grant
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        router.push("/dashboard/grants/new");
        return;
      }

      // ? key for help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Chord detection (e.g., g d, g g, g s)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key.length !== 1) return;

      chordBufferRef.current.push(key);
      if (chordTimerRef.current) clearTimeout(chordTimerRef.current);

      // Check for matching shortcuts
      const chord = chordBufferRef.current.join("");
      const match = shortcuts.find(
        (s) => s.keys.length > 1 && s.keys.join("") === chord
      );

      if (match) {
        e.preventDefault();
        chordBufferRef.current = [];
        if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
        match.action();
        return;
      }

      // Clear buffer after 500ms
      chordTimerRef.current = setTimeout(() => {
        chordBufferRef.current = [];
      }, 500);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, openHelp, shortcuts]);

  return { showHelp, openHelp, closeHelp, shortcuts };
}
