"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export type CommandFilter = "All" | "Grants" | "Expenses" | "Settings";

interface CommandItem {
  id: string;
  label: string;
  section: "Navigation" | "Actions" | "Grants";
  href: string;
  icon?: string;
}

const STATIC_ITEMS: CommandItem[] = [
  { id: "nav-dashboard", label: "Dashboard", section: "Navigation", href: "/dashboard" },
  { id: "nav-grants", label: "Grants", section: "Navigation", href: "/dashboard/grants" },
  { id: "nav-settings", label: "Settings", section: "Navigation", href: "/dashboard/settings" },
  { id: "nav-billing", label: "Billing", section: "Navigation", href: "/dashboard/settings/billing" },
  { id: "nav-connections", label: "Connections", section: "Navigation", href: "/dashboard/settings/connections" },
  { id: "nav-export", label: "Export Data", section: "Navigation", href: "/dashboard/settings/export" },
  { id: "nav-notifications", label: "Notifications", section: "Navigation", href: "/dashboard/settings/notifications" },
  { id: "nav-team", label: "Team", section: "Navigation", href: "/dashboard/settings/team" },
  { id: "act-new-grant", label: "Create New Grant", section: "Actions", href: "/dashboard/grants/new" },
];

const RECENT_SEARCHES_KEY = "grantledger-recent-searches";
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string").slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): void {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const existing = getRecentSearches();
    const filtered = existing.filter((s) => s !== query.trim());
    const updated = [query.trim(), ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be full or restricted
  }
}

const FILTER_SECTION_MAP: Record<CommandFilter, string[] | null> = {
  All: null,
  Grants: ["Grants", "Actions"],
  Expenses: ["Navigation"],
  Settings: ["Navigation"],
};

const FILTER_KEYWORD_MAP: Record<CommandFilter, string[] | null> = {
  All: null,
  Grants: null,
  Expenses: ["expense", "import", "export"],
  Settings: ["settings", "billing", "connections", "notifications", "team", "export"],
};

function matchesFilter(item: CommandItem, filter: CommandFilter): boolean {
  if (filter === "All") return true;

  const sections = FILTER_SECTION_MAP[filter];
  const keywords = FILTER_KEYWORD_MAP[filter];

  if (filter === "Grants") {
    return item.section === "Grants" || item.section === "Actions" || item.label.toLowerCase().includes("grant");
  }

  if (filter === "Expenses") {
    const lowerLabel = item.label.toLowerCase();
    return lowerLabel.includes("expense") || lowerLabel.includes("import") || lowerLabel.includes("export");
  }

  if (filter === "Settings") {
    const lowerHref = item.href.toLowerCase();
    return lowerHref.includes("/settings") || item.label.toLowerCase().includes("setting");
  }

  if (sections && !sections.includes(item.section)) return false;
  if (keywords) {
    const lowerLabel = item.label.toLowerCase();
    return keywords.some((kw) => lowerLabel.includes(kw));
  }

  return true;
}

function fuzzyMatch(query: string, text: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function useCommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [grantItems, setGrantItems] = useState<CommandItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<CommandFilter>("All");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const grantsLoadedRef = useRef(false);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
    setSelectedIndex(0);
    setActiveFilter("All");
    setRecentSearches(getRecentSearches());
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
    setActiveFilter("All");
  }, []);

  // Fetch grants when palette opens
  useEffect(() => {
    if (!isOpen || grantsLoadedRef.current) return;

    const controller = new AbortController();
    fetch("/api/grants?page=1&pageSize=20", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) return null;
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (!data?.grants) return;
        const items: CommandItem[] = data.grants.map((g: { id: string; name: string }) => ({
          id: `grant-${g.id}`,
          label: g.name,
          section: "Grants" as const,
          href: `/dashboard/grants/${g.id}`,
        }));
        setGrantItems(items);
        grantsLoadedRef.current = true;
      })
      .catch(() => {/* non-critical */});

    return () => controller.abort();
  }, [isOpen]);

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, open, close]);

  const allItems = [...STATIC_ITEMS, ...grantItems];
  const filteredByTab = allItems.filter((item) => matchesFilter(item, activeFilter));
  const results = query
    ? filteredByTab.filter((item) => fuzzyMatch(query, item.label))
    : filteredByTab;

  // Clamp selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeFilter]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }
      router.push(results[selectedIndex].href);
      close();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  function select(index: number) {
    if (results[index]) {
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }
      router.push(results[index].href);
      close();
    }
  }

  function applyRecentSearch(search: string) {
    setQuery(search);
  }

  return {
    isOpen,
    open,
    close,
    query,
    setQuery,
    results,
    selectedIndex,
    onKeyDown,
    select,
    activeFilter,
    setActiveFilter,
    recentSearches,
    applyRecentSearch,
  };
}
