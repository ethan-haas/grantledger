import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let mockPathname = "/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

import { RouteProgressBar } from "./route-progress";

describe("RouteProgressBar", () => {
  it("renders a progressbar element", () => {
    render(<RouteProgressBar />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeDefined();
    expect(bar.getAttribute("aria-label")).toBe("Page loading");
  });

  it("uses z-sticky for stacking", () => {
    render(<RouteProgressBar />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("z-sticky");
  });
});
