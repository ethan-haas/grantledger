import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SecurityPage from "./page";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a {...props}>{children}</a>,
}));

describe("SecurityPage", () => {
  it("renders the page heading", () => {
    render(<SecurityPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Security-first architecture"
    );
  });

  it("renders the AES-256 encryption feature", () => {
    render(<SecurityPage />);
    expect(screen.getByText("AES-256 Encryption")).toBeInTheDocument();
    expect(
      screen.getByText(/All data is encrypted at rest using AES-256/)
    ).toBeInTheDocument();
  });

  it("renders the Row-Level Data Isolation feature", () => {
    render(<SecurityPage />);
    expect(
      screen.getByText("Row-Level Data Isolation")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/PostgreSQL Row-Level Security/)
    ).toBeInTheDocument();
  });

  it("renders the OAuth Token Security feature", () => {
    render(<SecurityPage />);
    expect(screen.getByText("OAuth Token Security")).toBeInTheDocument();
  });

  it("renders the Identity & Access Management feature", () => {
    render(<SecurityPage />);
    expect(
      screen.getByText("Identity & Access Management")
    ).toBeInTheDocument();
  });

  it("renders the Infrastructure Security feature", () => {
    render(<SecurityPage />);
    expect(
      screen.getByText("Infrastructure Security")
    ).toBeInTheDocument();
  });

  it("renders the Audit Trail feature", () => {
    render(<SecurityPage />);
    expect(screen.getByText("Audit Trail")).toBeInTheDocument();
  });

  it("renders all 6 security feature cards", () => {
    render(<SecurityPage />);
    const featureTitles = [
      "AES-256 Encryption",
      "Row-Level Data Isolation",
      "OAuth Token Security",
      "Identity & Access Management",
      "Infrastructure Security",
      "Audit Trail",
    ];
    featureTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it("renders the compliance summary table heading", () => {
    render(<SecurityPage />);
    expect(screen.getByText("Security at a glance")).toBeInTheDocument();
  });

  it("renders the compliance table with Control and Implementation headers", () => {
    render(<SecurityPage />);
    expect(screen.getByText("Control")).toBeInTheDocument();
    expect(screen.getByText("Implementation")).toBeInTheDocument();
  });

  it("renders all compliance table rows", () => {
    render(<SecurityPage />);
    const controls = [
      "Data encryption",
      "Access control",
      "Authentication",
      "Token storage",
      "Hosting",
      "Backups",
      "Monitoring",
      "Headers",
    ];
    controls.forEach((control) => {
      expect(screen.getByText(control)).toBeInTheDocument();
    });
  });

  it("renders compliance table details", () => {
    render(<SecurityPage />);
    expect(
      screen.getByText("AES-256 at rest, TLS 1.3 in transit")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Row-Level Security (RLS) on every table")
    ).toBeInTheDocument();
    expect(
      screen.getByText("CSP, HSTS, X-Frame-Options, X-Content-Type-Options")
    ).toBeInTheDocument();
  });

  it("renders the CTA section with contact and trial links", () => {
    render(<SecurityPage />);
    expect(
      screen.getByText("Questions about security?")
    ).toBeInTheDocument();
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
    expect(screen.getByText("Start Free Trial")).toBeInTheDocument();
  });

  it("renders JSON-LD structured data", () => {
    const { container } = render(<SecurityPage />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const json = JSON.parse(script?.textContent || "{}");
    expect(json["@type"]).toBe("WebPage");
    expect(json.name).toBe("Security — GrantLedger");
  });
});
