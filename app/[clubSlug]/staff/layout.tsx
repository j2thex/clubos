import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { StaffNav } from "@/components/club/staff-nav";

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
    title: club ? `Staff | ${club.name}` : "Staff Console",
    icons: { icon: "/favicon-staff.svg" },
  };
}

export default async function StaffLayout({
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
      <StaffNav clubSlug={clubSlug} />
    </div>
  );
}
