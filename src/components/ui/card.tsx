import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

export function Card({ padding = "md", hover = false, className = "", children, ...props }: CardProps) {
  const paddingStyles = {
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const hoverStyles = hover
    ? "hover:shadow-soft-lg hover:border-slate-300/80 dark:hover:border-slate-600 hover:-translate-y-0.5 transition-all duration-300"
    : "transition-shadow duration-200";

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-soft-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-none ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = "", children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-slate-600 dark:text-slate-400 ${className}`} {...props}>
      {children}
    </p>
  );
}
