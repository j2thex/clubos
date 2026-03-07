import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { MemberNav } from "@/components/club/member-nav";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("slug", clubSlug)
    .single();

  return {
    title: club ? `Member | ${club.name}` : "Member Portal",
    icons: { icon: "/favicon-member.svg" },
  };
}

export default async function MemberLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;

  return (
    <div className="pb-20">
      {children}
      <MemberNav clubSlug={clubSlug} />
    </div>
  );
}
