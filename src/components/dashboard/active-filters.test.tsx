import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActiveFilters } from "./active-filters";

describe("ActiveFilters", () => {
  it("renders nothing when no filters", () => {
    const { container } = render(
      <ActiveFilters filters={[]} onRemove={vi.fn()} onClearAll={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders filter chips", () => {
    render(
      <ActiveFilters
        filters={[
          { key: "status", label: "Status", value: "Pending" },
          { key: "confidence", label: "Confidence", value: "High" },
        ]}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByText("Status: Pending")).toBeInTheDocument();
    expect(screen.getByText("Confidence: High")).toBeInTheDocument();
  });

  it("calls onRemove when chip is removed", () => {
    const onRemove = vi.fn();
    render(
      <ActiveFilters
        filters={[{ key: "status", label: "Status", value: "Pending" }]}
        onRemove={onRemove}
        onClearAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Remove"));
    expect(onRemove).toHaveBeenCalledWith("status");
  });

  it("shows clear all when multiple filters", () => {
    render(
      <ActiveFilters
        filters={[
          { key: "status", label: "Status", value: "Pending" },
          { key: "confidence", label: "Confidence", value: "High" },
        ]}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });
});
