import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUiStore } from "@/stores/ui-store";
import { useTheme } from "./use-theme";

// Mock matchMedia for jsdom (not available by default)
let mockMatches = false;
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: mockMatches,
    media: query,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("useTheme", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    mockMatches = false;
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });

  it("adds 'dark' class to documentElement when theme is 'dark'", () => {
    useUiStore.setState({ theme: "dark" });
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes 'dark' class from documentElement when theme is 'light'", () => {
    document.documentElement.classList.add("dark");
    useUiStore.setState({ theme: "light" });
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("applies dark class when theme is 'system' and prefers-color-scheme is dark", () => {
    mockMatches = true;
    useUiStore.setState({ theme: "system" });
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("does not apply dark class when theme is 'system' and prefers-color-scheme is light", () => {
    mockMatches = false;
    useUiStore.setState({ theme: "system" });
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("returns the current theme value from the store", () => {
    useUiStore.setState({ theme: "dark" });
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe("dark");
  });
});
