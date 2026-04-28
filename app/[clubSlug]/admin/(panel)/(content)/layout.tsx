import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { AdminContentSubNav } from "@/components/club/admin-content-subnav";

export default async function AdminContentLayout({
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
    .select("operations_module_enabled")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const opsEnabled = !!club.operations_module_enabled;

  return (
    <div className="space-y-4">
      <AdminContentSubNav clubSlug={clubSlug} opsEnabled={opsEnabled} />
      {children}
    </div>
  );
}
