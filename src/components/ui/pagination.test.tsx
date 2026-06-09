import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("renders page info", () => {
    render(<Pagination page={1} totalPages={5} total={250} pageSize={50} onPageChange={vi.fn()} />);
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
  });

  it("disables previous on first page", () => {
    render(<Pagination page={1} totalPages={5} total={250} pageSize={50} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disables next on last page", () => {
    render(<Pagination page={5} totalPages={5} total={250} pageSize={50} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("calls onPageChange when clicking next", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} total={250} pageSize={50} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("returns null when totalPages is 1", () => {
    const { container } = render(<Pagination page={1} totalPages={1} total={10} pageSize={50} onPageChange={vi.fn()} />);
    expect(container.querySelector("nav")).toBeNull();
  });

  it("marks current page with aria-current", () => {
    render(<Pagination page={3} totalPages={5} total={250} pageSize={50} onPageChange={vi.fn()} />);
    const currentButton = screen.getByText("3");
    expect(currentButton).toHaveAttribute("aria-current", "page");
  });
});
