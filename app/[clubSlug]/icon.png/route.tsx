// app/[clubSlug]/icon.png/route.ts
import { ImageResponse } from "next/og";
import { getClub } from "@/lib/data/club";

export const runtime = "nodejs";

async function fetchLogoAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/png";
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubSlug: string }> },
) {
  const { clubSlug } = await params;
  const club = await getClub(clubSlug);

  if (!club) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  const sizeParam = url.searchParams.get("size");
  const size = sizeParam === "512" ? 512 : 180;

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;

  const primaryColor = branding?.primary_color ?? "#16a34a";
  const logoUrl: string | null = branding?.logo_url ?? null;

  const logoDataUrl = logoUrl ? await fetchLogoAsDataUrl(logoUrl) : null;

  const monogramText = monogram(club.name);
  const monogramFontSize = Math.floor(size * 0.42);

  const body = logoDataUrl ? (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primaryColor,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoDataUrl}
        width={Math.floor(size * 0.8)}
        height={Math.floor(size * 0.8)}
        style={{ objectFit: "contain" }}
        alt=""
      />
    </div>
  ) : (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primaryColor,
        color: "#ffffff",
        fontSize: monogramFontSize,
        fontWeight: 700,
        fontFamily: "sans-serif",
        letterSpacing: -2,
      }}
    >
      {monogramText}
    </div>
  );

  return new ImageResponse(body, {
    width: size,
    height: size,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control":
        "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
