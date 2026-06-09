import type { HTMLAttributes } from "react";

interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  orientation?: "horizontal" | "vertical";
}

export function Divider({
  label,
  orientation = "horizontal",
  className = "",
  ...props
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`inline-block w-px self-stretch bg-slate-200 dark:bg-slate-700 ${className}`}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        className={`flex items-center gap-3 ${className}`}
        {...props}
      >
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <hr
      className={`border-0 h-px bg-slate-200 dark:bg-slate-700 ${className}`}
      {...props}
    />
  );
}
