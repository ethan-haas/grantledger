import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "./ui-store";

beforeEach(() => {
  localStorage.clear();
  // Reset store to defaults
  useUiStore.setState({
    sidebarOpen: true,
    toasts: [],
    theme: "system",
  });
});

describe("useUiStore", () => {
  it("addToast caps queue at 5 items", () => {
    const { addToast } = useUiStore.getState();
    for (let i = 0; i < 7; i++) {
      addToast({ type: "info", title: `Toast ${i}` });
    }
    const { toasts } = useUiStore.getState();
    expect(toasts).toHaveLength(5);
    // Only last 5 remain (indices 2-6)
    expect(toasts[0].title).toBe("Toast 2");
    expect(toasts[4].title).toBe("Toast 6");
  });

  it("removeToast removes by ID", () => {
    const { addToast } = useUiStore.getState();
    addToast({ type: "success", title: "Keep" });
    addToast({ type: "error", title: "Remove" });

    const toasts = useUiStore.getState().toasts;
    expect(toasts).toHaveLength(2);

    const removeId = toasts[1].id;
    useUiStore.getState().removeToast(removeId);

    const remaining = useUiStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe("Keep");
  });

  it("toggleSidebar flips boolean", () => {
    expect(useUiStore.getState().sidebarOpen).toBe(true);
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarOpen).toBe(false);
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarOpen).toBe(true);
  });

  it("setTheme persists to localStorage", () => {
    useUiStore.getState().setTheme("dark");
    expect(useUiStore.getState().theme).toBe("dark");
    expect(localStorage.getItem("grantledger-theme")).toBe("dark");

    useUiStore.getState().setTheme("light");
    expect(localStorage.getItem("grantledger-theme")).toBe("light");
  });
});
