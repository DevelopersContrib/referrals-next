import type { MetadataRoute } from "next";
import { canonicalOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = canonicalOrigin(
    process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL
  );

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
