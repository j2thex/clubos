import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { VERTICALS } from "./examples/verticals";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://osocios.club";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/discover`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/examples`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const verticalPages: MetadataRoute.Sitemap = VERTICALS.map((v) => ({
    url: `${SITE_URL}/examples/${v.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  let clubPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createAdminClient();
    const { data: clubs } = await supabase
      .from("clubs")
      .select("slug, updated_at")
      .eq("active", true)
      .eq("approved", true);

    if (clubs) {
      clubPages = clubs.map((club) => ({
        url: `${SITE_URL}/${club.slug}/public`,
        lastModified: club.updated_at ? new Date(club.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Sitemap still works without dynamic clubs
  }

  return [...staticPages, ...verticalPages, ...clubPages];
}
