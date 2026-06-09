import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabList, TabTrigger, TabPanel } from "./tabs";

function renderTabs(props: { variant?: "underline" | "pills" | "enclosed"; defaultValue?: string } = {}) {
  return render(
    <Tabs defaultValue={props.defaultValue || "a"} variant={props.variant}>
      <TabList>
        <TabTrigger value="a">Tab A</TabTrigger>
        <TabTrigger value="b">Tab B</TabTrigger>
        <TabTrigger value="c" disabled>Tab C</TabTrigger>
      </TabList>
      <TabPanel value="a">Content A</TabPanel>
      <TabPanel value="b">Content B</TabPanel>
      <TabPanel value="c">Content C</TabPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("renders the default tab content", () => {
    renderTabs();
    expect(screen.getByText("Content A")).toBeInTheDocument();
    expect(screen.queryByText("Content B")).not.toBeInTheDocument();
  });

  it("switches tabs on click", () => {
    renderTabs();
    fireEvent.click(screen.getByText("Tab B"));
    expect(screen.getByText("Content B")).toBeInTheDocument();
    expect(screen.queryByText("Content A")).not.toBeInTheDocument();
  });

  it("sets aria-selected on active tab", () => {
    renderTabs();
    expect(screen.getByText("Tab A")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Tab B")).toHaveAttribute("aria-selected", "false");
  });

  it("uses tablist role", () => {
    renderTabs();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("renders tabpanel role", () => {
    renderTabs();
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("navigates with arrow keys", () => {
    renderTabs();
    const tabA = screen.getByText("Tab A");
    tabA.focus();
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByText("Tab B"));
  });

  it("calls onValueChange callback", () => {
    const onChange = vi.fn();
    render(
      <Tabs defaultValue="a" onValueChange={onChange}>
        <TabList>
          <TabTrigger value="a">Tab A</TabTrigger>
          <TabTrigger value="b">Tab B</TabTrigger>
        </TabList>
        <TabPanel value="a">A</TabPanel>
        <TabPanel value="b">B</TabPanel>
      </Tabs>
    );
    fireEvent.click(screen.getByText("Tab B"));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("renders pills variant", () => {
    renderTabs({ variant: "pills" });
    expect(screen.getByText("Tab A")).toBeInTheDocument();
  });

  it("renders enclosed variant", () => {
    renderTabs({ variant: "enclosed" });
    expect(screen.getByText("Tab A")).toBeInTheDocument();
  });
});
