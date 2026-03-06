import { StaffNav } from "@/components/club/staff-nav";

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
