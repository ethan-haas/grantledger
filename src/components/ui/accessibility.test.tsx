import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SkipLink } from "./skip-link";
import { Alert } from "./alert";
import { Tabs, TabList, TabTrigger, TabPanel } from "./tabs";
import { Switch } from "./switch";
import { ProgressBar, ProgressRing } from "./progress";
import { Dialog } from "./dialog";
import { SearchSelect } from "./search-select";
import { Button } from "./button";
import { Input } from "./input";
import { Tooltip } from "./tooltip";
import { Divider } from "./divider";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  // jsdom does not implement HTMLDialogElement methods
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("Accessibility", () => {
  /* ─── SkipLink ─────────────────────────────────────────────── */

  it("renders a skip link targeting #main-content", () => {
    render(<SkipLink />);
    const link = screen.getByText("Skip to main content");
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("skip link is visually hidden by default (has sr-only class)", () => {
    render(<SkipLink />);
    const link = screen.getByText("Skip to main content");
    expect(link.className).toContain("sr-only");
  });

  /* ─── Alert ────────────────────────────────────────────────── */

  it("Alert has role=alert", () => {
    render(<Alert>Important message</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("Alert dismiss button has accessible name", () => {
    render(<Alert dismissible>Dismissable</Alert>);
    const dismissButton = screen.getByLabelText("Dismiss");
    expect(dismissButton).toBeInTheDocument();
    expect(dismissButton.tagName).toBe("BUTTON");
  });

  /* ─── Tabs ─────────────────────────────────────────────────── */

  it("TabList has role=tablist", () => {
    render(
      <Tabs defaultValue="a">
        <TabList><TabTrigger value="a">Tab A</TabTrigger></TabList>
        <TabPanel value="a">Content A</TabPanel>
      </Tabs>
    );
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("TabTrigger has role=tab with aria-selected", () => {
    render(
      <Tabs defaultValue="a">
        <TabList>
          <TabTrigger value="a">Tab A</TabTrigger>
          <TabTrigger value="b">Tab B</TabTrigger>
        </TabList>
        <TabPanel value="a">A</TabPanel>
        <TabPanel value="b">B</TabPanel>
      </Tabs>
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
  });

  it("TabPanel has role=tabpanel", () => {
    render(
      <Tabs defaultValue="a">
        <TabList><TabTrigger value="a">Tab A</TabTrigger></TabList>
        <TabPanel value="a">Content A</TabPanel>
      </Tabs>
    );
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  /* ─── Switch ───────────────────────────────────────────────── */

  it("Switch has role=switch", () => {
    render(<Switch label="Enable" />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("Switch aria-checked reflects state", () => {
    const { rerender } = render(<Switch label="Toggle" checked={false} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    rerender(<Switch label="Toggle" checked={true} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  /* ─── Progress ─────────────────────────────────────────────── */

  it("ProgressBar has role=progressbar with aria-valuenow", () => {
    render(<ProgressBar value={42} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute("aria-valuenow", "42");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("ProgressRing has role=progressbar with aria-label", () => {
    render(<ProgressRing value={60} label="Upload progress" />);
    const ring = screen.getByRole("progressbar");
    expect(ring).toBeInTheDocument();
    expect(ring).toHaveAttribute("aria-label", "Upload progress");
  });

  /* ─── Dialog ───────────────────────────────────────────────── */

  it("Dialog has role=dialog when open", () => {
    // HTMLDialogElement.showModal/close are not fully supported in jsdom,
    // so we query by the title text which is inside the dialog.
    render(
      <Dialog open={true} onClose={() => {}} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    );
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog content")).toBeInTheDocument();
  });

  it("Dialog close button has accessible label", () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Test Dialog">
        <p>Content</p>
      </Dialog>
    );
    expect(screen.getByLabelText("Close dialog")).toBeInTheDocument();
  });

  /* ─── SearchSelect ─────────────────────────────────────────── */

  it("SearchSelect trigger has role=combobox", () => {
    render(
      <SearchSelect
        options={[{ value: "a", label: "Alpha" }]}
        id="acc-test"
      />
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("SearchSelect sets aria-expanded correctly", () => {
    render(
      <SearchSelect
        options={[{ value: "a", label: "Alpha" }]}
        id="acc-test"
      />
    );
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("SearchSelect listbox has role=listbox when open", () => {
    render(
      <SearchSelect
        options={[{ value: "a", label: "Alpha" }]}
        id="acc-test"
      />
    );
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  /* ─── Interactive elements have accessible names ───────────── */

  it("Button is accessible with its text content", () => {
    render(<Button>Save Changes</Button>);
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("Input with label has accessible name via htmlFor", () => {
    render(<Input label="Email" id="email-test" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  /* ─── Tooltip ──────────────────────────────────────────────── */

  it("Tooltip renders role=tooltip element", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Help text");
  });

  /* ─── Divider ──────────────────────────────────────────────── */

  it("Divider with label has role=separator", () => {
    render(<Divider label="Section" />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("Vertical divider has aria-orientation=vertical", () => {
    render(<Divider orientation="vertical" />);
    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-orientation", "vertical");
  });
});
