import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GrantForm } from "./grant-form";

const mockPush = vi.fn();
const mockBack = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
  }),
}));

const mockAddToast = vi.fn();
vi.mock("@/stores/ui-store", () => ({
  useUiStore: (selector: (s: { addToast: typeof mockAddToast }) => unknown) =>
    selector({ addToast: mockAddToast }),
}));

vi.mock("@/hooks/use-unsaved-changes", () => ({
  useUnsavedChanges: () => ({
    isDirty: false,
    setDirty: vi.fn(),
    resetDirty: vi.fn(),
  }),
}));

vi.mock("@/lib/posthog", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("./budget-table", () => ({
  BudgetTable: (props: Record<string, unknown>) => (
    <div data-testid="budget-table" data-disabled={props.disabled} />
  ),
}));

vi.mock("./threshold-card", () => ({
  ThresholdCard: (props: { framework: string }) => (
    <div data-testid="threshold-card">{props.framework}</div>
  ),
}));

vi.mock("./framework-badge", () => ({
  FrameworkBadge: (props: { framework: string }) => (
    <span data-testid="framework-badge">{props.framework}</span>
  ),
}));

describe("GrantForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  it("renders Grant Details heading", () => {
    render(<GrantForm />);
    expect(screen.getByText("Grant Details")).toBeDefined();
  });

  it("renders all form inputs", () => {
    render(<GrantForm />);
    expect(screen.getByLabelText(/Grant Name/)).toBeDefined();
    expect(screen.getByLabelText(/Funding Agency/)).toBeDefined();
    expect(screen.getByLabelText(/CFDA Number/)).toBeDefined();
    expect(screen.getByLabelText(/Award Number/)).toBeDefined();
    expect(screen.getByLabelText(/Award Date/)).toBeDefined();
    expect(screen.getByLabelText(/Total Award Amount/)).toBeDefined();
    expect(screen.getByLabelText(/Period Start/)).toBeDefined();
    expect(screen.getByLabelText(/Period End/)).toBeDefined();
  });

  it("shows Create Grant button for new grant", () => {
    render(<GrantForm />);
    expect(screen.getByText("Create Grant")).toBeDefined();
  });

  it("shows Update Grant button when initialData provided", () => {
    render(
      <GrantForm
        initialData={{
          id: "g_1",
          name: "Test Grant",
          funding_agency: "Test Agency",
          cfda_number: "14.218",
          award_number: "B-24-MC",
          award_date: "2024-06-15",
          period_start: "2024-07-01",
          period_end: "2025-06-30",
          total_amount: 500000,
          omb_framework: "pre_oct_2024",
          budgets: [],
        }}
      />
    );
    expect(screen.getByText("Update Grant")).toBeDefined();
  });

  it("shows FrameworkBadge when award_date entered", () => {
    render(<GrantForm />);
    const awardDateInput = screen.getByLabelText(/Award Date/);
    fireEvent.change(awardDateInput, { target: { value: "2024-06-15" } });
    const badge = screen.getByTestId("framework-badge");
    expect(badge.textContent).toBe("pre_oct_2024");
  });

  it("validates period_end must be after period_start", async () => {
    render(<GrantForm />);
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Grant Name/), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/Funding Agency/), { target: { value: "Agency" } });
    fireEvent.change(screen.getByLabelText(/Award Date/), { target: { value: "2024-01-01" } });
    fireEvent.change(screen.getByLabelText(/Total Award Amount/), { target: { value: "1000" } });
    // Set dates out of order
    fireEvent.change(screen.getByLabelText(/Period Start/), { target: { value: "2025-01-01" } });
    fireEvent.change(screen.getByLabelText(/Period End/), { target: { value: "2024-01-01" } });
    // Submit
    fireEvent.click(screen.getByText("Create Grant"));
    await waitFor(() => {
      expect(screen.getByText("Period end must be after period start")).toBeDefined();
    });
  });

  it("submits POST and redirects on success", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "g_new" }),
    });

    render(<GrantForm />);
    fireEvent.change(screen.getByLabelText(/Grant Name/), { target: { value: "New Grant" } });
    fireEvent.change(screen.getByLabelText(/Funding Agency/), { target: { value: "Agency" } });
    fireEvent.change(screen.getByLabelText(/Award Date/), { target: { value: "2024-06-15" } });
    fireEvent.change(screen.getByLabelText(/Total Award Amount/), { target: { value: "50000" } });
    fireEvent.change(screen.getByLabelText(/Period Start/), { target: { value: "2024-07-01" } });
    fireEvent.change(screen.getByLabelText(/Period End/), { target: { value: "2025-06-30" } });
    fireEvent.click(screen.getByText("Create Grant"));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/grants", expect.objectContaining({ method: "POST" }));
      expect(mockPush).toHaveBeenCalledWith("/dashboard/grants/g_new");
    });
  });

  it("shows error toast on failed submission", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Validation failed" }),
    });

    render(<GrantForm />);
    fireEvent.change(screen.getByLabelText(/Grant Name/), { target: { value: "Bad Grant" } });
    fireEvent.change(screen.getByLabelText(/Funding Agency/), { target: { value: "Agency" } });
    fireEvent.change(screen.getByLabelText(/Award Date/), { target: { value: "2024-06-15" } });
    fireEvent.change(screen.getByLabelText(/Total Award Amount/), { target: { value: "50000" } });
    fireEvent.change(screen.getByLabelText(/Period Start/), { target: { value: "2024-07-01" } });
    fireEvent.change(screen.getByLabelText(/Period End/), { target: { value: "2025-06-30" } });
    fireEvent.click(screen.getByText("Create Grant"));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" })
      );
    });
  });
});
