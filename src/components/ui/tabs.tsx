"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from "react";

type TabVariant = "underline" | "pills" | "enclosed";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: TabVariant;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab components must be used within <Tabs>");
  return ctx;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabVariant;
  className?: string;
  children: ReactNode;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  variant = "underline",
  className = "",
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const baseId = useId();

  const activeTab = value ?? internalValue;
  const setActiveTab = useCallback(
    (id: string) => {
      if (!value) setInternalValue(id);
      onValueChange?.(id);
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  className?: string;
  children: ReactNode;
}

const listVariantStyles: Record<TabVariant, string> = {
  underline: "border-b border-slate-200 dark:border-slate-700",
  pills: "gap-1",
  enclosed:
    "border-b border-slate-200 dark:border-slate-700",
};

export function TabList({ className = "", children }: TabListProps) {
  const { variant } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = listRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]:not([disabled])'
    );
    if (!tabs || tabs.length === 0) return;

    const currentIndex = Array.from(tabs).findIndex(
      (tab) => tab === document.activeElement
    );
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      e.preventDefault();
    } else if (e.key === "Home") {
      nextIndex = 0;
      e.preventDefault();
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
      e.preventDefault();
    } else {
      return;
    }

    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={`flex ${listVariantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

interface TabTriggerProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

const triggerBase =
  "relative inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:pointer-events-none disabled:opacity-50";

const triggerVariantStyles: Record<TabVariant, { active: string; inactive: string }> = {
  underline: {
    active:
      "border-b-2 border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-400 px-4 py-2.5 -mb-px",
    inactive:
      "border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600 px-4 py-2.5 -mb-px",
  },
  pills: {
    active:
      "bg-primary-600 text-white shadow-sm dark:bg-primary-500 rounded-lg px-3.5 py-2",
    inactive:
      "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 rounded-lg px-3.5 py-2",
  },
  enclosed: {
    active:
      "bg-white border border-slate-200 border-b-white text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:border-b-slate-800 dark:text-slate-100 rounded-t-lg px-4 py-2.5 -mb-px",
    inactive:
      "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 border border-transparent px-4 py-2.5 -mb-px",
  },
};

export function TabTrigger({ value, disabled, className = "", children }: TabTriggerProps) {
  const { activeTab, setActiveTab, variant, baseId } = useTabsContext();
  const isActive = activeTab === value;
  const styles = triggerVariantStyles[variant];

  return (
    <button
      role="tab"
      type="button"
      id={`${baseId}-tab-${value}`}
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={`${triggerBase} ${isActive ? styles.active : styles.inactive} ${className}`}
    >
      {children}
    </button>
  );
}

interface TabPanelProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export function TabPanel({ value, className = "", children }: TabPanelProps) {
  const { activeTab, baseId } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={`animate-fadeIn ${className}`}
    >
      {children}
    </div>
  );
}
