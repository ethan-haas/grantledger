import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-500/30",
  success: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20 dark:bg-success-700/20 dark:text-success-500",
  warning: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20 dark:bg-warning-700/20 dark:text-warning-500",
  danger: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20 dark:bg-danger-700/20 dark:text-danger-500",
  info: "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-500/20 dark:bg-primary-700/20 dark:text-primary-400",
};

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
