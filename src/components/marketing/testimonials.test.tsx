import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Testimonials } from "./testimonials";

describe("Testimonials", () => {
  it("renders all 6 testimonial cards", () => {
    render(<Testimonials />);
    const names = [
      "Sarah Mitchell",
      "David Chen",
      "Maria Gonzalez",
      "Priya Patel",
      "James Okonkwo",
      "Lisa Thornton",
    ];
    names.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it("renders testimonial quotes", () => {
    render(<Testimonials />);
    expect(screen.getByText(/month-end close/)).toBeInTheDocument();
    expect(screen.getByText(/12 federal grants simultaneously/)).toBeInTheDocument();
    expect(screen.getByText(/single audit was the smoothest/)).toBeInTheDocument();
    expect(screen.getByText(/only two finance staff/)).toBeInTheDocument();
    expect(screen.getByText(/dual-framework compliance saved us/)).toBeInTheDocument();
    expect(screen.getByText(/Importing from QuickBooks/)).toBeInTheDocument();
  });

  it("renders organization names", () => {
    render(<Testimonials />);
    const orgs = [
      "Community Health Partners",
      "Pacific Education Foundation",
      "Southwest Family Services",
      "Riverside Arts Collective",
      "Green Valley Environmental",
      "Metro Workforce Alliance",
    ];
    orgs.forEach((org) => {
      expect(screen.getByText(new RegExp(org))).toBeInTheDocument();
    });
  });

  it("renders job titles", () => {
    render(<Testimonials />);
    expect(screen.getByText(/Director of Finance/)).toBeInTheDocument();
    expect(screen.getByText(/CFO/)).toBeInTheDocument();
    expect(screen.getByText(/Controller/)).toBeInTheDocument();
    expect(screen.getByText(/Finance Manager/)).toBeInTheDocument();
    expect(screen.getByText(/Grants Accountant/)).toBeInTheDocument();
    expect(screen.getByText(/VP of Finance/)).toBeInTheDocument();
  });

  it("renders star ratings for all testimonials", () => {
    render(<Testimonials />);
    const ratings = screen.getAllByLabelText(/out of 5 stars/);
    expect(ratings).toHaveLength(6);
  });

  it("renders 5-star ratings correctly", () => {
    render(<Testimonials />);
    const fiveStarRatings = screen.getAllByLabelText("5 out of 5 stars");
    expect(fiveStarRatings).toHaveLength(5);
  });

  it("renders 4-star rating for Lisa Thornton", () => {
    render(<Testimonials />);
    const fourStarRating = screen.getByLabelText("4 out of 5 stars");
    expect(fourStarRating).toBeInTheDocument();
  });

  it("accepts a className prop", () => {
    const { container } = render(<Testimonials className="mt-8" />);
    const grid = container.firstChild;
    expect(grid).toHaveClass("mt-8");
  });
});
