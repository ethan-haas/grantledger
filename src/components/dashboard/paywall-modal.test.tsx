import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaywallModal } from "./paywall-modal";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("PaywallModal", () => {
  it("renders Upgrade to Continue heading", () => {
    render(<PaywallModal reason="Trial expired" />);
    expect(screen.getByText("Upgrade to Continue")).toBeDefined();
  });

  it("shows trial expired message", () => {
    render(<PaywallModal reason="Trial expired" />);
    expect(screen.getByText(/14-day free trial has ended/)).toBeDefined();
  });

  it("shows past due message", () => {
    render(<PaywallModal reason="Payment past due" />);
    expect(screen.getByText(/payment is past due/)).toBeDefined();
  });

  it("shows generic message for other reasons", () => {
    render(<PaywallModal reason="Grant limit reached" />);
    expect(screen.getByText(/subscription is required/)).toBeDefined();
  });

  it("renders feature list", () => {
    render(<PaywallModal reason="Trial expired" />);
    expect(screen.getByText("Unlimited grants & expenses")).toBeDefined();
    expect(screen.getByText("AI-powered categorization")).toBeDefined();
    expect(screen.getByText("Compliance reports")).toBeDefined();
  });

  it("renders link to billing settings", () => {
    render(<PaywallModal reason="Trial expired" />);
    const link = screen.getByText("View subscription plans").closest("a");
    expect(link?.getAttribute("href")).toBe("/dashboard/settings/billing");
  });

  it("has dialog role and aria-modal", () => {
    render(<PaywallModal reason="Trial expired" />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });
});
