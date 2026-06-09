import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchSelect } from "./search-select";

const options = [
  { value: "personnel", label: "Personnel" },
  { value: "fringe", label: "Fringe Benefits" },
  { value: "travel", label: "Travel" },
  { value: "equipment", label: "Equipment" },
  { value: "supplies", label: "Supplies" },
];

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("SearchSelect", () => {
  it("renders with label", () => {
    render(<SearchSelect options={options} label="Category" id="cat" />);
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("shows placeholder when no value selected", () => {
    render(<SearchSelect options={options} placeholder="Pick one" />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("shows selected option label", () => {
    render(<SearchSelect options={options} value="travel" />);
    expect(screen.getByText("Travel")).toBeInTheDocument();
  });

  it("opens dropdown on click", () => {
    render(<SearchSelect options={options} id="sel" />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("shows all options when opened", () => {
    render(<SearchSelect options={options} id="sel" />);
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getAllByRole("option")).toHaveLength(5);
  });

  it("filters options by search text", () => {
    render(<SearchSelect options={options} id="sel" />);
    fireEvent.click(screen.getByRole("combobox"));
    const searchInput = screen.getByLabelText("Search options");
    fireEvent.change(searchInput, { target: { value: "equip" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByText("Equipment")).toBeInTheDocument();
  });

  it("shows no results message when filter matches nothing", () => {
    render(<SearchSelect options={options} id="sel" />);
    fireEvent.click(screen.getByRole("combobox"));
    const searchInput = screen.getByLabelText("Search options");
    fireEvent.change(searchInput, { target: { value: "zzzzz" } });
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("calls onChange when option is clicked", () => {
    const onChange = vi.fn();
    render(<SearchSelect options={options} onChange={onChange} id="sel" />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Travel"));
    expect(onChange).toHaveBeenCalledWith("travel");
  });

  it("closes dropdown after selection", () => {
    const onChange = vi.fn();
    render(<SearchSelect options={options} onChange={onChange} id="sel" />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Travel"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    render(<SearchSelect options={options} id="sel" />);
    fireEvent.click(screen.getByRole("combobox"));
    const searchInput = screen.getByLabelText("Search options");
    fireEvent.keyDown(searchInput, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("navigates with ArrowDown key", () => {
    render(<SearchSelect options={options} id="sel" />);
    fireEvent.click(screen.getByRole("combobox"));
    const searchInput = screen.getByLabelText("Search options");
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    // The second option should be highlighted
    const secondOption = screen.getAllByRole("option")[1];
    expect(secondOption).toHaveClass("bg-primary-50");
  });

  it("selects with Enter key", () => {
    const onChange = vi.fn();
    render(<SearchSelect options={options} onChange={onChange} id="sel" />);
    fireEvent.click(screen.getByRole("combobox"));
    const searchInput = screen.getByLabelText("Search options");
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    fireEvent.keyDown(searchInput, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("fringe");
  });

  it("shows error message", () => {
    render(<SearchSelect options={options} error="Required" id="sel" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("sets aria-invalid on error", () => {
    render(<SearchSelect options={options} error="Required" id="sel" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });

  it("sets aria-expanded correctly", () => {
    render(<SearchSelect options={options} id="sel" />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("is disabled when disabled prop is set", () => {
    render(<SearchSelect options={options} disabled id="sel" />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
