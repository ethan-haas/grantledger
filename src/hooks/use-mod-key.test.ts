import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

describe("useModKey", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns 'Ctrl' on initial render (SSR-safe default)", async () => {
    const { useModKey } = await import("./use-mod-key");
    const { result } = renderHook(() => useModKey());
    // Before useEffect fires, the default is "Ctrl"
    expect(result.current).toBe("Ctrl");
  });

  it("returns '⌘' after mount on Mac userAgent", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      configurable: true,
    });

    const { useModKey } = await import("./use-mod-key");
    const { result } = renderHook(() => useModKey());

    // After useEffect runs, Mac userAgent → "⌘"
    expect(result.current).toBe("\u2318");
  });

  it("stays 'Ctrl' on non-Mac userAgent", async () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      configurable: true,
    });

    const { useModKey } = await import("./use-mod-key");
    const { result } = renderHook(() => useModKey());

    expect(result.current).toBe("Ctrl");
  });
});
