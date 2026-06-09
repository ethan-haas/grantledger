import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InlineCategoryEditor } from "./inline-category-editor";

describe("InlineCategoryEditor", () => {
  const defaultProps = {
    expenseId: "exp_1",
    currentCategory: "personnel" as const,
    onUpdate: vi.fn().mockResolvedValue(undefined),
  };

  it("renders current category label", () => {
    render(<InlineCategoryEditor {...defaultProps} />);
    expect(screen.getByText("Personnel")).toBeDefined();
  });

  it("renders category-specific color class", () => {
    render(<InlineCategoryEditor {...defaultProps} />);
    const trigger = screen.getByRole("button");
    expect(trigger.className).toContain("bg-blue-50");
    expect(trigger.className).toContain("text-blue-700");
  });

  it("opens dropdown with 9 category items on click", () => {
    render(<InlineCategoryEditor {...defaultProps} />);
    fireEvent.click(screen.getByRole("button"));
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(9);
  });

  it("highlights current category with font-semibold", () => {
    render(<InlineCategoryEditor {...defaultProps} />);
    fireEvent.click(screen.getByRole("button"));
    // Find the Personnel menu item's inner span
    const personnelItem = screen.getAllByRole("menuitem").find(
      (item) => item.textContent?.includes("Personnel")
    );
    const boldSpan = personnelItem?.querySelector(".font-semibold");
    expect(boldSpan).toBeDefined();
    expect(boldSpan?.textContent).toBe("Personnel");
  });

  it("calls onUpdate when different category selected", () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <InlineCategoryEditor {...defaultProps} onUpdate={onUpdate} />
    );
    fireEvent.click(screen.getByRole("button"));
    // Find and click Equipment item
    const equipmentItem = screen.getAllByRole("menuitem").find(
      (item) => item.textContent?.includes("Equipment")
    );
    fireEvent.click(equipmentItem!);
    expect(onUpdate).toHaveBeenCalledWith("exp_1", "equipment");
  });

  it("does not call onUpdate when clicking current category", () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <InlineCategoryEditor {...defaultProps} onUpdate={onUpdate} />
    );
    fireEvent.click(screen.getByRole("button"));
    // Find and click Personnel (current)
    const personnelItem = screen.getAllByRole("menuitem").find(
      (item) => item.textContent?.includes("Personnel")
    );
    fireEvent.click(personnelItem!);
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
