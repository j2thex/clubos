import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/discover", "/examples/"],
        disallow: [
          "/*/staff/",
          "/*/admin/",
          "/*/login",
          "/onboarding",
          "/platform-admin",
          "/api/",
        ],
      },
    ],
    sitemap: "https://osocios.club/sitemap.xml",
  };
}
