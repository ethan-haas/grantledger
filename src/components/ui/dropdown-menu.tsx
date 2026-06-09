"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

/* ─── Context ────────────────────────────────────────────────── */

interface DropdownContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("DropdownMenu components must be used within <DropdownMenu>");
  return ctx;
}

/* ─── Root ───────────────────────────────────────────────────── */

interface DropdownMenuProps {
  children: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownContext.Provider>
  );
}

/* ─── Trigger ────────────────────────────────────────────────── */

interface DropdownTriggerProps {
  className?: string;
  children: ReactNode;
  asChild?: boolean;
}

export function DropdownTrigger({ className = "", children }: DropdownTriggerProps) {
  const { open, setOpen, triggerRef } = useDropdown();

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={() => setOpen(!open)}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </button>
  );
}

/* ─── Content ────────────────────────────────────────────────── */

type Align = "start" | "end";

interface DropdownContentProps {
  align?: Align;
  className?: string;
  children: ReactNode;
}

export function DropdownContent({ align = "end", className = "", children }: DropdownContentProps) {
  const { open, setOpen, triggerRef } = useDropdown();
  const contentRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, setOpen, triggerRef]);

  // Focus first item on open
  useEffect(() => {
    if (!open || !contentRef.current) return;
    const firstItem = contentRef.current.querySelector<HTMLElement>('[role="menuitem"]');
    if (firstItem) requestAnimationFrame(() => firstItem.focus());
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const items = contentRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])'
      );
      if (!items || items.length === 0) return;

      const currentIndex = Array.from(items).findIndex((el) => el === document.activeElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = (currentIndex + 1) % items.length;
        items[next].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (currentIndex - 1 + items.length) % items.length;
        items[prev].focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1].focus();
      }
    },
    [setOpen, triggerRef]
  );

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      role="menu"
      onKeyDown={handleKeyDown}
      className={`absolute z-dropdown mt-1 min-w-[180px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-soft-lg animate-scaleIn origin-top-right dark:border-slate-700 dark:bg-slate-800 ${
        align === "end" ? "right-0" : "left-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Item ───────────────────────────────────────────────────── */

interface DropdownItemProps {
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: ReactNode;
  description?: string;
  className?: string;
  children: ReactNode;
}

export function DropdownItem({
  onSelect,
  disabled = false,
  danger = false,
  icon,
  description,
  className = "",
  children,
}: DropdownItemProps) {
  const { setOpen } = useDropdown();

  const handleClick = (e: MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    onSelect?.();
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.();
      setOpen(false);
    }
  };

  const baseColor = danger
    ? "text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/30"
    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60";

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex items-start gap-2 rounded-md px-2.5 py-2 text-sm outline-none cursor-pointer transition-colors duration-150 focus-visible:bg-slate-100 dark:focus-visible:bg-slate-700/60 ${baseColor} ${
        disabled ? "pointer-events-none opacity-50" : ""
      } ${className}`}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block font-medium">{children}</span>
        {description && (
          <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>
        )}
      </span>
    </div>
  );
}

/* ─── Separator ──────────────────────────────────────────────── */

export function DropdownSeparator() {
  return <div role="separator" className="my-1 -mx-1 h-px bg-slate-200 dark:bg-slate-700" />;
}

/* ─── Header ─────────────────────────────────────────────────── */

interface DropdownHeaderProps {
  className?: string;
  children: ReactNode;
}

export function DropdownHeader({ className = "", children }: DropdownHeaderProps) {
  return (
    <div className={`px-2.5 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 ${className}`}>
      {children}
    </div>
  );
}
