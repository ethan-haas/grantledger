import type { SVGProps } from "react";

const baseProps: SVGProps<SVGSVGElement> = {
  width: 120,
  height: 120,
  viewBox: "0 0 120 120",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
};

const strokeProps = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function NoGrantsIllustration({ className = "" }: { className?: string }) {
  return (
    <svg {...baseProps} className={`text-slate-400 dark:text-slate-500 ${className}`}>
      <rect x="25" y="20" width="70" height="80" rx="8" {...strokeProps} />
      <path d="M40 45h40M40 55h30M40 65h20" {...strokeProps} />
      <circle cx="85" cy="85" r="20" className="fill-primary-50 dark:fill-primary-900/20" />
      <path d="M85 78v14M78 85h14" {...strokeProps} className="text-primary-500" />
    </svg>
  );
}

export function NoExpensesIllustration({ className = "" }: { className?: string }) {
  return (
    <svg {...baseProps} className={`text-slate-400 dark:text-slate-500 ${className}`}>
      <rect x="20" y="30" width="80" height="60" rx="6" {...strokeProps} />
      <path d="M20 50h80" {...strokeProps} />
      <path d="M35 65h20M35 75h15" {...strokeProps} />
      <path d="M70 65h15M70 75h10" {...strokeProps} />
      <circle cx="60" cy="60" r="5" className="fill-warning-100 dark:fill-warning-900/20 stroke-warning-500" strokeWidth={1.5} />
      <path d="M60 58v2.5M60 62h.01" className="stroke-warning-500" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export function NoAlertsIllustration({ className = "" }: { className?: string }) {
  return (
    <svg {...baseProps} className={`text-slate-400 dark:text-slate-500 ${className}`}>
      <path d="M60 25L95 85H25L60 25z" {...strokeProps} />
      <circle cx="60" cy="65" r="25" className="fill-success-50 dark:fill-success-900/20" />
      <path d="M48 65l8 8 16-16" className="stroke-success-500" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NoActivityIllustration({ className = "" }: { className?: string }) {
  return (
    <svg {...baseProps} className={`text-slate-400 dark:text-slate-500 ${className}`}>
      <circle cx="35" cy="35" r="8" {...strokeProps} />
      <path d="M35 43v30" {...strokeProps} strokeDasharray="4 4" />
      <circle cx="35" cy="80" r="5" {...strokeProps} />
      <rect x="55" y="28" width="40" height="14" rx="4" {...strokeProps} />
      <path d="M60 35h25" {...strokeProps} />
      <rect x="55" y="73" width="30" height="14" rx="4" {...strokeProps} />
      <path d="M60 80h15" {...strokeProps} />
    </svg>
  );
}

export function NoBudgetIllustration({ className = "" }: { className?: string }) {
  return (
    <svg {...baseProps} className={`text-slate-400 dark:text-slate-500 ${className}`}>
      <rect x="15" y="70" width="18" height="30" rx="3" className="fill-slate-100 dark:fill-slate-800" {...strokeProps} />
      <rect x="40" y="50" width="18" height="50" rx="3" className="fill-slate-100 dark:fill-slate-800" {...strokeProps} />
      <rect x="65" y="35" width="18" height="65" rx="3" className="fill-slate-100 dark:fill-slate-800" {...strokeProps} />
      <rect x="90" y="55" width="18" height="45" rx="3" className="fill-slate-100 dark:fill-slate-800" {...strokeProps} />
      <path d="M15 100h98" {...strokeProps} />
      <circle cx="95" cy="30" r="15" className="fill-primary-50 dark:fill-primary-900/20" />
      <path d="M90 30h10M95 25v10" className="stroke-primary-500" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
