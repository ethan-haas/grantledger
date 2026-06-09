import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

let mockReducedMotion = false;
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial, animate, transition, ...rest } = props;
      return <div data-testid="motion-div" data-initial={JSON.stringify(initial)} {...rest}>{children as React.ReactNode}</div>;
    },
  },
  useReducedMotion: () => mockReducedMotion,
}));

import { PageTransition } from "./page-transition";

describe("PageTransition", () => {
  it("wraps children in a motion.div with animation", () => {
    render(<PageTransition><p>Hello</p></PageTransition>);
    expect(screen.getByText("Hello")).toBeDefined();
    expect(screen.getByTestId("motion-div")).toBeDefined();
  });

  it("skips animation when reduced motion is preferred", () => {
    mockReducedMotion = true;
    render(<PageTransition><p>Content</p></PageTransition>);
    expect(screen.getByText("Content")).toBeDefined();
    expect(screen.queryByTestId("motion-div")).toBeNull();
    mockReducedMotion = false;
  });
});
