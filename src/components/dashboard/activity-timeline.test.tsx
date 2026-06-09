import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActivityTimeline } from "./activity-timeline";
import type { ActivityAction } from "@/lib/supabase/database.types";

// Mock clipboard API
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

interface ActivityOverrides {
  id?: string;
  action?: ActivityAction;
  actor_email?: string;
  details?: Record<string, unknown>;
  created_at?: string;
}

function makeActivity(overrides: ActivityOverrides = {}) {
  return {
    id: "act-1",
    action: "grant_created" as ActivityAction,
    actor_email: "user@example.com",
    details: {} as Record<string, unknown>,
    created_at: "2024-06-15T10:00:00Z",
    ...overrides,
  };
}

describe("ActivityTimeline", () => {
  it("empty state shows emptyMessage or default", () => {
    const { rerender } = render(<ActivityTimeline activities={[]} />);
    expect(screen.getByText("No activity recorded yet.")).toBeInTheDocument();

    rerender(<ActivityTimeline activities={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders action labels from ACTION_META", () => {
    const activities = [
      makeActivity({ id: "1", action: "grant_created" }),
      makeActivity({ id: "2", action: "expense_confirmed" }),
    ];
    render(<ActivityTimeline activities={activities} />);
    expect(screen.getByText("Grant created")).toBeInTheDocument();
    expect(screen.getByText("Expense confirmed")).toBeInTheDocument();
  });

  it("detail summary for expenses_imported shows count", () => {
    const activities = [
      makeActivity({
        id: "1",
        action: "expenses_imported",
        details: { count: 5 },
      }),
    ];
    render(<ActivityTimeline activities={activities} />);
    expect(screen.getByText("5 expenses imported")).toBeInTheDocument();
  });

  it("detail summary for report_generated shows format", () => {
    const activities = [
      makeActivity({
        id: "1",
        action: "report_generated",
        details: { format: "csv" },
      }),
    ];
    render(<ActivityTimeline activities={activities} />);
    expect(screen.getByText("CSV report")).toBeInTheDocument();
  });

  it("expand/collapse button toggles full JSON details", () => {
    const activities = [
      makeActivity({
        id: "1",
        action: "grant_updated",
        details: { grant_name: "Test Grant", field_before: "old", field_after: "new", extra_key: "value" },
      }),
    ];
    render(<ActivityTimeline activities={activities} />);

    // "Details" button should exist
    const detailsBtn = screen.getByLabelText("Expand details");
    expect(detailsBtn).toBeInTheDocument();

    // Click to expand
    fireEvent.click(detailsBtn);

    // JSON pre block should appear
    const pre = screen.getByText(/"extra_key"/);
    expect(pre).toBeInTheDocument();

    // Click to collapse
    const hideBtn = screen.getByLabelText("Collapse details");
    fireEvent.click(hideBtn);

    // JSON should be hidden
    expect(screen.queryByText(/"extra_key"/)).not.toBeInTheDocument();
  });
});
