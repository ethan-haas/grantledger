import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

vi.mock("next/link", () => ({ default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <a {...props}>{children}</a> }));

describe("NotFound", () => {
  it("renders 404 heading", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeDefined();
  });

  it("renders description", () => {
    render(<NotFound />);
    expect(screen.getByText(/doesn't exist/)).toBeDefined();
  });

  it("renders navigation links", () => {
    render(<NotFound />);
    expect(screen.getByText("Go Home")).toBeDefined();
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Pricing")).toBeDefined();
    expect(screen.getByText("Blog")).toBeDefined();
  });

  it("renders SVG illustration", () => {
    const { container } = render(<NotFound />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
