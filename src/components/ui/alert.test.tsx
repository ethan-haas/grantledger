import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Alert } from "./alert";

describe("Alert", () => {
  it("renders children content", () => {
    render(<Alert>This is an alert</Alert>);
    expect(screen.getByText("This is an alert")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(<Alert title="Warning">Content</Alert>);
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });

  it("has alert role", () => {
    render(<Alert>Content</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("is dismissible when dismissible prop is set", () => {
    render(<Alert dismissible>Content</Alert>);
    const dismissButton = screen.getByLabelText("Dismiss");
    expect(dismissButton).toBeInTheDocument();
    fireEvent.click(dismissButton);
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("calls onDismiss when dismissed", () => {
    const onDismiss = vi.fn();
    render(<Alert dismissible onDismiss={onDismiss}>Content</Alert>);
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders action when provided", () => {
    render(<Alert action={<button>Fix it</button>}>Content</Alert>);
    expect(screen.getByText("Fix it")).toBeInTheDocument();
  });
});
