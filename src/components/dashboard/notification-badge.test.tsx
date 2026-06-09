import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotificationBadge } from "./notification-badge";

beforeEach(() => {
  vi.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve({ notifications: [], totalCount: 0 }),
  } as unknown as Response);
});

describe("NotificationBadge", () => {
  it("renders bell icon button", () => {
    render(<NotificationBadge />);
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });

  it("calls fetch on mount", () => {
    render(<NotificationBadge />);
    expect(global.fetch).toHaveBeenCalledWith("/api/notifications?limit=5");
  });
});
