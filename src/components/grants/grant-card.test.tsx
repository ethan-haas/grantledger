import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GrantCard } from "./grant-card";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockAddToast = vi.fn();
vi.mock("@/stores/ui-store", () => ({
  useUiStore: (selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast }),
}));

vi.mock("@/lib/posthog", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("./framework-badge", () => ({
  FrameworkBadge: ({ framework }: { framework: string }) => (
    <span data-testid="framework-badge">{framework}</span>
  ),
}));

// Mock HTMLDialogElement methods for jsdom
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = vi.fn();
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = vi.fn();
}

const defaultProps = {
  id: "grant-abc",
  name: "Education Innovation Grant",
  funding_agency: "Dept of Education",
  period_start: "2024-01-01",
  period_end: "2025-12-31",
  total_amount: 500000,
  omb_framework: "post_oct_2024" as const,
  status: "active",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GrantCard", () => {
  it("renders grant name, agency, amount, framework badge", () => {
    render(<GrantCard {...defaultProps} />);
    expect(screen.getByText("Education Innovation Grant")).toBeInTheDocument();
    expect(screen.getByText("Dept of Education")).toBeInTheDocument();
    expect(screen.getByText("$500,000.00")).toBeInTheDocument();
    expect(screen.getByTestId("framework-badge")).toHaveTextContent("post_oct_2024");
  });

  it("links to grant detail page", () => {
    render(<GrantCard {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/grants/grant-abc");
  });

  it("actions menu hidden by default when showActions=false", () => {
    render(<GrantCard {...defaultProps} showActions={false} />);
    expect(screen.queryByLabelText(/Actions for/)).not.toBeInTheDocument();
  });

  it("actions menu toggle opens/closes dropdown", () => {
    render(<GrantCard {...defaultProps} showActions />);
    const menuBtn = screen.getByLabelText("Actions for Education Innovation Grant");
    expect(menuBtn).toBeInTheDocument();

    // Open menu
    fireEvent.click(menuBtn);
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();

    // Close menu by clicking button again
    fireEvent.click(menuBtn);
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });
});
