import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/navigation
const mockPathname = vi.fn<() => string>();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock zustand ui-store
const mockSetSidebarOpen = vi.fn();
vi.mock("@/stores/ui-store", () => ({
  useUiStore: () => ({
    setSidebarOpen: mockSetSidebarOpen,
  }),
}));

import { MobileNav } from "./mobile-nav";

describe("MobileNav", () => {
  beforeEach(() => {
    mockSetSidebarOpen.mockClear();
  });

  it("renders navigation with Overview, Grants, Settings, and Search", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<MobileNav />);

    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(nav).toBeInTheDocument();

    // Overview is active, so it should show its label
    expect(screen.getByText("Overview")).toBeInTheDocument();
    // Search button should be present
    expect(screen.getByRole("button", { name: "Open search" })).toBeInTheDocument();
  });

  it("shows active label for Overview when on /dashboard", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<MobileNav />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  it("shows active label for Grants when on /dashboard/grants", () => {
    mockPathname.mockReturnValue("/dashboard/grants");
    render(<MobileNav />);
    expect(screen.getByText("Grants")).toBeInTheDocument();
  });

  it("shows active label for Settings when on /dashboard/settings", () => {
    mockPathname.mockReturnValue("/dashboard/settings");
    render(<MobileNav />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("dispatches keyboard event on search button click", () => {
    mockPathname.mockReturnValue("/dashboard");
    const dispatchSpy = vi.spyOn(document, "dispatchEvent");

    render(<MobileNav />);
    const searchButton = screen.getByRole("button", { name: "Open search" });
    fireEvent.click(searchButton);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "keydown",
        key: "k",
      })
    );

    dispatchSpy.mockRestore();
  });

  it("has md:hidden class for mobile-only visibility", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<MobileNav />);
    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(nav.className).toContain("md:hidden");
  });

  it("has z-sidebar for proper stacking", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<MobileNav />);
    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(nav.className).toContain("z-sidebar");
  });

  it("applies dark mode classes", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<MobileNav />);
    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(nav.className).toContain("dark:bg-slate-900");
  });
});
