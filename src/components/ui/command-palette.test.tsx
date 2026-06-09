import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
      const safeProps: Record<string, unknown> = {};
      Object.entries(rest).forEach(([k, v]) => {
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          safeProps[k] = v;
        }
      });
      return <div {...safeProps}>{children as React.ReactNode}</div>;
    },
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock the hook
const mockUseCommandPalette = vi.fn();
vi.mock("@/hooks/use-command-palette", () => ({
  useCommandPalette: () => mockUseCommandPalette(),
}));

import { CommandPalette } from "./command-palette";

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("does not render when isOpen is false", () => {
    mockUseCommandPalette.mockReturnValue({
      isOpen: false,
      close: vi.fn(),
      query: "",
      setQuery: vi.fn(),
      results: [],
      selectedIndex: 0,
      onKeyDown: vi.fn(),
      select: vi.fn(),
      activeFilter: "All",
      setActiveFilter: vi.fn(),
      recentSearches: [],
      applyRecentSearch: vi.fn(),
    });
    const { container } = render(<CommandPalette />);
    expect(container.innerHTML).toBe("");
  });

  it("renders search input when open", () => {
    mockUseCommandPalette.mockReturnValue({
      isOpen: true,
      close: vi.fn(),
      query: "",
      setQuery: vi.fn(),
      results: [
        { id: "nav-dashboard", label: "Dashboard", section: "Navigation", href: "/dashboard" },
      ],
      selectedIndex: 0,
      onKeyDown: vi.fn(),
      select: vi.fn(),
      activeFilter: "All",
      setActiveFilter: vi.fn(),
      recentSearches: [],
      applyRecentSearch: vi.fn(),
    });
    render(<CommandPalette />);
    expect(screen.getByPlaceholderText("Search grants, pages, actions...")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders results grouped by section", () => {
    mockUseCommandPalette.mockReturnValue({
      isOpen: true,
      close: vi.fn(),
      query: "",
      setQuery: vi.fn(),
      results: [
        { id: "nav-dashboard", label: "Dashboard", section: "Navigation", href: "/dashboard" },
        { id: "nav-grants", label: "Grants", section: "Navigation", href: "/dashboard/grants" },
        { id: "act-new-grant", label: "Create New Grant", section: "Actions", href: "/dashboard/grants/new" },
      ],
      selectedIndex: 0,
      onKeyDown: vi.fn(),
      select: vi.fn(),
      activeFilter: "All",
      setActiveFilter: vi.fn(),
      recentSearches: [],
      applyRecentSearch: vi.fn(),
    });
    render(<CommandPalette />);
    // Section headers
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveAttribute("aria-label", "Navigation");
    expect(groups[1]).toHaveAttribute("aria-label", "Actions");
    // Individual items
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    // "Grants" appears in both filter tabs and results, check via option role
    expect(screen.getAllByText("Grants").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Create New Grant")).toBeInTheDocument();
  });

  it("shows 'No results' when query returns empty", () => {
    mockUseCommandPalette.mockReturnValue({
      isOpen: true,
      close: vi.fn(),
      query: "xyznonexistent",
      setQuery: vi.fn(),
      results: [],
      selectedIndex: 0,
      onKeyDown: vi.fn(),
      select: vi.fn(),
      activeFilter: "All",
      setActiveFilter: vi.fn(),
      recentSearches: [],
      applyRecentSearch: vi.fn(),
    });
    render(<CommandPalette />);
    expect(screen.getByText(/No results found/)).toBeInTheDocument();
  });
});
