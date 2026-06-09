import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BlogIndexPage from "@/app/(marketing)/blog/page";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <a {...props}>{children}</a>
  ),
}));

describe("BlogIndexPage", () => {
  it("renders blog heading", () => {
    render(<BlogIndexPage />);
    expect(screen.getByText("Insights for grant compliance")).toBeInTheDocument();
  });

  it("renders the Blog label", () => {
    render(<BlogIndexPage />);
    expect(screen.getByText("Blog")).toBeInTheDocument();
  });

  it("renders article cards", () => {
    render(<BlogIndexPage />);
    expect(
      screen.getByText("Complete Guide to 2 CFR 200 Budget Categories for Nonprofits")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "What Changed in the October 2024 OMB Uniform Guidance Revision"
      )
    ).toBeInTheDocument();
  });

  it("renders category filter buttons", () => {
    render(<BlogIndexPage />);
    const buttons = screen.getAllByRole("button");
    const buttonTexts = buttons.map((b) => b.textContent);
    expect(buttonTexts).toContain("All");
    expect(buttonTexts).toContain("Compliance Guide");
    expect(buttonTexts).toContain("Product Update");
    expect(buttonTexts).toContain("Case Study");
  });

  it("filters articles by category", () => {
    render(<BlogIndexPage />);
    const caseStudyBtn = screen.getByRole("button", { name: "Case Study" });
    fireEvent.click(caseStudyBtn);
    expect(
      screen.getByText("Single Audit Preparation: From 3 Days to 3 Hours")
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Complete Guide to 2 CFR 200 Budget Categories for Nonprofits"
      )
    ).not.toBeInTheDocument();
  });

  it("shows all articles when All filter is selected", () => {
    render(<BlogIndexPage />);
    const caseStudyBtn = screen.getByRole("button", { name: "Case Study" });
    fireEvent.click(caseStudyBtn);
    const allBtn = screen.getByRole("button", { name: "All" });
    fireEvent.click(allBtn);
    expect(
      screen.getByText(
        "Complete Guide to 2 CFR 200 Budget Categories for Nonprofits"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Single Audit Preparation: From 3 Days to 3 Hours")
    ).toBeInTheDocument();
  });

  it("renders all 6 articles initially", () => {
    render(<BlogIndexPage />);
    const readMoreLinks = screen.getAllByText("Read more");
    expect(readMoreLinks.length).toBe(6);
  });

  it("renders email capture section", () => {
    render(<BlogIndexPage />);
    expect(screen.getByText("Never miss an update")).toBeInTheDocument();
  });
});
