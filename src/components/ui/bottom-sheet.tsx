"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  useEffect(() => {
    if (open && sheetRef.current) {
      const firstFocusable = sheetRef.current.querySelector<HTMLElement>(
        "button, a, input, [tabindex]:not([tabindex='-1'])",
      );
      firstFocusable?.focus();
    }
  }, [open]);

  const motionProps = prefersReduced
    ? {}
    : {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
        transition: { type: "spring" as const, damping: 30, stiffness: 300 },
      };

  const overlayMotion = prefersReduced
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            {...overlayMotion}
            className="fixed inset-0 z-modal-overlay bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            {...motionProps}
            role="dialog"
            aria-modal="true"
            aria-label={title || "Action sheet"}
            className="fixed inset-x-0 bottom-0 z-modal rounded-t-2xl border-t border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            {title && (
              <div className="border-b border-slate-200 px-4 pb-3 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
              </div>
            )}

            <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
