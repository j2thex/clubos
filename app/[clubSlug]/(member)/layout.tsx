import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { MemberNav } from "@/components/club/member-nav";
import { LanguageSwitcher } from "@/lib/i18n/switcher";
import { PendingApproval } from "@/components/pending-approval";
import { Toaster } from "sonner";

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
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("name, approved")
    .eq("slug", clubSlug)
    .single();

  if (club && !club.approved) {
    return <PendingApproval clubName={club.name} clubSlug={clubSlug} />;
  }

  return (
    <div className="pb-20">
      <div className="absolute top-2 right-4 z-50">
        <LanguageSwitcher />
      </div>
      {children}
      <MemberNav clubSlug={clubSlug} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
