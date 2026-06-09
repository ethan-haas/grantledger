import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Chip, ChipGroup } from "./chip";

describe("Chip", () => {
  it("renders children", () => {
    render(<Chip>Personnel</Chip>);
    expect(screen.getByText("Personnel")).toBeInTheDocument();
  });

  it("is clickable when onClick is provided", () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Click me</Chip>);
    fireEvent.click(screen.getByText("Click me"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("has button role when clickable", () => {
    render(<Chip onClick={vi.fn()}>Button chip</Chip>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows remove button when removable", () => {
    render(<Chip removable>Removable</Chip>);
    expect(screen.getByLabelText("Remove")).toBeInTheDocument();
  });

  it("calls onRemove when remove is clicked", () => {
    const onRemove = vi.fn();
    render(<Chip removable onRemove={onRemove}>Tag</Chip>);
    fireEvent.click(screen.getByLabelText("Remove"));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe("ChipGroup", () => {
  it("renders children in a group", () => {
    render(
      <ChipGroup>
        <Chip>One</Chip>
        <Chip>Two</Chip>
      </ChipGroup>
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });
});
