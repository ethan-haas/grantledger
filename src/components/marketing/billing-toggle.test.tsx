import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BillingToggle } from "@/components/marketing/billing-toggle";

describe("BillingToggle", () => {
  it("renders monthly and annual options", () => {
    render(<BillingToggle value="annual" onChange={() => {}} />);
    expect(screen.getByText("Monthly")).toBeDefined();
    expect(screen.getByText(/Annual/)).toBeDefined();
  });

  it("calls onChange when toggled to monthly", () => {
    const onChange = vi.fn();
    render(<BillingToggle value="annual" onChange={onChange} />);
    fireEvent.click(screen.getByText("Monthly"));
    expect(onChange).toHaveBeenCalledWith("monthly");
  });

  it("calls onChange when toggled to annual", () => {
    const onChange = vi.fn();
    render(<BillingToggle value="monthly" onChange={onChange} />);
    // Find the annual button - it contains "Annual" text and the save badge
    const annualButton = screen.getByText(/Annual/).closest("button");
    expect(annualButton).toBeDefined();
    if (annualButton) fireEvent.click(annualButton);
    expect(onChange).toHaveBeenCalledWith("annual");
  });

  it("shows save badge on annual", () => {
    render(<BillingToggle value="monthly" onChange={() => {}} />);
    expect(screen.getByText("Save 17%")).toBeDefined();
  });
});
