import type { HTMLAttributes, ImgHTMLAttributes } from "react";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeStyles: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const colors = [
  "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400",
  "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-400",
  "bg-success-100 text-success-700 dark:bg-success-700/20 dark:text-success-500",
  "bg-warning-100 text-warning-700 dark:bg-warning-700/20 dark:text-warning-500",
  "bg-danger-100 text-danger-700 dark:bg-danger-700/20 dark:text-danger-500",
  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

type StatusColor = "online" | "offline" | "busy" | "away";
const statusColors: Record<StatusColor, string> = {
  online: "bg-success-500",
  offline: "bg-slate-400",
  busy: "bg-danger-500",
  away: "bg-warning-500",
};

interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
  status?: StatusColor;
}

export function Avatar({
  name,
  src,
  alt,
  size = "md",
  status,
  className = "",
  ...props
}: AvatarProps) {
  const initials = getInitials(name);
  const colorIndex = hashString(name) % colors.length;
  const imgProps: ImgHTMLAttributes<HTMLImageElement> = {
    src,
    alt: alt || name,
    className: "h-full w-full rounded-full object-cover",
  };

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeStyles[size]} ${src ? "" : colors[colorIndex]} ${className}`}
      aria-label={name}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img {...imgProps} />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-slate-900 ${statusColors[status]} ${size === "xs" || size === "sm" ? "h-2 w-2" : "h-3 w-3"}`}
          aria-label={status}
        />
      )}
    </span>
  );
}

interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: AvatarSize;
  children: React.ReactElement<AvatarProps>[];
}

export function AvatarGroup({
  max = 4,
  size = "md",
  className = "",
  children,
  ...props
}: AvatarGroupProps) {
  const visible = children.slice(0, max);
  const overflow = children.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`} {...props}>
      {visible.map((child, i) => (
        <span
          key={i}
          className="ring-2 ring-white dark:ring-slate-900 rounded-full"
        >
          {child}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 ring-2 ring-white dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-900 ${sizeStyles[size]}`}
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
