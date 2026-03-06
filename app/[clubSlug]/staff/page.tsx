import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { StaffSpinClient } from "./spin/staff-spin-client";

export default async function StaffDashboard({
  params,
}: {
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

  const { data: segments } = await supabase
    .from("wheel_configs")
    .select("label, color, label_color, probability")
    .eq("club_id", club.id)
    .eq("active", true)
    .order("display_order", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 pt-10 pb-12">
        <h1 className="text-2xl font-bold text-white">Staff Console</h1>
        <p className="mt-1 text-gray-400 text-sm">{club.name}</p>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-md mx-auto space-y-6">
        {/* Spin the Wheel */}
        {segments && segments.length > 0 ? (
          <StaffSpinClient
            clubId={club.id}
            segments={segments.map((s) => ({
              label: s.label,
              color: s.color ?? "#16a34a",
              labelColor: s.label_color ?? "#ffffff",
              probability: Number(s.probability),
            }))}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-400 text-sm">
            Wheel not configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
