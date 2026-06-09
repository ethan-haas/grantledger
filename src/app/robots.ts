import type { MetadataRoute } from "next";
import { getServerEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerEnv().NEXT_PUBLIC_APP_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
