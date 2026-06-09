import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SortableHeader } from "./sortable-header";

describe("SortableHeader", () => {
  it("renders the label", () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Date"
              column="date"
              currentSort="date"
              currentDirection="asc"
              onSort={vi.fn()}
            />
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("shows ascending aria-sort when active asc", () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Date"
              column="date"
              currentSort="date"
              currentDirection="asc"
              onSort={vi.fn()}
            />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole("columnheader");
    expect(th).toHaveAttribute("aria-sort", "ascending");
  });

  it("calls onSort when clicked", () => {
    const onSort = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Date"
              column="date"
              currentSort="vendor"
              currentDirection="asc"
              onSort={onSort}
            />
          </tr>
        </thead>
      </table>
    );
    fireEvent.click(screen.getByText("Date"));
    expect(onSort).toHaveBeenCalledWith("date");
  });

  it("shows descending aria-sort when active desc", () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Amount"
              column="amount"
              currentSort="amount"
              currentDirection="desc"
              onSort={vi.fn()}
            />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole("columnheader");
    expect(th).toHaveAttribute("aria-sort", "descending");
  });

  it("shows none aria-sort when column is not active", () => {
    render(
      <table>
        <thead>
          <tr>
            <SortableHeader
              label="Vendor"
              column="vendor"
              currentSort="date"
              currentDirection="asc"
              onSort={vi.fn()}
            />
          </tr>
        </thead>
      </table>
    );
    const th = screen.getByRole("columnheader");
    expect(th).toHaveAttribute("aria-sort", "none");
  });
});
