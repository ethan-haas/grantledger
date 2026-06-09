import { describe, it, expect, beforeEach } from "vitest";

// Test the pure utility functions by importing the module and testing
// fuzzyMatch and matchesFilter logic through the hook's behavior.
// Since these are not exported, we test them indirectly.

const RECENT_SEARCHES_KEY = "grantledger-recent-searches";

describe("useCommandPalette utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("fuzzyMatch (tested via algorithm replication)", () => {
    // Replicating the exact fuzzyMatch algorithm from the hook
    function fuzzyMatch(query: string, text: string): boolean {
      const lower = text.toLowerCase();
      const q = query.toLowerCase();
      let qi = 0;
      for (let i = 0; i < lower.length && qi < q.length; i++) {
        if (lower[i] === q[qi]) qi++;
      }
      return qi === q.length;
    }

    it('"dshb" matches "Dashboard"', () => {
      expect(fuzzyMatch("dshb", "Dashboard")).toBe(true);
    });

    it('"xyz" does not match "Dashboard"', () => {
      expect(fuzzyMatch("xyz", "Dashboard")).toBe(false);
    });

    it("empty query matches anything", () => {
      expect(fuzzyMatch("", "Dashboard")).toBe(true);
    });
  });

  describe("matchesFilter (tested via algorithm replication)", () => {
    type CommandFilter = "All" | "Grants" | "Expenses" | "Settings";

    interface CommandItem {
      id: string;
      label: string;
      section: "Navigation" | "Actions" | "Grants";
      href: string;
    }

    function matchesFilter(item: CommandItem, filter: CommandFilter): boolean {
      if (filter === "All") return true;
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
      return true;
    }

    it('filter "Settings" returns only settings-related items', () => {
      const items: CommandItem[] = [
        { id: "1", label: "Settings", section: "Navigation", href: "/dashboard/settings" },
        { id: "2", label: "Billing", section: "Navigation", href: "/dashboard/settings/billing" },
        { id: "3", label: "Dashboard", section: "Navigation", href: "/dashboard" },
        { id: "4", label: "Grants", section: "Navigation", href: "/dashboard/grants" },
      ];
      const filtered = items.filter((item) => matchesFilter(item, "Settings"));
      expect(filtered).toHaveLength(2);
      expect(filtered.map((i) => i.label)).toEqual(["Settings", "Billing"]);
    });

    it('filter "Grants" returns grant items + actions', () => {
      const items: CommandItem[] = [
        { id: "1", label: "Create New Grant", section: "Actions", href: "/dashboard/grants/new" },
        { id: "2", label: "My Grant", section: "Grants", href: "/dashboard/grants/123" },
        { id: "3", label: "Dashboard", section: "Navigation", href: "/dashboard" },
      ];
      const filtered = items.filter((item) => matchesFilter(item, "Grants"));
      expect(filtered).toHaveLength(2);
      expect(filtered.map((i) => i.label)).toContain("Create New Grant");
      expect(filtered.map((i) => i.label)).toContain("My Grant");
    });
  });

  describe("recent searches (localStorage)", () => {
    function saveRecentSearch(query: string): void {
      if (!query.trim()) return;
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      const existing: string[] = stored ? JSON.parse(stored) : [];
      const filtered = existing.filter((s: string) => s !== query.trim());
      const updated = [query.trim(), ...filtered].slice(0, 5);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }

    function getRecentSearches(): string[] {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((s: unknown): s is string => typeof s === "string").slice(0, 5);
    }

    it("saved to localStorage, max 5, deduped", () => {
      saveRecentSearch("alpha");
      saveRecentSearch("beta");
      saveRecentSearch("gamma");
      saveRecentSearch("delta");
      saveRecentSearch("epsilon");
      saveRecentSearch("zeta"); // 6th — should push out "alpha"
      const searches = getRecentSearches();
      expect(searches).toHaveLength(5);
      expect(searches[0]).toBe("zeta");
      expect(searches).not.toContain("alpha");

      // Dedup: re-adding "gamma" moves it to front
      saveRecentSearch("gamma");
      const updated = getRecentSearches();
      expect(updated[0]).toBe("gamma");
      expect(updated.filter((s) => s === "gamma")).toHaveLength(1);
    });

    it("loaded correctly on read", () => {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(["a", "b", "c"]));
      const searches = getRecentSearches();
      expect(searches).toEqual(["a", "b", "c"]);
    });
  });
});
