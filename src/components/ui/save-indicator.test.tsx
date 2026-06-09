import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SaveIndicator } from "./save-indicator";

describe("SaveIndicator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when idle", () => {
    const { container } = render(<SaveIndicator status="idle" />);
    expect(container.querySelector("[role='status']")).toBeNull();
  });

  it("shows spinner and saving text when saving", () => {
    render(<SaveIndicator status="saving" />);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("has status role for accessibility", () => {
    render(<SaveIndicator status="saving" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has aria-live polite attribute", () => {
    render(<SaveIndicator status="saving" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("shows checkmark and saved text when saved", () => {
    render(<SaveIndicator status="saved" />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("fades out after savedDuration", () => {
    render(<SaveIndicator status="saved" savedDuration={3000} />);
    expect(screen.getByRole("status")).toHaveClass("opacity-100");
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole("status")).toHaveClass("opacity-0");
  });

  it("shows error text when error", () => {
    render(<SaveIndicator status="error" />);
    expect(screen.getByText("Failed to save")).toBeInTheDocument();
  });

  it("shows custom error message", () => {
    render(<SaveIndicator status="error" errorMessage="Network error" />);
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("transitions from saving to saved", () => {
    const { rerender } = render(<SaveIndicator status="saving" />);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
    rerender(<SaveIndicator status="saved" />);
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("accepts className prop", () => {
    render(<SaveIndicator status="saving" className="ml-4" />);
    expect(screen.getByRole("status")).toHaveClass("ml-4");
  });
});
