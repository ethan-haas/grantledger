import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
vi.mock("@/stores/ui-store", () => ({
  useUiStore: () => ({
    sidebarOpen: true,
    setSidebarOpen: vi.fn(),
  }),
}));

import { Sidebar } from "./sidebar";

describe("Sidebar", () => {
  it("renders nav links (Overview, Grants, Settings)", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<Sidebar />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Grants")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows trial indicator when trialDaysRemaining provided", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<Sidebar trialDaysRemaining={7} subscriptionStatus="trialing" />);
    expect(screen.getByText("Free Trial")).toBeInTheDocument();
    expect(screen.getByText("7 days left")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("active nav item has correct styling", () => {
    mockPathname.mockReturnValue("/dashboard/grants");
    render(<Sidebar />);
    const grantsLink = screen.getByText("Grants").closest("a");
    expect(grantsLink?.className).toContain("bg-primary-50");
    expect(grantsLink?.className).toContain("text-primary-700");

    const overviewLink = screen.getByText("Overview").closest("a");
    expect(overviewLink?.className).not.toContain("bg-primary-50");
  });
});
