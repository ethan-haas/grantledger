import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "g1" }),
}));

// Mock UI store
const mockAddToast = vi.fn();
vi.mock("@/stores/ui-store", () => ({
  useUiStore: (selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast }),
}));

// Mock posthog
vi.mock("@/lib/posthog", () => ({
  trackEvent: vi.fn(),
}));

// Mock components that don't need testing in this context
vi.mock("@/components/ui/breadcrumbs", () => ({
  Breadcrumbs: () => <nav data-testid="breadcrumbs" />,
}));

vi.mock("@/components/ui/sortable-header", () => ({
  SortableHeader: ({ label }: { label: string }) => <th data-testid={`sort-${label}`}>{label}</th>,
}));

vi.mock("@/components/expenses/confidence-badge", () => ({
  ConfidenceBadge: ({ confidence }: { confidence: string | null }) => (
    <span data-testid="confidence">{confidence}</span>
  ),
}));

vi.mock("@/components/expenses/threshold-warning", () => ({
  ThresholdWarning: () => null,
}));

vi.mock("@/components/ui/date-range-picker", () => ({
  DateRangePicker: () => <div data-testid="date-range-picker" />,
}));

vi.mock("@/components/ui/currency-input", () => ({
  CurrencyInput: () => <input data-testid="currency-input" />,
}));

vi.mock("@/components/ui/form-section", () => ({
  FormSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/divider", () => ({
  Divider: () => <hr />,
}));

import ExpensesPage from "./page";

function makeExpense(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "exp1",
    date: "2024-06-15",
    vendor: "Office Depot",
    description: "Office supplies",
    amount: 250.00,
    ai_category: "supplies",
    ai_confidence: "high",
    ai_cfr_citation: "200.453",
    confirmed_category: null,
    status: "pending_review",
    ...overrides,
  };
}

/** Creates a mock fetch that returns sequential responses. Later calls use the last response. */
function mockSequentialFetch(responses: Array<{ ok: boolean; data?: unknown; status?: number }>): ReturnType<typeof vi.fn> {
  let callIndex = 0;
  return vi.fn(() => {
    const resp = responses[Math.min(callIndex, responses.length - 1)];
    callIndex++;
    return Promise.resolve({
      ok: resp.ok,
      status: resp.ok ? 200 : (resp.status ?? 500),
      headers: { get: () => "application/json" },
      json: () => Promise.resolve(resp.data ?? {}),
    });
  });
}

describe("ExpensesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders loading skeletons during initial fetch", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<ExpensesPage />);
    expect(screen.getByText("Expenses")).toBeInTheDocument();
  });

  it("renders error card on fetch failure", async () => {
    vi.stubGlobal("fetch", mockSequentialFetch([
      { ok: true, data: {} },
      { ok: false },
    ]));
    render(<ExpensesPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(mockAddToast).toHaveBeenCalledWith({ type: "error", title: "Failed to load expenses" });
  });

  it("renders empty state with import CTA", async () => {
    vi.stubGlobal("fetch", mockSequentialFetch([
      { ok: true, data: {} },
      { ok: true, data: { expenses: [], total: 0, total_pages: 1 } },
    ]));
    render(<ExpensesPage />);
    await waitFor(() => {
      expect(screen.getByText("No expenses found")).toBeInTheDocument();
    });
    expect(screen.getByText("Import Expenses")).toBeInTheDocument();
  });

  it("renders expense list with financial data", async () => {
    const expenses = [
      makeExpense({ id: "e1", vendor: "ACME Corp", amount: 1500, status: "confirmed", confirmed_category: "personnel" }),
      makeExpense({ id: "e2", vendor: "Travel Inc", amount: 750.50, status: "pending_review" }),
    ];
    vi.stubGlobal("fetch", mockSequentialFetch([
      { ok: true, data: {} },
      { ok: true, data: { expenses, total: 2, total_pages: 1 } },
    ]));
    render(<ExpensesPage />);
    // Both desktop table and mobile cards render — use getAllByText
    await waitFor(() => {
      expect(screen.getAllByText("ACME Corp").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText("Travel Inc").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$1,500.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$750.50").length).toBeGreaterThanOrEqual(1);
  });

  it("displays total and pending counts", async () => {
    const expenses = [
      makeExpense({ id: "e1", vendor: "V1", status: "confirmed", confirmed_category: "personnel" }),
      makeExpense({ id: "e2", vendor: "V2", status: "pending_review" }),
      makeExpense({ id: "e3", vendor: "V3", status: "pending_review" }),
    ];
    vi.stubGlobal("fetch", mockSequentialFetch([
      { ok: true, data: {} },
      { ok: true, data: { expenses, total: 3, total_pages: 1 } },
    ]));
    render(<ExpensesPage />);
    await waitFor(() => {
      expect(screen.getByText(/3 total/)).toBeInTheDocument();
    });
    expect(screen.getByText(/2 pending review/)).toBeInTheDocument();
  });

  it("optimistic confirm updates status immediately", async () => {
    const expenses = [
      makeExpense({ id: "e1", vendor: "TestVendor", status: "pending_review", ai_category: "supplies" }),
    ];
    let patchResolve: ((v: unknown) => void) | undefined;
    const patchPromise = new Promise((resolve) => { patchResolve = resolve; });

    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ ok: true, headers: { get: () => "application/json" }, json: () => Promise.resolve({}) });
      if (callCount === 2) return Promise.resolve({ ok: true, headers: { get: () => "application/json" }, json: () => Promise.resolve({ expenses, total: 1, total_pages: 1 }) });
      return patchPromise;
    }) as unknown as typeof fetch);

    render(<ExpensesPage />);
    await waitFor(() => {
      expect(screen.getAllByText("TestVendor").length).toBeGreaterThanOrEqual(1);
    });

    // Click approve (desktop and mobile both render Approve buttons)
    const approveBtns = screen.getAllByLabelText(/approve expense from/i);
    fireEvent.click(approveBtns[0]);

    // Optimistic update: Confirmed badge appears (text also exists in status filter <option>)
    await waitFor(() => {
      const confirmed = screen.getAllByText("Confirmed");
      // Should have at least 2: one in filter dropdown option + one Badge from optimistic update
      expect(confirmed.length).toBeGreaterThanOrEqual(2);
    });

    // Resolve the PATCH
    patchResolve!({ ok: true, headers: { get: () => "application/json" }, json: () => Promise.resolve({}) });
  });

  it("rolls back optimistic confirm on API failure", async () => {
    const expenses = [
      makeExpense({ id: "e1", vendor: "FailVendor", status: "pending_review", ai_category: "supplies" }),
    ];

    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ ok: true, headers: { get: () => "application/json" }, json: () => Promise.resolve({}) });
      if (callCount === 2) return Promise.resolve({ ok: true, headers: { get: () => "application/json" }, json: () => Promise.resolve({ expenses, total: 1, total_pages: 1 }) });
      return Promise.resolve({ ok: false, status: 500, headers: { get: () => "application/json" }, json: () => Promise.resolve({}) });
    }) as unknown as typeof fetch);

    render(<ExpensesPage />);
    await waitFor(() => {
      expect(screen.getAllByText("FailVendor").length).toBeGreaterThanOrEqual(1);
    });

    const approveBtns = screen.getAllByLabelText(/approve expense from/i);
    fireEvent.click(approveBtns[0]);

    // After rollback, approve buttons should reappear
    await waitFor(() => {
      expect(screen.getAllByLabelText(/approve expense from/i).length).toBeGreaterThanOrEqual(1);
    });
    expect(mockAddToast).toHaveBeenCalledWith({ type: "error", title: "Failed to confirm expense" });
  });

  it("optimistic delete removes expense from list", async () => {
    const expenses = [
      makeExpense({ id: "e1", vendor: "DeleteMe", status: "pending_review" }),
      makeExpense({ id: "e2", vendor: "KeepMe", status: "pending_review" }),
    ];

    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ ok: true, headers: { get: () => "application/json" }, json: () => Promise.resolve({}) });
      if (callCount === 2) return Promise.resolve({ ok: true, headers: { get: () => "application/json" }, json: () => Promise.resolve({ expenses, total: 2, total_pages: 1 }) });
      return Promise.resolve({ ok: true, status: 204, headers: { get: () => "application/json" }, json: () => Promise.resolve({}) });
    }) as unknown as typeof fetch);

    render(<ExpensesPage />);
    await waitFor(() => {
      expect(screen.getAllByText("DeleteMe").length).toBeGreaterThanOrEqual(1);
    });

    // Click delete on first expense (use aria-label to target desktop)
    const deleteBtns = screen.getAllByLabelText(/delete expense from deleteme/i);
    fireEvent.click(deleteBtns[0]);

    // Confirm dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/Delete the expense from "DeleteMe"/)).toBeInTheDocument();
    });

    // Click confirm button in dialog (it has confirmLabel="Delete" and role="dialog")
    const dialog = screen.getByRole("dialog");
    const confirmBtn = dialog.querySelector("button:last-child") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // DeleteMe should be gone
    await waitFor(() => {
      expect(screen.queryByText("DeleteMe")).not.toBeInTheDocument();
    });
    expect(screen.getAllByText("KeepMe").length).toBeGreaterThanOrEqual(1);
  });

  it("rolls back optimistic delete on API failure", async () => {
    const expenses = [
      makeExpense({ id: "e1", vendor: "KeepAfterFail", status: "pending_review" }),
    ];

    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ ok: true, headers: { get: () => "application/json" }, json: () => Promise.resolve({}) });
      if (callCount === 2) return Promise.resolve({ ok: true, headers: { get: () => "application/json" }, json: () => Promise.resolve({ expenses, total: 1, total_pages: 1 }) });
      return Promise.resolve({ ok: false, status: 500, headers: { get: () => "application/json" }, json: () => Promise.resolve({}) });
    }) as unknown as typeof fetch);

    render(<ExpensesPage />);
    await waitFor(() => {
      expect(screen.getAllByText("KeepAfterFail").length).toBeGreaterThanOrEqual(1);
    });

    const deleteBtns = screen.getAllByLabelText(/delete expense from keepafterfail/i);
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const dialog = screen.getByRole("dialog");
    const confirmBtn = dialog.querySelector("button:last-child") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Expense should reappear after rollback
    await waitFor(() => {
      expect(screen.getAllByText("KeepAfterFail").length).toBeGreaterThanOrEqual(1);
    });
    expect(mockAddToast).toHaveBeenCalledWith({ type: "error", title: "Failed to delete expense" });
  });

  it("bulk approve fires correct API call", async () => {
    const expenses = [
      makeExpense({ id: "e1", status: "pending_review", ai_confidence: "high" }),
      makeExpense({ id: "e2", status: "pending_review", ai_confidence: "high" }),
    ];

    const fetchMock = mockSequentialFetch([
      { ok: true, data: {} },
      { ok: true, data: { expenses, total: 2, total_pages: 1 } },
      { ok: true, data: { confirmed: 2 } },
      // Re-fetch after bulk confirm
      { ok: true, data: { expenses: [], total: 0, total_pages: 1 } },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<ExpensesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Approve All High Confidence/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Approve All High Confidence/));

    await waitFor(() => {
      const bulkCall = fetchMock.mock.calls.find(
        (call: unknown[]) => (call[0] as string).includes("bulk-confirm")
      );
      expect(bulkCall).toBeDefined();
      const body = JSON.parse((bulkCall![1] as { body: string }).body);
      expect(body.grant_id).toBe("g1");
      expect(body.filter).toEqual({ confidence: "high" });
    });
  });

  it("debounced search sends query after delay", async () => {
    const expenses = [makeExpense({ id: "e1" })];

    const fetchMock = mockSequentialFetch([
      { ok: true, data: {} },
      { ok: true, data: { expenses, total: 1, total_pages: 1 } },
      // Subsequent fetches for search
      { ok: true, data: { expenses: [], total: 0, total_pages: 1 } },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<ExpensesPage />);
    await waitFor(() => {
      expect(screen.getAllByText("Office Depot").length).toBeGreaterThanOrEqual(1);
    });

    const searchInput = screen.getByPlaceholderText(/search vendor/i);
    fireEvent.change(searchInput, { target: { value: "acme" } });

    // Debounced search fires after 300ms — just wait for the fetch call
    await waitFor(() => {
      const searchCall = fetchMock.mock.calls.find(
        (call: unknown[]) => (call[0] as string).includes("search=acme")
      );
      expect(searchCall).toBeDefined();
    }, { timeout: 2000 });
  });

  it("filter by status sends correct params", async () => {
    const expenses = [makeExpense({ id: "e1", vendor: "V1", status: "confirmed", confirmed_category: "personnel" })];

    const fetchMock = mockSequentialFetch([
      { ok: true, data: {} },
      { ok: true, data: { expenses, total: 1, total_pages: 1 } },
      // Subsequent fetch with filter
      { ok: true, data: { expenses, total: 1, total_pages: 1 } },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<ExpensesPage />);
    await waitFor(() => {
      expect(screen.getByText(/1 total/)).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText("Filter by status");
    fireEvent.change(statusSelect, { target: { value: "confirmed" } });

    await waitFor(() => {
      const statusCall = fetchMock.mock.calls.find(
        (call: unknown[]) => (call[0] as string).includes("status=confirmed")
      );
      expect(statusCall).toBeDefined();
    }, { timeout: 2000 });
  });
});
