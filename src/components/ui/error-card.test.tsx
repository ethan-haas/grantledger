import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorCard } from "./error-card";

// Mock child components
vi.mock("./card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
}));
vi.mock("./button", () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; variant?: string; size?: string }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

describe("ErrorCard", () => {
  it("renders error message", () => {
    render(<ErrorCard message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<ErrorCard message="Failed" onRetry={onRetry} />);
    expect(screen.getByText("Try again")).toBeDefined();
  });

  it("calls onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorCard message="Failed" onRetry={onRetry} />);
    fireEvent.click(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
