import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { LogoutButton } from "../logout-button";
import { AdminNav } from "@/components/club/admin-nav";

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
    title: club ? `Admin | ${club.name}` : "Club Admin",
    icons: { icon: "/favicon-admin.svg" },
  };
}

export default async function AdminPanelLayout({
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
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 pt-10 pb-12">
        <div className="flex items-start justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-white">Club Admin</h1>
            <p className="mt-1 text-gray-400 text-sm">{club.name}</p>
          </div>
          <LogoutButton clubSlug={clubSlug} />
        </div>
        <div className="flex gap-3 mt-4 max-w-2xl mx-auto">
          <a
            href={`/${clubSlug}/staff`}
            className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            View Staff Page
          </a>
          <a
            href={`/${clubSlug}`}
            className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            View Member Page
          </a>
        </div>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-2xl mx-auto space-y-6">
        {children}
      </div>

      <AdminNav clubSlug={clubSlug} />
    </div>
  );
}
