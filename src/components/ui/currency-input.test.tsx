import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyInput } from "./currency-input";

describe("CurrencyInput", () => {
  it("renders with label", () => {
    render(<CurrencyInput label="Amount" id="amount" />);
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("renders dollar sign prefix", () => {
    render(<CurrencyInput />);
    expect(screen.getByText("$")).toBeInTheDocument();
  });

  it("displays formatted value when not focused", () => {
    render(<CurrencyInput value={1234.56} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("1,234.56");
  });

  it("shows raw value on focus", () => {
    render(<CurrencyInput value={1234.56} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    expect(input).toHaveValue("1234.56");
  });

  it("formats value on blur", () => {
    const onChange = vi.fn();
    render(<CurrencyInput onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "5000" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(5000);
  });

  it("calls onChange during typing", () => {
    const onChange = vi.fn();
    render(<CurrencyInput onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "42.50" } });
    expect(onChange).toHaveBeenCalledWith(42.5);
  });

  it("handles empty input as null", () => {
    const onChange = vi.fn();
    render(<CurrencyInput value={100} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("shows error message", () => {
    render(<CurrencyInput error="Required" id="amt" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("sets aria-invalid when error is present", () => {
    render(<CurrencyInput error="Required" id="amt" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows hint text", () => {
    render(<CurrencyInput label="Budget" hint="federal share" id="b" />);
    expect(screen.getByText("(federal share)")).toBeInTheDocument();
  });

  it("disables input when disabled prop is set", () => {
    render(<CurrencyInput disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("shows placeholder", () => {
    render(<CurrencyInput />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "0.00");
  });

  it("displays null value as empty string", () => {
    render(<CurrencyInput value={null} />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("");
  });
});
