import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  // Fetch club + branding
  const { data: club } = await supabase
    .from("clubs")
    .select("*, club_branding(*)")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

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
