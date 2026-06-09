import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PastDueBanner } from "./past-due-banner";

describe("PastDueBanner", () => {
  it("renders past due warning message", () => {
    render(<PastDueBanner />);
    expect(
      screen.getByText(/your payment is past due/i)
    ).toBeInTheDocument();
  });

  it("links to billing page", () => {
    render(<PastDueBanner />);
    const link = screen.getByRole("link", { name: /update payment/i });
    expect(link).toHaveAttribute("href", "/dashboard/settings/billing");
  });

  it("disappears when dismiss button clicked", () => {
    render(<PastDueBanner />);
    const dismissBtn = screen.getByRole("button", { name: /dismiss payment banner/i });
    fireEvent.click(dismissBtn);
    expect(screen.queryByText(/your payment is past due/i)).not.toBeInTheDocument();
  });

  it("dismiss button has accessible aria-label", () => {
    render(<PastDueBanner />);
    const dismissBtn = screen.getByRole("button", { name: "Dismiss payment banner" });
    expect(dismissBtn).toBeInTheDocument();
  });
});
