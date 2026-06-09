import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { DangerZone } from "./danger-zone";

vi.mock("@/stores/ui-store", () => ({
  useUiStore: (selector: (s: { addToast: () => void }) => unknown) =>
    selector({ addToast: vi.fn() }),
}));

beforeAll(() => {
  // jsdom doesn't implement HTMLDialogElement methods
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = vi.fn();
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = vi.fn();
  }
});

describe("DangerZone", () => {
  it("renders the danger zone heading", () => {
    render(<DangerZone orgId="org_test123456" />);
    expect(screen.getByText("Danger Zone")).toBeInTheDocument();
  });

  it("renders the delete organization button", () => {
    render(<DangerZone orgId="org_test123456" />);
    expect(screen.getByRole("button", { name: /delete organization/i })).toBeInTheDocument();
  });

  it("renders warning about permanent deletion", () => {
    render(<DangerZone orgId="org_test123456" />);
    expect(screen.getByText(/permanently delete all grants/i)).toBeInTheDocument();
  });
});
