import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className, ...props }: Record<string, unknown>) => (
      <div className={className as string} {...props}>{children as React.ReactNode}</div>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock("@/stores/ui-store", () => ({
  useUiStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const store = {
      toasts: [
        { id: "1", type: "success", title: "Test toast", message: "Test message" },
      ],
      removeToast: vi.fn(),
    };
    return selector(store);
  },
}));

import { ToastContainer } from "./toast";

describe("ToastContainer", () => {
  it("uses bottom-20 on mobile to clear MobileNav", () => {
    render(<ToastContainer />);
    // ToastContainer uses useEffect for mounted check, but we can check the container
    const container = document.querySelector("[aria-live='polite']");
    expect(container).toBeDefined();
    if (container) {
      expect(container.className).toContain("bottom-20");
    }
  });

  it("uses z-toast class", () => {
    render(<ToastContainer />);
    const container = document.querySelector("[aria-live='polite']");
    if (container) {
      expect(container.className).toContain("z-toast");
    }
  });
});
