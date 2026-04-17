import { notFound } from "next/navigation";
import { getClub } from "@/lib/data/club";

export default async function StaffOperationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const club = await getClub(clubSlug);

  if (!club || !club.operations_module_enabled) {
    notFound();
  }

  return <>{children}</>;
}
