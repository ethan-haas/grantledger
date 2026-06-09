import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrustBadges } from "./trust-badges";

describe("TrustBadges", () => {
  it("renders the 'Built on 2 CFR 200' badge", () => {
    render(<TrustBadges />);
    expect(screen.getByText("Built on 2 CFR 200")).toBeInTheDocument();
  });

  it("renders the 'Row-Level Data Isolation' badge", () => {
    render(<TrustBadges />);
    expect(
      screen.getByText("Row-Level Data Isolation")
    ).toBeInTheDocument();
  });

  it("renders the '256-bit Encryption' badge", () => {
    render(<TrustBadges />);
    expect(screen.getByText("256-bit Encryption")).toBeInTheDocument();
  });

  it("renders the '99.9% Uptime' badge", () => {
    render(<TrustBadges />);
    expect(screen.getByText("99.9% Uptime")).toBeInTheDocument();
  });

  it("renders all 4 badges", () => {
    render(<TrustBadges />);
    const badges = [
      "Built on 2 CFR 200",
      "Row-Level Data Isolation",
      "256-bit Encryption",
      "99.9% Uptime",
    ];
    badges.forEach((badge) => {
      expect(screen.getByText(badge)).toBeInTheDocument();
    });
  });

  it("does not render a 'SOC 2 Ready' badge", () => {
    render(<TrustBadges />);
    expect(screen.queryByText("SOC 2 Ready")).not.toBeInTheDocument();
  });

  it("accepts a className prop", () => {
    const { container } = render(<TrustBadges className="mt-12" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("mt-12");
  });

  it("renders SVG icons for each badge", () => {
    const { container } = render(<TrustBadges />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(4);
  });
});
