import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock the Dialog component with a simple implementation
vi.mock("./dialog", () => ({
  Dialog: ({
    open,
    onClose,
    title,
    children,
  }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="dialog" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close dialog">
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

import { KeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog";

describe("KeyboardShortcutsDialog", () => {
  it("renders all shortcut groups when open", () => {
    render(<KeyboardShortcutsDialog open={true} onClose={vi.fn()} />);
    expect(screen.getByText("Navigation")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Go to Grants")).toBeInTheDocument();
    expect(screen.getByText("Go to Settings")).toBeInTheDocument();
    expect(screen.getByText("New Grant")).toBeInTheDocument();
    expect(screen.getByText("Command Palette")).toBeInTheDocument();
    expect(screen.getByText("Show Shortcuts")).toBeInTheDocument();
  });

  it("shows correct key combinations", () => {
    render(<KeyboardShortcutsDialog open={true} onClose={vi.fn()} />);
    // Navigation shortcuts use "g" + letter sequences
    const kbdElements = screen.getAllByText("g");
    expect(kbdElements.length).toBeGreaterThanOrEqual(3); // g+d, g+g, g+s
    expect(screen.getByText("d")).toBeInTheDocument();
    expect(screen.getByText("s")).toBeInTheDocument();
    expect(screen.getByText("K")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsDialog open={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close dialog"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
