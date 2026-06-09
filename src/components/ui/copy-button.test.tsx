import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CopyButton } from "@/components/ui/copy-button";

// Mock clipboard API
const writeTextMock = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: writeTextMock },
});

describe("CopyButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders copy icon", () => {
    render(<CopyButton text="test" />);
    const button = screen.getByRole("button", { name: /copy/i });
    expect(button).toBeDefined();
  });

  it("copies text to clipboard on click", async () => {
    render(<CopyButton text="hello world" label="Copy text" />);
    const button = screen.getByRole("button", { name: /copy text/i });
    fireEvent.click(button);
    expect(writeTextMock).toHaveBeenCalledWith("hello world");
  });

  it("shows check icon after copy", async () => {
    render(<CopyButton text="test" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    // After click, aria-label should change to "Copied"
    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: /copied/i })).toBeDefined();
    });
  });
});
