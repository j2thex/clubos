import type { Metadata } from "next";
import { getClub } from "@/lib/data/club";
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
  const club = await getClub(clubSlug);

  return {
    title: club ? `Member | ${club.name}` : "Member Portal",
    manifest: `/${clubSlug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      title: club?.name ?? "Member Portal",
      statusBarStyle: "default",
    },
    icons: {
      icon: "/favicon-member.svg",
      apple: [{ url: `/${clubSlug}/icon.png`, sizes: "180x180" }],
    },
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
  const club = await getClub(clubSlug);

  if (club && !club.approved) {
    return <PendingApproval clubName={club.name} clubSlug={clubSlug} />;
  }

  return (
    <div className="pb-20 member-portal">
      <div className="absolute top-2 right-4 z-50">
        <LanguageSwitcher />
      </div>
      {children}
      <MemberNav clubSlug={clubSlug} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
