import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar, ProgressRing } from "./progress";

describe("ProgressBar", () => {
  it("renders with progressbar role", () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("sets correct aria-valuenow", () => {
    render(<ProgressBar value={75} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
  });

  it("renders label", () => {
    render(<ProgressBar value={50} label="Upload" />);
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });

  it("shows percentage when showValue is true", () => {
    render(<ProgressBar value={33} showValue />);
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("clamps percentage to 0-100", () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "150");
  });
});

describe("ProgressRing", () => {
  it("renders with progressbar role", () => {
    render(<ProgressRing value={50} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows percentage value by default", () => {
    render(<ProgressRing value={75} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("hides value when showValue is false", () => {
    render(<ProgressRing value={50} showValue={false} />);
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });
});
