import type { HTMLAttributes, ReactNode } from "react";

type ChipVariant = "default" | "success" | "warning" | "danger" | "info";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  removable?: boolean;
  onRemove?: () => void;
  icon?: ReactNode;
}

const variantStyles: Record<ChipVariant, string> = {
  default: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600",
  success: "bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-700/20 dark:text-success-500 dark:hover:bg-success-700/30",
  warning: "bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-700/20 dark:text-warning-500 dark:hover:bg-warning-700/30",
  danger: "bg-danger-50 text-danger-700 hover:bg-danger-100 dark:bg-danger-700/20 dark:text-danger-500 dark:hover:bg-danger-700/30",
  info: "bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-700/20 dark:text-primary-400 dark:hover:bg-primary-700/30",
};

export function Chip({
  variant = "default",
  removable = false,
  onRemove,
  icon,
  className = "",
  onClick,
  children,
  ...props
}: ChipProps) {
  const isInteractive = !!onClick;

  return (
    <span
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLSpanElement>);
              }
            }
          : undefined
      }
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 min-h-[32px] ${variantStyles[variant]} ${
        isInteractive ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-600" : ""
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0 -ml-0.5">{icon}</span>}
      {children}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label="Remove"
          className="-mr-1 ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

interface ChipGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ChipGroup({ className = "", children, ...props }: ChipGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="group" {...props}>
      {children}
    </div>
  );
}
