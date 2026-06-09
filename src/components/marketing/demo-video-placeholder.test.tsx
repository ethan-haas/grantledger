import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DemoVideoPlaceholder } from "./demo-video-placeholder";

describe("DemoVideoPlaceholder", () => {
  it("renders the play button and label", () => {
    render(<DemoVideoPlaceholder />);
    expect(screen.getByText("Watch 2-minute demo")).toBeDefined();
    expect(screen.getByLabelText("Watch 2-minute demo")).toBeDefined();
  });

  it("shows coming soon modal when no videoUrl is provided", () => {
    render(<DemoVideoPlaceholder />);
    fireEvent.click(screen.getByLabelText("Watch 2-minute demo"));
    expect(screen.getByText("Demo Coming Soon")).toBeDefined();
  });

  it("dismisses modal when Got it is clicked", () => {
    render(<DemoVideoPlaceholder />);
    fireEvent.click(screen.getByLabelText("Watch 2-minute demo"));
    expect(screen.getByText("Demo Coming Soon")).toBeDefined();
    fireEvent.click(screen.getByText("Got it"));
    expect(screen.queryByText("Demo Coming Soon")).toBeNull();
  });

  it("opens video URL when videoUrl is provided", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<DemoVideoPlaceholder videoUrl="https://example.com/demo" />);
    fireEvent.click(screen.getByLabelText("Watch 2-minute demo"));
    expect(openSpy).toHaveBeenCalledWith("https://example.com/demo", "_blank", "noopener");
    openSpy.mockRestore();
  });
});
