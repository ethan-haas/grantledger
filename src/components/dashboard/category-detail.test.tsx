import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CategoryDetail } from "./category-detail";

// Mock CategoryPill
vi.mock("@/components/expenses/category-pill", () => ({
  CategoryPill: ({ category }: { category: string }) => (
    <span data-testid="category-pill">{category}</span>
  ),
}));

const mockExpenses = [
  { id: "exp-1", date: "2024-06-15", vendor: "Acme Corp", description: "Supplies", amount: 250.5 },
  { id: "exp-2", date: "2024-07-01", vendor: "Office Depot", description: "Paper", amount: 125 },
];

function mockFetchSuccess(expenses: unknown[] = mockExpenses): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve({ expenses }),
  }));
}

function mockFetchError(): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: false,
    headers: new Headers({ "content-type": "application/json" }),
  }));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("CategoryDetail", () => {
  it("shows loading skeletons initially", () => {
    // Fetch never resolves
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    const { container } = render(
      <CategoryDetail grantId="g1" category="supplies" onClose={vi.fn()} />
    );
    // Skeleton elements use animate-shimmer class
    const skeletons = container.querySelectorAll("[class*='animate-shimmer']");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("renders expense data after fetch", async () => {
    mockFetchSuccess();
    render(<CategoryDetail grantId="g1" category="supplies" onClose={vi.fn()} />);
    await waitFor(() => {
      // Both mobile cards and desktop table render vendor — use getAllByText
      expect(screen.getAllByText("Acme Corp").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText("$250.50").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Office Depot").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty message when no expenses", async () => {
    mockFetchSuccess([]);
    render(<CategoryDetail grantId="g1" category="supplies" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("No confirmed expenses in this category.")).toBeInTheDocument();
    });
  });

  it("shows error + retry button on fetch failure", async () => {
    mockFetchError();
    render(<CategoryDetail grantId="g1" category="supplies" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load expenses")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Retry loading expenses")).toBeInTheDocument();
  });

  it("close button calls onClose", async () => {
    mockFetchSuccess([]);
    const onClose = vi.fn();
    render(<CategoryDetail grantId="g1" category="supplies" onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Close category details")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Close category details"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
