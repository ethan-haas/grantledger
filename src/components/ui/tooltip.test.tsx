import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Tooltip } from "./tooltip";

describe("Tooltip", () => {
  it("renders children and tooltip content", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText("Hover me")).toBeDefined();
    expect(screen.getByRole("tooltip")).toBeDefined();
    expect(screen.getByRole("tooltip").textContent).toBe("Help text");
  });

  it("has correct aria attributes", () => {
    render(
      <Tooltip content="Tooltip info">
        <span>Label</span>
      </Tooltip>
    );
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.id).toBeTruthy();
    const trigger = screen.getByText("Label").closest("[aria-describedby]");
    expect(trigger?.getAttribute("aria-describedby")).toBe(tooltip.id);
  });
});
