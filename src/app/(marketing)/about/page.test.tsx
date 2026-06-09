import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AboutPage from "./page";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a {...props}>{children}</a>,
}));

describe("AboutPage", () => {
  it("renders the page heading with the mission statement", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Built for the nonprofit finance directors who spend more time on compliance than on mission"
    );
  });

  it("renders the 'Our mission' label", () => {
    render(<AboutPage />);
    expect(screen.getByText("Our mission")).toBeInTheDocument();
  });

  it("renders the mission description paragraph", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/nonprofit teams should spend their time advancing their mission/)
    ).toBeInTheDocument();
  });

  it("renders the 'Why we built GrantLedger' section", () => {
    render(<AboutPage />);
    expect(
      screen.getByText("Why we built GrantLedger")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/single misclassified expense can trigger audit findings/)
    ).toBeInTheDocument();
  });

  it("renders all 4 value cards", () => {
    render(<AboutPage />);
    const valueTitles = [
      "Compliance without complexity",
      "Accuracy you can trust",
      "Built for nonprofits",
      "Transparent by default",
    ];
    valueTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it("renders value descriptions", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/Federal grant regulations are complex enough/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Full audit trails, clear methodology documentation/)
    ).toBeInTheDocument();
  });

  it("renders the team section heading", () => {
    render(<AboutPage />);
    expect(screen.getByText("Our team")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A focused team building purpose-built tools for nonprofit compliance."
      )
    ).toBeInTheDocument();
  });

  it("renders all 3 team departments", () => {
    render(<AboutPage />);
    const departments = ["Leadership", "Engineering", "Compliance"];
    departments.forEach((dept) => {
      expect(screen.getByText(dept)).toBeInTheDocument();
    });
  });

  it("renders team department descriptions", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/deep expertise in federal grant compliance/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/security-first architecture/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/56 selected items of cost/)
    ).toBeInTheDocument();
  });

  it("renders the CTA section", () => {
    render(<AboutPage />);
    expect(
      screen.getByText("Ready to simplify grant compliance?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Start Your Free 14-Day Trial")
    ).toBeInTheDocument();
    expect(screen.getByText("Get in Touch")).toBeInTheDocument();
  });

  it("renders JSON-LD structured data", () => {
    const { container } = render(<AboutPage />);
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script).toBeInTheDocument();
    const json = JSON.parse(script?.textContent || "{}");
    expect(json["@type"]).toBe("AboutPage");
    expect(json.name).toBe("About GrantLedger");
  });
});
