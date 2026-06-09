import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlogArticle } from "@/components/marketing/blog-article";

vi.mock("framer-motion", () => ({
  motion: { div: (props: Record<string, unknown>) => <div {...props} /> },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useReducedMotion: () => false,
}));

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor() {}
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

describe("BlogArticle", () => {
  const defaultProps = {
    title: "Test Article",
    description: "Test description",
    author: { name: "John Doe", role: "Editor" },
    publishedDate: "2024-06-15",
    readingTime: "5 min read",
    category: "Compliance Guide",
    categoryColor: "bg-primary-50 text-primary-700",
    tableOfContents: [{ id: "intro", title: "Introduction" }],
    relatedArticles: [{ title: "Related", href: "/blog/related", category: "Guide" }],
  };

  it("renders title and description", () => {
    render(<BlogArticle {...defaultProps}>Content</BlogArticle>);
    expect(screen.getByRole("heading", { level: 1, name: "Test Article" })).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("renders author and reading time", () => {
    render(<BlogArticle {...defaultProps}>Content</BlogArticle>);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("5 min read")).toBeInTheDocument();
  });

  it("renders CTA banner", () => {
    render(<BlogArticle {...defaultProps}>Content</BlogArticle>);
    expect(screen.getByText(/Start Free Trial/i)).toBeInTheDocument();
  });

  it("renders table of contents", () => {
    render(<BlogArticle {...defaultProps}>Content</BlogArticle>);
    expect(screen.getByText("Introduction")).toBeInTheDocument();
  });

  it("renders related articles", () => {
    render(<BlogArticle {...defaultProps}>Content</BlogArticle>);
    expect(screen.getByText("Related")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<BlogArticle {...defaultProps}>Content</BlogArticle>);
    const badges = screen.getAllByText("Compliance Guide");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("renders breadcrumb navigation", () => {
    render(<BlogArticle {...defaultProps}>Content</BlogArticle>);
    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<BlogArticle {...defaultProps}><p>Article body content</p></BlogArticle>);
    expect(screen.getByText("Article body content")).toBeInTheDocument();
  });

  it("renders author initials", () => {
    render(<BlogArticle {...defaultProps}>Content</BlogArticle>);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("formats the published date", () => {
    render(<BlogArticle {...defaultProps}>Content</BlogArticle>);
    // Date may render as June 14 or 15 depending on timezone offset
    expect(screen.getByText(/June 1[45], 2024/)).toBeInTheDocument();
  });
});
