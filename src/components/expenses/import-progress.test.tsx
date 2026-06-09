import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImportProgress } from "./import-progress";

describe("ImportProgress", () => {
  it('"importing" phase shows "Importing expenses..."', () => {
    render(<ImportProgress current={3} total={10} phase="importing" />);
    expect(screen.getByText("Importing expenses...")).toBeInTheDocument();
  });

  it('"categorizing" phase shows "AI categorizing expenses..."', () => {
    render(<ImportProgress current={5} total={10} phase="categorizing" />);
    expect(screen.getByText("AI categorizing expenses...")).toBeInTheDocument();
  });

  it('"done" phase shows "Complete!" + success message', () => {
    render(<ImportProgress current={10} total={10} phase="done" />);
    expect(screen.getByText("Complete!")).toBeInTheDocument();
    expect(screen.getByText("10 of 10 expenses categorized by AI")).toBeInTheDocument();
  });

  it("percentage calculation: 7/20 = 35%", () => {
    render(<ImportProgress current={7} total={20} phase="importing" />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "35");
    expect(screen.getByText(/35%/)).toBeInTheDocument();
  });

  it("zero total → 0% (no division by zero)", () => {
    render(<ImportProgress current={0} total={0} phase="importing" />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });
});
