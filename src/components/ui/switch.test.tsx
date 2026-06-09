import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders with label", () => {
    render(<Switch label="Enable notifications" />);
    expect(screen.getByText("Enable notifications")).toBeInTheDocument();
  });

  it("renders with description", () => {
    render(<Switch label="Theme" description="Toggle dark mode" />);
    expect(screen.getByText("Toggle dark mode")).toBeInTheDocument();
  });

  it("has switch role", () => {
    render(<Switch label="Toggle" />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("calls onChange when toggled", () => {
    const onChange = vi.fn();
    render(<Switch label="Toggle" onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalled();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Switch label="Disabled" disabled />);
    expect(screen.getByRole("switch")).toBeDisabled();
  });
});
