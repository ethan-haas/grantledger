"use client";

import { useEffect, useState } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveIndicatorProps {
  status: SaveStatus;
  errorMessage?: string;
  savedDuration?: number;
  className?: string;
}

export function SaveIndicator({
  status,
  errorMessage = "Failed to save",
  savedDuration = 3000,
  className = "",
}: SaveIndicatorProps) {
  const [visible, setVisible] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<SaveStatus>(status);

  useEffect(() => {
    if (status === "idle") {
      setVisible(false);
      return;
    }

    setDisplayStatus(status);
    setVisible(true);

    if (status === "saved") {
      const timer = setTimeout(() => {
        setVisible(false);
      }, savedDuration);
      return () => clearTimeout(timer);
    }
  }, [status, savedDuration]);

  if (!visible && displayStatus === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-sm transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      } ${className}`}
    >
      {displayStatus === "saving" && (
        <>
          <svg
            className="h-4 w-4 animate-spin text-slate-500 dark:text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-slate-500 dark:text-slate-400">Saving...</span>
        </>
      )}

      {displayStatus === "saved" && (
        <>
          <svg
            className="h-4 w-4 text-success-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-success-600 dark:text-success-500">Saved</span>
        </>
      )}

      {displayStatus === "error" && (
        <>
          <svg
            className="h-4 w-4 text-danger-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-danger-600 dark:text-danger-500">{errorMessage}</span>
        </>
      )}
    </div>
  );
}
