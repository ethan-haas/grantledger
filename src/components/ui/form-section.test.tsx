import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormSection } from "./form-section";

describe("FormSection", () => {
  it("renders title", () => {
    render(
      <FormSection title="Grant Details">
        <p>Content</p>
      </FormSection>
    );
    expect(screen.getByText("Grant Details")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(
      <FormSection title="Budget" description="Allocate by category">
        <p>Fields</p>
      </FormSection>
    );
    expect(screen.getByText("Allocate by category")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <FormSection title="Section">
        <p>Child content</p>
      </FormSection>
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("has section element with aria-labelledby", () => {
    render(
      <FormSection title="My Section">
        <p>Content</p>
      </FormSection>
    );
    const section = screen.getByRole("region", { hidden: true }) || document.querySelector("section");
    expect(section).toHaveAttribute("aria-labelledby");
  });

  it("renders as non-collapsible by default", () => {
    render(
      <FormSection title="Static">
        <p>Content</p>
      </FormSection>
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders collapsible section with toggle button", () => {
    render(
      <FormSection title="Collapsible" collapsible>
        <p>Hidden content</p>
      </FormSection>
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses content when toggle is clicked", () => {
    render(
      <FormSection title="Collapsible" collapsible>
        <p>Toggle me</p>
      </FormSection>
    );
    expect(screen.getByText("Toggle me")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("Toggle me")).not.toBeInTheDocument();
  });

  it("expands content when toggle is clicked again", () => {
    render(
      <FormSection title="Collapsible" collapsible>
        <p>Toggle me</p>
      </FormSection>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("Toggle me")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Toggle me")).toBeInTheDocument();
  });

  it("starts collapsed when defaultOpen is false", () => {
    render(
      <FormSection title="Collapsed" collapsible defaultOpen={false}>
        <p>Not visible</p>
      </FormSection>
    );
    expect(screen.queryByText("Not visible")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("has border-b separator class", () => {
    const { container } = render(
      <FormSection title="Separated">
        <p>Content</p>
      </FormSection>
    );
    const section = container.querySelector("section");
    expect(section?.className).toContain("border-b");
  });

  it("accepts className prop", () => {
    const { container } = render(
      <FormSection title="Custom" className="mt-8">
        <p>Content</p>
      </FormSection>
    );
    const section = container.querySelector("section");
    expect(section?.className).toContain("mt-8");
  });
});
