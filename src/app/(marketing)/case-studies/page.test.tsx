import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import CaseStudiesPage from "./page";

describe("CaseStudiesPage", () => {
  it("renders the page heading", () => {
    render(<CaseStudiesPage />);
    expect(screen.getByText("Real Results from Real Nonprofits")).toBeDefined();
  });

  it("renders 3 case study cards", () => {
    render(<CaseStudiesPage />);
    expect(screen.getByText(/Community Health Partners/)).toBeDefined();
    expect(screen.getByText(/Managing 12 Grants/)).toBeDefined();
    expect(screen.getByText(/QuickBooks Integration/)).toBeDefined();
  });

  it("renders links to individual case studies", () => {
    render(<CaseStudiesPage />);
    const links = document.querySelectorAll("a[href*='/case-studies/']");
    expect(links.length).toBe(3);
  });

  it("displays metrics for each case study", () => {
    render(<CaseStudiesPage />);
    expect(screen.getByText("95% reduction in audit prep time")).toBeDefined();
    expect(screen.getByText("Zero compliance findings in 2 years")).toBeDefined();
    expect(screen.getByText("30+ hours saved per month")).toBeDefined();
  });
});
