import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { InlineBudgetSection } from "./inline-budget-section";

const mockAddToast = vi.fn();

vi.mock("@/stores/ui-store", () => ({
  useUiStore: (selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast }),
}));

// Mock BudgetTable so we can capture its onInlineSave callback
const { mockOnInlineSave } = vi.hoisted(() => ({
  mockOnInlineSave: { current: null as ((updated: Record<string, number>) => Promise<void>) | null },
}));

vi.mock("@/components/grants/budget-table", () => ({
  BudgetTable: ({ onInlineSave }: { onInlineSave?: (updated: Record<string, number>) => Promise<void> }) => {
    mockOnInlineSave.current = onInlineSave ?? null;
    return <div data-testid="budget-table" />;
  },
}));

describe("InlineBudgetSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnInlineSave.current = null;
  });

  it('renders "Budget Allocation" heading', () => {
    render(
      <InlineBudgetSection
        grantId="g1"
        budgets={{ personnel: 5000 }}
        totalAmount={10000}
      />
    );
    expect(screen.getByText("Budget Allocation")).toBeInTheDocument();
  });

  it("PATCH API call on inline save", async () => {
    const fetchSpy = vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    render(
      <InlineBudgetSection
        grantId="g1"
        budgets={{ personnel: 5000 }}
        totalAmount={10000}
      />
    );

    // Trigger the onInlineSave callback
    expect(mockOnInlineSave.current).not.toBeNull();
    await mockOnInlineSave.current!({ personnel: 8000 });

    expect(fetch).toHaveBeenCalledWith("/api/grants/g1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgets: { personnel: 8000 } }),
    });

    vi.unstubAllGlobals();
  });

  it("error toast when save fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    render(
      <InlineBudgetSection
        grantId="g1"
        budgets={{ personnel: 5000 }}
        totalAmount={10000}
      />
    );

    await expect(mockOnInlineSave.current!({ personnel: 8000 })).rejects.toThrow("Save failed");
    expect(mockAddToast).toHaveBeenCalledWith({ type: "error", title: "Failed to save budget changes" });

    vi.unstubAllGlobals();
  });
});
