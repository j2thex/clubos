// app/[clubSlug]/manifest.webmanifest/route.ts
import { getClub } from "@/lib/data/club";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubSlug: string }> },
) {
  const { clubSlug } = await params;
  const club = await getClub(clubSlug);

  if (!club) {
    return new Response("Not found", { status: 404 });
  }

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;

  const themeColor = branding?.primary_color ?? "#16a34a";

  const manifest = {
    name: club.name,
    short_name: club.name,
    start_url: `/${clubSlug}`,
    scope: `/${clubSlug}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: themeColor,
    icons: [
      {
        src: `/${clubSlug}/icon.png`,
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/${clubSlug}/icon.png?size=512`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
