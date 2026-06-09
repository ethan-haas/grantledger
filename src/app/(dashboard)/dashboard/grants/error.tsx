"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GrantsError({
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
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Card className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 animate-float">
          <svg className="h-7 w-7 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold font-display tracking-tight text-slate-900 dark:text-slate-100">Failed to load grants</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-slate-400">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => window.location.href = "/dashboard"}>
            Go to Dashboard
          </Button>
          <Button onClick={reset}>
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
