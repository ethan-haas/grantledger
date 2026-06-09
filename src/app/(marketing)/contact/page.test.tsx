import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactPage from "./page";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a {...props}>{children}</a>,
}));

describe("ContactPage", () => {
  it("renders the page heading", () => {
    render(<ContactPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Get in touch"
    );
  });

  it("renders the name field", () => {
    render(<ContactPage />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
  });

  it("renders the email field", () => {
    render(<ContactPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("you@nonprofit.org")
    ).toBeInTheDocument();
  });

  it("renders the subject select field", () => {
    render(<ContactPage />);
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
    const select = screen.getByLabelText("Subject");
    expect(select.tagName).toBe("SELECT");
  });

  it("renders all subject options", () => {
    render(<ContactPage />);
    expect(screen.getByText("General Inquiry")).toBeInTheDocument();
    expect(screen.getByText("Technical Support")).toBeInTheDocument();
    expect(screen.getByText("Billing Question")).toBeInTheDocument();
    expect(screen.getByText("Partnership")).toBeInTheDocument();
  });

  it("renders the message textarea", () => {
    render(<ContactPage />);
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("How can we help?")
    ).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("button", { name: "Send Message" })
    ).toBeInTheDocument();
  });

  it("renders the sidebar info sections", () => {
    render(<ContactPage />);
    expect(screen.getByText("Support Hours")).toBeInTheDocument();
    expect(screen.getByText("Response Time")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
  });

  it("renders resource links", () => {
    render(<ContactPage />);
    expect(screen.getByText("Read our blog")).toBeInTheDocument();
    expect(screen.getByText("2 CFR 200 methodology")).toBeInTheDocument();
    expect(screen.getByText("Resource library")).toBeInTheDocument();
  });

  it("renders the free trial callout", () => {
    render(<ContactPage />);
    expect(
      screen.getByText("Prefer to try it first?")
    ).toBeInTheDocument();
    expect(screen.getByText("Start Free Trial")).toBeInTheDocument();
  });

  it("name field is required", () => {
    render(<ContactPage />);
    const input = screen.getByLabelText("Name");
    expect(input).toBeRequired();
  });

  it("email field is required and has email type", () => {
    render(<ContactPage />);
    const input = screen.getByLabelText("Email");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("type", "email");
  });

  it("message field is required", () => {
    render(<ContactPage />);
    const textarea = screen.getByLabelText("Message");
    expect(textarea).toBeRequired();
  });

  it("updates form state on input change", () => {
    render(<ContactPage />);
    const nameInput = screen.getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect(nameInput).toHaveValue("Jane Doe");
  });

  it("shows success message after successful submission", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
      headers: new Headers({ "content-type": "application/json" }),
    });

    render(<ContactPage />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jane@nonprofit.org" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "I have a question about your service." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

    await waitFor(() => {
      expect(screen.getByText("Message sent")).toBeInTheDocument();
    });

    vi.mocked(global.fetch).mockRestore();
  });

  it("shows error message on failed submission", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
      headers: new Headers({ "content-type": "application/json" }),
    });

    render(<ContactPage />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jane@nonprofit.org" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "I have a question about your service." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });

    vi.mocked(global.fetch).mockRestore();
  });

  it("shows 'Sending...' while submitting", async () => {
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch = vi.fn().mockReturnValue(pendingPromise);

    render(<ContactPage />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "jane@nonprofit.org" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "I have a question about your service." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

    expect(screen.getByText("Sending...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();

    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ success: true }),
      headers: new Headers({ "content-type": "application/json" }),
    });

    vi.mocked(global.fetch).mockRestore();
  });
});
