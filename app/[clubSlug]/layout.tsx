import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClub } from "@/lib/data/club";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug } = await params;
  const club = await getClub(clubSlug);
  return {
    manifest: `/${clubSlug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      title: club?.name ?? "Club",
      statusBarStyle: "default",
    },
  };
}

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const club = await getClub(clubSlug);

  if (!club) notFound();

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;

  return (
    <div
      style={{
        "--club-primary": branding?.primary_color ?? "#16a34a",
        "--club-secondary": branding?.secondary_color ?? "#052e16",
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
