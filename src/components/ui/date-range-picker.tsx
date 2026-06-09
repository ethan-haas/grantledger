"use client";

import { useState, useCallback, useEffect, type ChangeEvent } from "react";

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange?: (range: { startDate: string; endDate: string }) => void;
  grantPeriodStart?: string;
  grantPeriodEnd?: string;
  label?: string;
  error?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

function getQuarterRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const startMonth = quarter * 3;
  const start = new Date(now.getFullYear(), startMonth, 1);
  const end = new Date(now.getFullYear(), startMonth + 3, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function getLast30Days(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export function DateRangePicker({
  startDate = "",
  endDate = "",
  onChange,
  grantPeriodStart,
  grantPeriodEnd,
  label,
  error,
  id,
  className = "",
  disabled = false,
}: DateRangePickerProps) {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setLocalStart(startDate);
  }, [startDate]);

  useEffect(() => {
    setLocalEnd(endDate);
  }, [endDate]);

  const validate = useCallback((start: string, end: string): string | null => {
    if (start && end && start > end) {
      return "End date must be after start date";
    }
    return null;
  }, []);

  const emitChange = useCallback(
    (start: string, end: string) => {
      const err = validate(start, end);
      setValidationError(err);
      if (!err) {
        onChange?.({ startDate: start, endDate: end });
      }
    },
    [onChange, validate]
  );

  const handleStartChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalStart(val);
      emitChange(val, localEnd);
    },
    [localEnd, emitChange]
  );

  const handleEndChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalEnd(val);
      emitChange(localStart, val);
    },
    [localStart, emitChange]
  );

  const applyPreset = useCallback(
    (range: { startDate: string; endDate: string }) => {
      setLocalStart(range.startDate);
      setLocalEnd(range.endDate);
      setValidationError(null);
      onChange?.(range);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setLocalStart("");
    setLocalEnd("");
    setValidationError(null);
    onChange?.({ startDate: "", endDate: "" });
  }, [onChange]);

  const displayError = error || validationError;
  const startId = id ? `${id}-start` : undefined;
  const endId = id ? `${id}-end` : undefined;

  const inputClass = `block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-500 ${
    displayError
      ? "border-danger-500 bg-danger-50/50 dark:bg-danger-700/10 focus:ring-danger-500/30 focus:border-danger-500"
      : "border-slate-300 dark:border-slate-600"
  }`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2" role="group" aria-label={label || "Date range"}>
        <input
          type="date"
          id={startId}
          value={localStart}
          onChange={handleStartChange}
          disabled={disabled}
          aria-label="Start date"
          aria-invalid={displayError ? true : undefined}
          className={inputClass}
        />
        <span className="text-sm text-slate-500 dark:text-slate-400 select-none" aria-hidden="true">
          &ndash;
        </span>
        <input
          type="date"
          id={endId}
          value={localEnd}
          onChange={handleEndChange}
          disabled={disabled}
          aria-label="End date"
          aria-invalid={displayError ? true : undefined}
          className={inputClass}
        />
        {(localStart || localEnd) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear date range"
            className="rounded-lg p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-2 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => applyPreset(getLast30Days())}
          disabled={disabled}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last 30 days
        </button>
        <button
          type="button"
          onClick={() => applyPreset(getQuarterRange())}
          disabled={disabled}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          This quarter
        </button>
        {grantPeriodStart && grantPeriodEnd && (
          <button
            type="button"
            onClick={() =>
              applyPreset({ startDate: grantPeriodStart, endDate: grantPeriodEnd })
            }
            disabled={disabled}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Grant period
          </button>
        )}
      </div>
      {displayError && (
        <p id={id ? `${id}-error` : undefined} className="mt-1 text-xs text-danger-600 dark:text-danger-400">
          {displayError}
        </p>
      )}
    </div>
  );
}
