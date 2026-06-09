"use client";

import { useState, useRef, useEffect, useId, type ReactNode } from "react";

interface InfoPopoverProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function InfoPopover({ title, children, className = "" }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Focus first focusable element in popover when opened
  useEffect(() => {
    if (open && popoverRef.current) {
      const firstFocusable = popoverRef.current.querySelector<HTMLElement>(
        "a, button, input, [tabindex]:not([tabindex='-1'])"
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [open]);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={id}
        className="inline-flex h-6 w-6 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        aria-label={`More info about ${title}`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      </button>

      {open && (
        <div
          ref={popoverRef}
          id={id}
          role="dialog"
          aria-label={title}
          className="absolute left-0 top-full z-dropdown mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            {children}
          </div>
        </div>
      )}
    </span>
  );
}
