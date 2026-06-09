import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DropdownMenu, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator, DropdownHeader } from "./dropdown-menu";

function renderDropdown(props: { onSelect?: () => void } = {}) {
  return render(
    <DropdownMenu>
      <DropdownTrigger>Actions</DropdownTrigger>
      <DropdownContent>
        <DropdownHeader>Options</DropdownHeader>
        <DropdownItem onSelect={props.onSelect}>Edit</DropdownItem>
        <DropdownSeparator />
        <DropdownItem danger>Delete</DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  it("renders trigger button", () => {
    renderDropdown();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("does not show content initially", () => {
    renderDropdown();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens menu on click", () => {
    renderDropdown();
    fireEvent.click(screen.getByText("Actions"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("shows items when open", () => {
    renderDropdown();
    fireEvent.click(screen.getByText("Actions"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("calls onSelect when item is clicked", () => {
    const onSelect = vi.fn();
    renderDropdown({ onSelect });
    fireEvent.click(screen.getByText("Actions"));
    fireEvent.click(screen.getByText("Edit"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("renders separator", () => {
    renderDropdown();
    fireEvent.click(screen.getByText("Actions"));
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("renders header", () => {
    renderDropdown();
    fireEvent.click(screen.getByText("Actions"));
    expect(screen.getByText("Options")).toBeInTheDocument();
  });

  it("has aria-expanded on trigger", () => {
    renderDropdown();
    expect(screen.getByText("Actions")).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByText("Actions"));
    expect(screen.getByText("Actions")).toHaveAttribute("aria-expanded", "true");
  });
});
