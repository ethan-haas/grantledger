import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          aria-describedby={error && id ? `${id}-error` : undefined}
          aria-invalid={error ? true : undefined}
          className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 transition-colors duration-150 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 ${
            error
              ? "border-danger-500 bg-danger-50/50 dark:bg-danger-700/10 focus:ring-danger-500/30 focus:border-danger-500"
              : "border-slate-300 dark:border-slate-600"
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={id ? `${id}-error` : undefined} className="mt-1 text-xs text-danger-600 dark:text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
