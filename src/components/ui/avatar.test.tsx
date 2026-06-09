import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar, AvatarGroup } from "./avatar";

describe("Avatar", () => {
  it("renders initials when no src is provided", () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders single initial for single name", () => {
    render(<Avatar name="Admin" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders image when src is provided", () => {
    render(<Avatar name="John Doe" src="/avatar.jpg" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/avatar.jpg");
  });

  it("has aria-label with name", () => {
    render(<Avatar name="Jane Smith" />);
    expect(screen.getByLabelText("Jane Smith")).toBeInTheDocument();
  });

  it("renders status dot when status is provided", () => {
    render(<Avatar name="John" status="online" />);
    expect(screen.getByLabelText("online")).toBeInTheDocument();
  });
});

describe("AvatarGroup", () => {
  it("renders up to max avatars", () => {
    render(
      <AvatarGroup max={2}>
        <Avatar name="Alice" />
        <Avatar name="Bob" />
        <Avatar name="Charlie" />
      </AvatarGroup>
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByLabelText("1 more")).toBeInTheDocument();
  });
});
