import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PlatformAdminClient } from "./client";

export default async function PlatformAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const { secret } = await searchParams;

  if (!secret || secret !== process.env.PLATFORM_ADMIN_SECRET) {
    redirect("/");
  }

  const supabase = createAdminClient();

  const { data: unclaimedClubs } = await supabase
    .from("clubs")
    .select("id, name, slug, claimed, invite_only, created_at, club_branding(logo_url, primary_color)")
    .eq("claimed", false)
    .order("created_at", { ascending: false });

  const clubs = (unclaimedClubs ?? []).map((c) => {
    const branding = Array.isArray(c.club_branding) ? c.club_branding[0] : c.club_branding;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      inviteOnly: c.invite_only,
      logoUrl: branding?.logo_url ?? null,
      primaryColor: branding?.primary_color ?? "#6b7280",
      createdAt: c.created_at,
    };
  });

  return <PlatformAdminClient clubs={clubs} secret={secret} />;
}
