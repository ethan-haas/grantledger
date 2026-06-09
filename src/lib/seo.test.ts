import { describe, it, expect, vi } from "vitest";

// Mock framer-motion to avoid module resolution issues in vitest
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === "div" || prop === "span" || prop === "section" || prop === "li" || prop === "p" || prop === "nav" || prop === "ul" || prop === "h1" || prop === "h2" || prop === "a" || prop === "button") {
          return (props: Record<string, unknown>) => props.children;
        }
        return undefined;
      },
    }
  ),
  AnimatePresence: ({ children }: { children: unknown }) => children,
  useReducedMotion: () => false,
  useInView: () => true,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children }: { children: unknown }) => children,
}));

// Mock @clerk/nextjs
vi.mock("@clerk/nextjs", () => ({
  SignedIn: ({ children }: { children: unknown }) => children,
  SignedOut: ({ children }: { children: unknown }) => children,
  UserButton: () => null,
}));

// Import metadata from marketing layout (covers homepage)
import { metadata as marketingLayoutMeta } from "@/app/(marketing)/layout";

// Import metadata from individual pages that export it
import { metadata as methodologyMeta } from "@/app/(marketing)/methodology/page";
import { metadata as termsMeta } from "@/app/(marketing)/terms/page";
import { metadata as privacyMeta } from "@/app/(marketing)/privacy/page";
import { metadata as resourcesMeta } from "@/app/(marketing)/resources/page";

describe("SEO - Marketing Layout (Homepage)", () => {
  it("has a title", () => {
    expect(marketingLayoutMeta.title).toBeDefined();
    expect(typeof marketingLayoutMeta.title).toBe("string");
    expect((marketingLayoutMeta.title as string).length).toBeGreaterThan(0);
  });

  it("has a description", () => {
    expect(marketingLayoutMeta.description).toBeDefined();
    expect(typeof marketingLayoutMeta.description).toBe("string");
    expect(marketingLayoutMeta.description!.length).toBeGreaterThan(0);
  });

  it("has OpenGraph metadata", () => {
    expect(marketingLayoutMeta.openGraph).toBeDefined();
    expect(marketingLayoutMeta.openGraph!.title).toBeDefined();
    expect(marketingLayoutMeta.openGraph!.description).toBeDefined();
  });

  it("has a canonical URL", () => {
    expect(marketingLayoutMeta.alternates).toBeDefined();
    expect(marketingLayoutMeta.alternates!.canonical).toBeDefined();
  });
});

describe("SEO - Methodology Page", () => {
  it("has a title", () => {
    expect(methodologyMeta.title).toBeDefined();
    expect(typeof methodologyMeta.title).toBe("string");
  });

  it("has a description", () => {
    expect(methodologyMeta.description).toBeDefined();
    expect(typeof methodologyMeta.description).toBe("string");
    expect(methodologyMeta.description!.length).toBeGreaterThan(50);
  });

  it("has a canonical URL pointing to /methodology", () => {
    expect(methodologyMeta.alternates).toBeDefined();
    expect(methodologyMeta.alternates!.canonical).toBe("/methodology");
  });
});

describe("SEO - Terms Page", () => {
  it("has a title", () => {
    expect(termsMeta.title).toBeDefined();
  });

  it("has a canonical URL pointing to /terms", () => {
    expect(termsMeta.alternates).toBeDefined();
    expect(termsMeta.alternates!.canonical).toBe("/terms");
  });
});

describe("SEO - Privacy Page", () => {
  it("has a title", () => {
    expect(privacyMeta.title).toBeDefined();
  });

  it("has a canonical URL pointing to /privacy", () => {
    expect(privacyMeta.alternates).toBeDefined();
    expect(privacyMeta.alternates!.canonical).toBe("/privacy");
  });
});

describe("SEO - Resources Page", () => {
  it("has a title", () => {
    expect(resourcesMeta.title).toBeDefined();
  });

  it("has a description", () => {
    expect(resourcesMeta.description).toBeDefined();
    expect(typeof resourcesMeta.description).toBe("string");
  });

  it("has a canonical URL", () => {
    expect(resourcesMeta.alternates).toBeDefined();
    expect(resourcesMeta.alternates!.canonical).toBeDefined();
  });
});
