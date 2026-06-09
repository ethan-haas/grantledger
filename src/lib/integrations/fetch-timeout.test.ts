import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithTimeout } from "./fetch-timeout";

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resolves when fetch completes before timeout", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    const resultPromise = fetchWithTimeout("https://example.com", {}, 5000);

    // No need to advance timers — fetch resolves immediately
    const result = await resultPromise;

    expect(result.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it("propagates network errors with original error message", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("Failed to fetch")
    );

    const resultPromise = fetchWithTimeout("https://example.com", {}, 5000);
    await expect(resultPromise).rejects.toThrow("Failed to fetch");
  });

  it("passes abort signal alongside caller-provided init options", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

    await fetchWithTimeout(
      "https://example.com",
      { headers: { Authorization: "Bearer token" }, method: "POST" },
      5000
    );

    expect(fetchSpy).toHaveBeenCalledOnce();
    const callArgs = fetchSpy.mock.calls[0];
    expect(callArgs[0]).toBe("https://example.com");
    const init = callArgs[1] as RequestInit;
    // Original headers preserved
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token");
    // Method preserved
    expect(init.method).toBe("POST");
    // Signal added
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("rejects with AbortError when fetch exceeds timeout", async () => {
    // Create a fetch that never resolves on its own
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = (init as RequestInit)?.signal;
          if (signal) {
            signal.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted.", "AbortError"));
            });
          }
        })
    );

    const resultPromise = fetchWithTimeout("https://example.com", {}, 100);

    // Advance past the timeout
    vi.advanceTimersByTime(150);

    await expect(resultPromise).rejects.toThrow("aborted");
  });
});
