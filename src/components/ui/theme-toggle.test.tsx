import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mutable theme state for the mock — updated via beforeEach.
let mockTheme = "system";
const mockSetTheme = vi.fn();

vi.mock("@/stores/ui-store", () => ({
  useUiStore: (
    selector: (state: {
      theme: string;
      setTheme: typeof mockSetTheme;
    }) => unknown
  ) => selector({ theme: mockTheme, setTheme: mockSetTheme }),
}));

import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockTheme = "system";
    mockSetTheme.mockClear();
  });

  it("renders all three theme options", () => {
    render(<ThemeToggle />);
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("calls setTheme when clicking an option", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByText("Dark"));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("highlights the active theme", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    const darkButton = screen.getByText("Dark").closest("button");
    expect(darkButton).toHaveAttribute("aria-pressed", "true");
  });

  it("does not mark inactive themes as pressed", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    const lightButton = screen.getByText("Light").closest("button");
    expect(lightButton).toHaveAttribute("aria-pressed", "false");
  });

  it("calls setTheme with light when Light is clicked", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByText("Light"));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
