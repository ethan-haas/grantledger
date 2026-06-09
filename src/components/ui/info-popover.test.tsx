import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InfoPopover } from "./info-popover";

describe("InfoPopover", () => {
  it("renders trigger button", () => {
    render(<InfoPopover title="Test">Content</InfoPopover>);
    expect(screen.getByRole("button", { name: /more info about test/i })).toBeDefined();
  });

  it("opens popover on click", () => {
    render(<InfoPopover title="Test"><p>Help content</p></InfoPopover>);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Help content")).toBeDefined();
    expect(screen.getByText("Test")).toBeDefined();
  });

  it("closes on escape key", () => {
    render(<InfoPopover title="Test"><p>Help content</p></InfoPopover>);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Help content")).toBeDefined();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Help content")).toBeNull();
  });

  it("has correct aria attributes", () => {
    render(<InfoPopover title="Test">Content</InfoPopover>);
    const trigger = screen.getByRole("button");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("dialog")).toBeDefined();
  });
});
