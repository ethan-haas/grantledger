import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateRangePicker } from "./date-range-picker";

describe("DateRangePicker", () => {
  it("renders with label", () => {
    render(<DateRangePicker label="Date range" />);
    expect(screen.getByText("Date range")).toBeInTheDocument();
  });

  it("renders start and end date inputs", () => {
    render(<DateRangePicker />);
    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  it("displays initial date values", () => {
    render(<DateRangePicker startDate="2024-01-01" endDate="2024-12-31" />);
    expect(screen.getByLabelText("Start date")).toHaveValue("2024-01-01");
    expect(screen.getByLabelText("End date")).toHaveValue("2024-12-31");
  });

  it("calls onChange when start date changes", () => {
    const onChange = vi.fn();
    render(<DateRangePicker endDate="2024-12-31" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2024-06-01" },
    });
    expect(onChange).toHaveBeenCalledWith({
      startDate: "2024-06-01",
      endDate: "2024-12-31",
    });
  });

  it("calls onChange when end date changes", () => {
    const onChange = vi.fn();
    render(<DateRangePicker startDate="2024-01-01" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2024-06-30" },
    });
    expect(onChange).toHaveBeenCalledWith({
      startDate: "2024-01-01",
      endDate: "2024-06-30",
    });
  });

  it("shows validation error when end is before start", () => {
    render(<DateRangePicker startDate="2024-12-01" />);
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2024-01-01" },
    });
    expect(screen.getByText("End date must be after start date")).toBeInTheDocument();
  });

  it("renders preset buttons", () => {
    render(<DateRangePicker />);
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    expect(screen.getByText("This quarter")).toBeInTheDocument();
  });

  it("renders grant period button when grant period props are provided", () => {
    render(
      <DateRangePicker
        grantPeriodStart="2024-01-01"
        grantPeriodEnd="2024-12-31"
      />
    );
    expect(screen.getByText("Grant period")).toBeInTheDocument();
  });

  it("does not render grant period button without grant period props", () => {
    render(<DateRangePicker />);
    expect(screen.queryByText("Grant period")).not.toBeInTheDocument();
  });

  it("applies grant period preset on click", () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        grantPeriodStart="2024-03-01"
        grantPeriodEnd="2025-02-28"
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText("Grant period"));
    expect(onChange).toHaveBeenCalledWith({
      startDate: "2024-03-01",
      endDate: "2025-02-28",
    });
  });

  it("shows clear button when dates are set", () => {
    render(<DateRangePicker startDate="2024-01-01" />);
    expect(screen.getByLabelText("Clear date range")).toBeInTheDocument();
  });

  it("clears dates on clear button click", () => {
    const onChange = vi.fn();
    render(<DateRangePicker startDate="2024-01-01" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Clear date range"));
    expect(onChange).toHaveBeenCalledWith({ startDate: "", endDate: "" });
  });

  it("shows external error message", () => {
    render(<DateRangePicker error="Required field" id="dr" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("has group role with accessible label", () => {
    render(<DateRangePicker label="Report period" />);
    expect(screen.getByRole("group")).toHaveAttribute("aria-label", "Report period");
  });

  it("disables all inputs when disabled", () => {
    render(<DateRangePicker disabled />);
    expect(screen.getByLabelText("Start date")).toBeDisabled();
    expect(screen.getByLabelText("End date")).toBeDisabled();
  });
});
