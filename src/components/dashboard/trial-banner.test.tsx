import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrialBanner } from "@/components/dashboard/trial-banner";

vi.mock("next/link", () => ({ default: ({ children, ...props }: Record<string, unknown>) => <a {...props}>{children as React.ReactNode}</a> }));

describe("TrialBanner", () => {
  it("renders days remaining", () => {
    render(<TrialBanner daysRemaining={10} />);
    expect(screen.getByText(/10 days remaining/)).toBeDefined();
  });

  it("renders usage meters when provided", () => {
    render(
      <TrialBanner
        daysRemaining={10}
        grantCount={1}
        grantLimit={2}
        expenseCount={50}
        expenseLimit={200}
      />
    );
    expect(screen.getByText("1/2 grants")).toBeDefined();
    expect(screen.getByText("50/200 expenses")).toBeDefined();
  });

  it("does not render when dismissed", () => {
    const { container } = render(<TrialBanner daysRemaining={0} />);
    expect(container.firstChild).toBeNull();
  });
});
