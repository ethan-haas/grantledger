import type { HTMLAttributes } from "react";

/* ─── ProgressBar ────────────────────────────────────────────── */

type BarSize = "sm" | "md" | "lg";
type BarColor = "primary" | "success" | "warning" | "danger";

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: BarSize;
  color?: BarColor;
  label?: string;
  showValue?: boolean;
}

const barSizeStyles: Record<BarSize, string> = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const barColorStyles: Record<BarColor, string> = {
  primary: "bg-primary-600 dark:bg-primary-500",
  success: "bg-success-600 dark:bg-success-500",
  warning: "bg-warning-500 dark:bg-warning-400",
  danger: "bg-danger-600 dark:bg-danger-500",
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  color = "primary",
  label,
  showValue = false,
  className = "",
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={className} {...props}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>}
          {showValue && (
            <span className="text-slate-500 dark:text-slate-400">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${barSizeStyles[size]}`}
      >
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || "Progress"}
          className={`${barSizeStyles[size]} rounded-full transition-all duration-500 ease-out ${barColorStyles[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/* ─── ProgressRing ───────────────────────────────────────────── */

type RingSize = "sm" | "md" | "lg";

interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: RingSize;
  color?: BarColor;
  label?: string;
  showValue?: boolean;
}

const ringSizes: Record<RingSize, { size: number; strokeWidth: number }> = {
  sm: { size: 48, strokeWidth: 4 },
  md: { size: 64, strokeWidth: 5 },
  lg: { size: 80, strokeWidth: 6 },
};

export function ProgressRing({
  value,
  max = 100,
  size = "md",
  color = "primary",
  label,
  showValue = true,
  className = "",
  ...props
}: ProgressRingProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const { size: svgSize, strokeWidth } = ringSizes[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const strokeColorMap: Record<BarColor, string> = {
    primary: "stroke-primary-600 dark:stroke-primary-500",
    success: "stroke-success-600 dark:stroke-success-500",
    warning: "stroke-warning-500 dark:stroke-warning-400",
    danger: "stroke-danger-600 dark:stroke-danger-500",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || "Progress"}
      {...props}
    >
      <svg width={svgSize} height={svgSize} className="-rotate-90">
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${strokeColorMap[color]} transition-[stroke-dashoffset] duration-500 ease-out`}
        />
      </svg>
      {showValue && (
        <span className="absolute text-sm font-semibold text-slate-900 dark:text-slate-100">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
