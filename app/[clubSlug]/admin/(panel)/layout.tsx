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

  const { data: branding } = await supabase
    .from("club_branding")
    .select("cover_url")
    .eq("club_id", club.id)
    .single();

  const coverUrl = branding?.cover_url ?? null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div
        className={`relative px-6 pt-10 bg-cover bg-center ${coverUrl ? "pb-6" : "pb-20 bg-gradient-to-br from-gray-800 to-gray-900"}`}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
      >
        {coverUrl && (
          <div className="absolute inset-0 bg-black/60" />
        )}
        <div className="relative flex items-start justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-white">Club Admin</h1>
            <p className="mt-1 text-gray-400 text-sm">{club.name}</p>
          </div>
          <LogoutButton clubSlug={clubSlug} />
        </div>
        <div className="relative flex gap-3 mt-4 max-w-2xl mx-auto">
          <a
            href={`/${clubSlug}/staff`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            Staff Console
          </a>
          <a
            href={`/${clubSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            Member Portal
          </a>
          <a
            href={`/${clubSlug}/public`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            Public Page
          </a>
        </div>
      </div>

      <div className={`relative z-10 ${coverUrl ? "mt-4" : "-mt-12 bg-gray-50 rounded-t-3xl pt-6"}`}>
        <div className="px-4 pb-10 max-w-2xl mx-auto space-y-6">
          {children}
        </div>
      </div>

      <AdminNav clubSlug={clubSlug} />
    </div>
  );
}
