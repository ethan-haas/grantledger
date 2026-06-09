import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("applies primary variant styles by default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByText("Primary");
    expect(btn.className).toContain("bg-primary-600");
  });

  it("has micro-interaction hover:translate on primary variant", () => {
    render(<Button variant="primary">Lift</Button>);
    const btn = screen.getByText("Lift");
    expect(btn.className).toContain("hover:-translate-y-[1px]");
  });

  it("does not have micro-interaction on secondary variant", () => {
    render(<Button variant="secondary">Flat</Button>);
    const btn = screen.getByText("Flat");
    expect(btn.className).not.toContain("hover:-translate-y-[1px]");
  });

  it("shows spinner when loading", () => {
    render(<Button loading>Loading</Button>);
    const btn = screen.getByText("Loading");
    expect(btn.closest("button")?.getAttribute("aria-busy")).toBe("true");
  });

  it("disables button when disabled", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByText("Disabled").closest("button");
    expect(btn?.disabled).toBe(true);
  });
});
