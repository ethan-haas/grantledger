"use client";

import { useState, type ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  className = "",
}: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const headingId = `form-section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`border-b border-slate-200 pb-6 dark:border-slate-700 ${className}`}
    >
      <div className="mb-4">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls={`${headingId}-content`}
            className="flex w-full items-center justify-between text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 rounded-md"
          >
            <div>
              <h3
                id={headingId}
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                {title}
              </h3>
              {description && (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        ) : (
          <div>
            <h3
              id={headingId}
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {collapsible ? (
        <div
          id={`${headingId}-content`}
          role="region"
          aria-labelledby={headingId}
          hidden={!open}
          className={open ? "space-y-4" : ""}
        >
          {open && children}
        </div>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </section>
  );
}
