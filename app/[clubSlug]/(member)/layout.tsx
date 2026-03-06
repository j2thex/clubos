import { MemberNav } from "@/components/club/member-nav";

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
