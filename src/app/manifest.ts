import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GrantLedger — Federal Grant Expense Categorization",
    short_name: "GrantLedger",
    description:
      "AI-powered expense categorization for federal grants. Audit-ready in minutes.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
  };
}
