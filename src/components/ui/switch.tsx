import { forwardRef, useId, type InputHTMLAttributes } from "react";

type SwitchSize = "sm" | "md" | "lg";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  description?: string;
  size?: SwitchSize;
}

const sizeStyles: Record<SwitchSize, { track: string }> = {
  sm: { track: "h-5 w-8" },
  md: { track: "h-6 w-10" },
  lg: { track: "h-7 w-12" },
};

// Use exact pixel sizing for thumb to avoid fractional Tailwind issues
// Full prefixed classes so Tailwind JIT can scan them at build time
const thumbPixelStyles: Record<SwitchSize, { size: string; checked: string }> = {
  sm: { size: "h-3.5 w-3.5", checked: "peer-checked:translate-x-[14px]" },
  md: { size: "h-[18px] w-[18px]", checked: "peer-checked:translate-x-[18px]" },
  lg: { size: "h-[22px] w-[22px]", checked: "peer-checked:translate-x-[22px]" },
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, size = "md", className = "", id, disabled, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const descriptionId = description ? `${inputId}-desc` : undefined;

    return (
      <label
        htmlFor={inputId}
        className={`inline-flex items-start gap-3 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${className}`}
      >
        <span className="relative inline-flex shrink-0 items-center">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={inputId}
            disabled={disabled}
            aria-checked={props.checked}
            aria-describedby={descriptionId}
            className="peer sr-only"
            {...props}
          />
          <span
            className={`${sizeStyles[size].track} rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-primary-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-600 dark:bg-slate-600 dark:peer-checked:bg-primary-500`}
          />
          <span
            className={`absolute left-[3px] top-1/2 -translate-y-1/2 ${thumbPixelStyles[size].size} rounded-full bg-white shadow-sm transition-transform duration-200 ${thumbPixelStyles[size].checked}`}
          />
        </span>
        {(label || description) && (
          <span className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {label}
              </span>
            )}
            {description && (
              <span id={descriptionId} className="text-xs text-slate-500 dark:text-slate-400">
                {description}
              </span>
            )}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
