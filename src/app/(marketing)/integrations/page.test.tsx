import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import IntegrationsPage from "./page";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a {...props}>{children}</a>,
}));

describe("IntegrationsPage", () => {
  it("renders the page heading", () => {
    render(<IntegrationsPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Connect your accounting tools"
    );
  });

  it("renders the Integrations label", () => {
    render(<IntegrationsPage />);
    expect(screen.getByText("Integrations")).toBeInTheDocument();
  });

  it("renders the QuickBooks Online integration card", () => {
    render(<IntegrationsPage />);
    expect(screen.getByText("QuickBooks Online")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Automatically sync expenses from QuickBooks Online/
      )
    ).toBeInTheDocument();
  });

  it("renders QuickBooks features", () => {
    render(<IntegrationsPage />);
    expect(
      screen.getByText("Automatic expense sync via Change Data Capture API")
    ).toBeInTheDocument();
    expect(
      screen.getByText("30-day lookback for historical transactions")
    ).toBeInTheDocument();
    // Encrypted token storage appears in both QuickBooks and Xero
    const tokenStorageElements = screen.getAllByText("Encrypted token storage (AES-256-GCM)");
    expect(tokenStorageElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the Xero integration card", () => {
    render(<IntegrationsPage />);
    expect(screen.getByText("Xero")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Import bank transactions and invoices from Xero/
      )
    ).toBeInTheDocument();
  });

  it("renders Xero features", () => {
    render(<IntegrationsPage />);
    expect(
      screen.getByText("BankTransactions and Invoices endpoint support")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Configurable sync frequency")
    ).toBeInTheDocument();
  });

  it("renders the CSV Import integration card", () => {
    render(<IntegrationsPage />);
    expect(screen.getByText("CSV Import")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Upload a CSV from any accounting system/
      )
    ).toBeInTheDocument();
  });

  it("renders CSV Import features", () => {
    render(<IntegrationsPage />);
    expect(
      screen.getByText("Guided column-mapping interface")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Duplicate detection on import")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Batch import with progress tracking")
    ).toBeInTheDocument();
  });

  it("renders all 3 integration cards", () => {
    render(<IntegrationsPage />);
    const names = ["QuickBooks Online", "Xero", "CSV Import"];
    names.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it("renders 'How it works' sections for each integration", () => {
    render(<IntegrationsPage />);
    const howItWorksHeadings = screen.getAllByText("How it works");
    expect(howItWorksHeadings).toHaveLength(3);
  });

  it("renders integration setup steps", () => {
    render(<IntegrationsPage />);
    expect(
      screen.getByText("Click 'Connect QuickBooks' in your settings")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Authorize GrantLedger in QuickBooks")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Click 'Connect Xero' in your settings")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Upload the file in GrantLedger")
    ).toBeInTheDocument();
  });

  it("renders the CTA section", () => {
    render(<IntegrationsPage />);
    expect(
      screen.getByText("Ready to connect your accounting?")
    ).toBeInTheDocument();
    expect(screen.getByText("Start Free Trial")).toBeInTheDocument();
  });

  it("renders JSON-LD structured data", () => {
    const { container } = render(<IntegrationsPage />);
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script).toBeInTheDocument();
    const json = JSON.parse(script?.textContent || "{}");
    expect(json["@type"]).toBe("WebPage");
    expect(json.name).toBe("Integrations — GrantLedger");
  });
});
