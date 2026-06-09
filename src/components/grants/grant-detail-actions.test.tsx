import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GrantDetailActions } from "./grant-detail-actions";

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

// Mock HTMLDialogElement methods for jsdom
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = vi.fn();
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = vi.fn();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("GrantDetailActions", () => {
  it("delete button opens confirm dialog", () => {
    render(<GrantDetailActions grantId="g-123" grantName="Test Grant" />);
    // Click "Delete" button
    fireEvent.click(screen.getByLabelText("Delete grant"));
    // Confirm dialog should appear with title and message
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "Test Grant"/)).toBeInTheDocument();
  });

  it("successful delete shows success toast + navigates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    }));

    render(<GrantDetailActions grantId="g-123" grantName="Test Grant" />);
    fireEvent.click(screen.getByLabelText("Delete grant"));

    // Click confirm
    const confirmBtn = screen.getByRole("button", { name: "Delete Grant" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success", title: "Grant deleted" })
      );
    });
    expect(mockPush).toHaveBeenCalledWith("/dashboard/grants");
  });

  it("failed delete shows error toast, no navigation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    render(<GrantDetailActions grantId="g-123" grantName="Test Grant" />);
    fireEvent.click(screen.getByLabelText("Delete grant"));

    const confirmBtn = screen.getByRole("button", { name: "Delete Grant" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Failed to delete grant" })
      );
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
