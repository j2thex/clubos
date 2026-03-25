import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";
export const alt = "Club profile on osocios.club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("name, tags, club_branding(primary_color, logo_url)")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  const branding = club
    ? Array.isArray(club.club_branding)
      ? club.club_branding[0]
      : club.club_branding
    : null;

  const primaryColor = branding?.primary_color ?? "#16a34a";
  const clubName = club?.name ?? clubSlug;
  const tags = (club?.tags as string[] | null) ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: primaryColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            fontSize: 36,
            fontWeight: 700,
            color: "white",
          }}
        >
          {clubName.charAt(0).toUpperCase()}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            color: "white",
            letterSpacing: "-1px",
          }}
        >
          {clubName}
        </div>
        {tags.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 20,
            }}
          >
            {tags.slice(0, 4).map((tag) => (
              <div
                key={tag}
                style={{
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: `${primaryColor}33`,
                  color: primaryColor,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 14,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "3px",
            textTransform: "uppercase" as const,
          }}
        >
          osocios.club
        </div>
      </div>
    ),
    { ...size }
  );
}
