"use client";

import { forwardRef, useState, useCallback, type FocusEvent, type ChangeEvent } from "react";
import type { InputProps } from "./input";

interface CurrencyInputProps extends Omit<InputProps, "value" | "onChange" | "prefix" | "suffix" | "type"> {
  value?: number | null;
  onChange?: (value: number | null) => void;
  allowNegative?: boolean;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseRawValue(raw: string, allowNegative: boolean): number | null {
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return null;
  if (!allowNegative && parsed < 0) return 0;
  return Math.round(parsed * 100) / 100;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, allowNegative = false, onFocus, onBlur, label, hint, error, success, className = "", id, disabled, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [rawValue, setRawValue] = useState("");

    const displayValue = focused
      ? rawValue
      : value != null
        ? formatCurrency(value)
        : "";

    const handleFocus = useCallback(
      (e: FocusEvent<HTMLInputElement>) => {
        setFocused(true);
        setRawValue(value != null ? String(value) : "");
        onFocus?.(e);
      },
      [value, onFocus]
    );

    const handleBlur = useCallback(
      (e: FocusEvent<HTMLInputElement>) => {
        setFocused(false);
        const parsed = parseRawValue(rawValue, allowNegative);
        onChange?.(parsed);
        onBlur?.(e);
      },
      [rawValue, allowNegative, onChange, onBlur]
    );

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setRawValue(val);
        const parsed = parseRawValue(val, allowNegative);
        onChange?.(parsed);
      },
      [allowNegative, onChange]
    );

    const borderClass = error
      ? "border-danger-500 bg-danger-50/50 dark:bg-danger-700/10 focus-within:ring-danger-500/30 focus-within:border-danger-500"
      : success
        ? "border-success-500 bg-success-50/50 focus-within:ring-success-500/30 focus-within:border-success-500 dark:bg-success-700/10"
        : "border-slate-300 dark:border-slate-600";

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
        <div
          className={`flex items-center rounded-lg border text-sm transition-colors duration-150 hover:border-slate-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-500 dark:bg-slate-800 dark:hover:border-slate-500 ${borderClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className="flex items-center pl-3 text-slate-500 dark:text-slate-400 select-none" aria-hidden="true">
            $
          </span>
          <input
            ref={ref}
            id={id}
            type="text"
            inputMode="decimal"
            aria-describedby={error && id ? `${id}-error` : undefined}
            aria-invalid={error ? true : undefined}
            aria-label={!label ? "Currency amount" : undefined}
            disabled={disabled}
            value={displayValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder="0.00"
            className={`block w-full bg-transparent pl-1.5 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 ${className}`}
            {...props}
          />
          {success && (
            <span className="flex items-center pr-3 text-success-500" aria-hidden="true">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
        {error && (
          <p id={id ? `${id}-error` : undefined} className="mt-1 text-xs text-danger-600 dark:text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
