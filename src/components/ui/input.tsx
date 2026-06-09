import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> {
  label?: string;
  hint?: string;
  error?: string;
  success?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export type { InputProps };

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, success, prefix, suffix, className = "", id, ...props }, ref) => {
    const borderClass = error
      ? "border-danger-500 bg-danger-50/50 dark:bg-danger-700/10 focus-within:ring-danger-500/30 focus-within:border-danger-500"
      : success
        ? "border-success-500 bg-success-50/50 focus-within:ring-success-500/30 focus-within:border-success-500 dark:bg-success-700/10"
        : "border-slate-300 dark:border-slate-600";

    const hasAddons = prefix !== undefined || suffix !== undefined || success;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {hint && (
              <span className="ml-1 font-normal text-xs text-slate-400 dark:text-slate-500">({hint})</span>
            )}
          </label>
        )}
        {hasAddons ? (
          <div
            className={`flex items-center rounded-lg border text-sm transition-colors duration-150 hover:border-slate-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-500 dark:bg-slate-800 dark:hover:border-slate-500 ${borderClass}`}
          >
            {prefix && (
              <span className="flex items-center pl-3 text-slate-500 dark:text-slate-400" aria-hidden="true">
                {prefix}
              </span>
            )}
            <input
              ref={ref}
              id={id}
              aria-describedby={error && id ? `${id}-error` : undefined}
              aria-invalid={error ? true : undefined}
              className={`block w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 ${prefix ? "pl-1.5" : ""} ${suffix || success ? "pr-1.5" : ""} ${className}`}
              {...props}
            />
            {success && !suffix && (
              <span className="flex items-center pr-3 text-success-500" aria-hidden="true">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            {suffix && (
              <span className="flex items-center pr-3 text-slate-500 dark:text-slate-400" aria-hidden="true">
                {suffix}
              </span>
            )}
          </div>
        ) : (
          <input
            ref={ref}
            id={id}
            aria-describedby={error && id ? `${id}-error` : undefined}
            aria-invalid={error ? true : undefined}
            className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 ${borderClass} ${className}`}
            {...props}
          />
        )}
        {error && (
          <p id={id ? `${id}-error` : undefined} className="mt-1 text-xs text-danger-600 dark:text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
