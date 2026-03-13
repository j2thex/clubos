import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { StaffSpinClient } from "../spin/staff-spin-client";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function StaffSpinPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ member?: string }>;
}) {
  const { clubSlug } = await params;
  const { member } = await searchParams;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
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

  const locale = await getServerLocale();

  return segments && segments.length > 0 ? (
    <StaffSpinClient
      clubId={club.id}
      initialMemberCode={member}
      segments={segments.map((s) => ({
        label: s.label,
        color: s.color ?? "#16a34a",
        labelColor: s.label_color ?? "#ffffff",
        probability: Number(s.probability),
      }))}
    />
  ) : (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-400 text-sm">
      {t(locale, "staff.wheelNotConfigured")}
    </div>
  );
}
