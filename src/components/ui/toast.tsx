"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useUiStore, type Toast } from "@/stores/ui-store";

const DEFAULT_DURATIONS: Record<Toast["type"], number> = {
  success: 3000,
  error: 8000,
  warning: 5000,
  info: 5000,
};

const icons: Record<Toast["type"], JSX.Element> = {
  success: (
    <svg className="h-5 w-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const bgStyles: Record<Toast["type"], string> = {
  success: "bg-white border-success-200 dark:bg-slate-800 dark:border-success-700",
  error: "bg-white border-danger-200 dark:bg-slate-800 dark:border-danger-700",
  warning: "bg-white border-warning-200 dark:bg-slate-800 dark:border-warning-700",
  info: "bg-white border-primary-200 dark:bg-slate-800 dark:border-primary-700",
};

const progressColors: Record<Toast["type"], string> = {
  success: "bg-success-500",
  error: "bg-danger-500",
  warning: "bg-warning-500",
  info: "bg-primary-500",
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useUiStore((s) => s.removeToast);
  const prefersReduced = useReducedMotion();
  const duration = toast.duration ?? DEFAULT_DURATIONS[toast.type];
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, toast.duration, duration, removeToast]);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.animationDuration = `${duration}ms`;
    }
  }, [duration]);

  const motionProps = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, x: 80, scale: 0.95 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 80, scale: 0.95 },
        transition: { duration: 0.25, ease: "easeOut" as const },
      };

  return (
    <motion.div
      layout
      {...motionProps}
      className={`relative overflow-hidden rounded-xl border p-4 shadow-soft ${bgStyles[toast.type]}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{toast.title}</p>
          {toast.message && (
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{toast.message}</p>
          )}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                removeToast(toast.id);
              }}
              className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="ml-2 flex-shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:text-slate-400 dark:hover:bg-slate-700"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
        <div
          ref={progressRef}
          className={`h-full ${progressColors[toast.type]} origin-left`}
          style={{ animation: `shrinkWidth ${duration}ms linear forwards` }}
        />
      </div>
      <style>{`
        @keyframes shrinkWidth { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="fixed bottom-20 right-4 z-toast flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2 md:bottom-4 md:w-80" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
