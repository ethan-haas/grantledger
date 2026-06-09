"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <h2 style={{ color: "#1e293b" }}>Something went wrong</h2>
          <p style={{ color: "#64748b" }}>An unexpected error occurred. Our team has been notified.</p>
          {error.digest && (
            <p style={{ color: "#94a3b8", fontSize: "12px" }}>Error ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "16px",
              padding: "8px 24px",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
