import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BottomSheet } from "@/components/ui/bottom-sheet";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { onAnimationComplete, transition, initial, animate, exit, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useReducedMotion: () => true,
}));

describe("BottomSheet", () => {
  it("renders children when open", () => {
    render(
      <BottomSheet open onClose={() => {}}>
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(screen.getByText("Sheet content")).toBeDefined();
  });

  it("renders nothing when closed", () => {
    render(
      <BottomSheet open={false} onClose={() => {}}>
        <p>Sheet content</p>
      </BottomSheet>,
    );
    expect(screen.queryByText("Sheet content")).toBeNull();
  });

  it("renders title when provided", () => {
    render(
      <BottomSheet open onClose={() => {}} title="Actions">
        <p>Content</p>
      </BottomSheet>,
    );
    expect(screen.getByText("Actions")).toBeDefined();
  });

  it("calls onClose on escape key", () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose}>
        <p>Content</p>
      </BottomSheet>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("has dialog role", () => {
    render(
      <BottomSheet open onClose={() => {}}>
        <p>Content</p>
      </BottomSheet>,
    );
    expect(screen.getByRole("dialog")).toBeDefined();
  });
});
