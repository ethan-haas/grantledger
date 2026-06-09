import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CfrCitationLink } from "./cfr-citation-link";

describe("CfrCitationLink", () => {
  it("renders dash for null citation", () => {
    const { container } = render(<CfrCitationLink citation={null} />);
    expect(container.textContent).toContain("\u2014");
  });

  it("renders citation text", () => {
    render(<CfrCitationLink citation="2 CFR 200.430" />);
    expect(screen.getByText("2 CFR 200.430")).toBeDefined();
  });

  it("shows info popover for known citations", () => {
    render(<CfrCitationLink citation="2 CFR 200.430" />);
    // Should have an info popover button
    expect(screen.getByRole("button", { name: /more info/i })).toBeDefined();
  });
});
