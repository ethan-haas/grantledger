import type { HTMLAttributes } from "react";

type SkeletonVariant = "text" | "heading" | "avatar" | "card" | "chart";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: "h-4 w-full rounded",
  heading: "h-7 w-2/3 rounded-lg",
  avatar: "h-10 w-10 rounded-full",
  card: "h-32 w-full rounded-xl",
  chart: "h-48 w-full rounded-xl",
};

export function Skeleton({ variant, className = "", ...props }: SkeletonProps) {
  const baseClass = variant ? variantStyles[variant] : "rounded-lg";

  return (
    <div
      aria-hidden="true"
      className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer ${baseClass} ${className}`}
      {...props}
    />
  );
}
