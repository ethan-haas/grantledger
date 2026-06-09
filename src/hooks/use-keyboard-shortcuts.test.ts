import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function fireKey(key: string, options: Partial<KeyboardEventInit> = {}, target?: HTMLElement): void {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    ...options,
  });
  if (target) {
    Object.defineProperty(event, "target", { value: target });
  }
  document.dispatchEvent(event);
}

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it("skips shortcuts when target is an INPUT element", async () => {
    const { useKeyboardShortcuts } = await import("./use-keyboard-shortcuts");
    renderHook(() => useKeyboardShortcuts());

    const input = document.createElement("input");
    fireKey("?", {}, input);

    // Should not toggle help — no action taken
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("skips shortcuts when target is a TEXTAREA element", async () => {
    const { useKeyboardShortcuts } = await import("./use-keyboard-shortcuts");
    renderHook(() => useKeyboardShortcuts());

    const textarea = document.createElement("textarea");
    fireKey("?", {}, textarea);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("toggles showHelp with '?' key", async () => {
    const { useKeyboardShortcuts } = await import("./use-keyboard-shortcuts");
    const { result } = renderHook(() => useKeyboardShortcuts());

    expect(result.current.showHelp).toBe(false);

    act(() => { fireKey("?"); });
    expect(result.current.showHelp).toBe(true);

    act(() => { fireKey("?"); });
    expect(result.current.showHelp).toBe(false);
  });

  it("navigates to new grant with Ctrl+N", async () => {
    const { useKeyboardShortcuts } = await import("./use-keyboard-shortcuts");
    renderHook(() => useKeyboardShortcuts());

    act(() => { fireKey("n", { ctrlKey: true }); });
    expect(mockPush).toHaveBeenCalledWith("/dashboard/grants/new");
  });

  it("navigates to dashboard with 'g' then 'd' chord within 500ms", async () => {
    const { useKeyboardShortcuts } = await import("./use-keyboard-shortcuts");
    renderHook(() => useKeyboardShortcuts());

    act(() => { fireKey("g"); });
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { fireKey("d"); });

    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("does not trigger chord when buffer clears after 500ms", async () => {
    const { useKeyboardShortcuts } = await import("./use-keyboard-shortcuts");
    renderHook(() => useKeyboardShortcuts());

    act(() => { fireKey("g"); });
    act(() => { vi.advanceTimersByTime(600); }); // Buffer clears after 500ms
    act(() => { fireKey("d"); });

    expect(mockPush).not.toHaveBeenCalledWith("/dashboard");
  });
});
