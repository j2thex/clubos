import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function StaffConsoleLayout({
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 pt-10 pb-12">
        <h1 className="text-2xl font-bold text-white">Staff Console</h1>
        <p className="mt-1 text-gray-400 text-sm">{club.name}</p>
        <div className="mt-4">
          <a
            href={`/${clubSlug}`}
            className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            View Member Page
          </a>
        </div>
      </div>
      <div className="px-4 -mt-6 pb-10 max-w-md mx-auto space-y-6">
        {children}
      </div>
    </div>
  );
}
