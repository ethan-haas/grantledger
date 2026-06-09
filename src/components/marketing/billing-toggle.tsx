"use client";

interface BillingToggleProps {
  value: "monthly" | "annual";
  onChange: (value: "monthly" | "annual") => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full bg-slate-100 p-1 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
          value === "monthly"
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
          value === "annual"
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        Annual
        <span className="ml-1.5 rounded-full bg-success-100 px-1.5 py-0.5 text-[10px] font-semibold text-success-700">
          Save 17%
        </span>
      </button>
    </div>
  );
}
