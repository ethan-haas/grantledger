"use client";

import { useState, type ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "danger";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; border: string }> = {
  info: {
    container: "bg-primary-50 dark:bg-primary-950/30",
    icon: "text-primary-600 dark:text-primary-400",
    border: "border-l-primary-500",
  },
  success: {
    container: "bg-success-50 dark:bg-success-700/10",
    icon: "text-success-600 dark:text-success-500",
    border: "border-l-success-500",
  },
  warning: {
    container: "bg-warning-50 dark:bg-warning-700/10",
    icon: "text-warning-600 dark:text-warning-500",
    border: "border-l-warning-500",
  },
  danger: {
    container: "bg-danger-50 dark:bg-danger-700/10",
    icon: "text-danger-600 dark:text-danger-500",
    border: "border-l-danger-500",
  },
};

const defaultIcons: Record<AlertVariant, ReactNode> = {
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  danger: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
};

export function Alert({
  variant = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  action,
  icon,
  className = "",
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const styles = variantStyles[variant];
  const displayIcon = icon ?? defaultIcons[variant];

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      className={`rounded-lg border-l-4 ${styles.border} ${styles.container} p-4 ${className}`}
    >
      <div className="flex gap-3">
        <span className={`shrink-0 ${styles.icon}`}>{displayIcon}</span>
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          )}
          <div className={`text-sm text-slate-700 dark:text-slate-300 ${title ? "mt-1" : ""}`}>
            {children}
          </div>
          {action && <div className="mt-3">{action}</div>}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-2 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:hover:bg-slate-700/50 dark:hover:text-slate-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
