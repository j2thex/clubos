import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { MemberSpinClient } from "./spin-client";
import { CircleSlash } from "lucide-react";

function WheelPreload() {
  return (
    <>
      <link rel="preload" href="/wheel/hub.svg" as="image" type="image/svg+xml" />
      <link rel="preload" href="/wheel/overlay.svg" as="image" type="image/svg+xml" />
    </>
  );
}

export default async function MemberSpinPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const session = await getMemberFromCookie();

  if (!session) {
    redirect(`/${clubSlug}/login`);
  }

  const supabase = createAdminClient();

  // Fetch all data in parallel
  const [{ data: club }, { data: member }, { data: segments }, { data: recentSpins }, locale] =
    await Promise.all([
      supabase
        .from("clubs")
        .select("spin_enabled, spin_display_decimals, spin_cost")
        .eq("id", session.club_id)
        .single(),
      supabase
        .from("members")
        .select("spin_balance")
        .eq("id", session.member_id)
        .single(),
      supabase
        .from("wheel_configs")
        .select("label, label_es, color, label_color, probability")
        .eq("club_id", session.club_id)
        .eq("active", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("spins")
        .select("id, outcome_label, outcome_value, created_at")
        .eq("member_id", session.member_id)
        .eq("club_id", session.club_id)
        .order("created_at", { ascending: false })
        .limit(10),
      getServerLocale(),
    ]);

  if (club?.spin_enabled === false) {
    return (
      <div className="min-h-screen club-page-bg">
        <div className="club-hero px-6 pt-10 pb-12 text-center">
          <h1 className="text-2xl font-bold text-white">{t(locale, "spin.title")}</h1>
        </div>
        <div className="px-4 -mt-6 pb-20 max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <CircleSlash className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              {locale === "es"
                ? "La máquina de tiradas no está disponible actualmente"
                : "Spin machine is currently unavailable"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!segments || segments.length === 0) {
    return (
      <div className="min-h-screen club-page-bg">
        <div className="club-hero px-6 pt-10 pb-12 text-center">
          <h1 className="text-2xl font-bold text-white">{t(locale, "spin.title")}</h1>
        </div>
        <div className="px-4 -mt-6 pb-20 max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-400 text-sm">
            {t(locale, "staff.wheelNotConfigured")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <WheelPreload />
    <MemberSpinClient
      clubSlug={clubSlug}
      balance={member?.spin_balance ?? 0}
      segments={segments.map((s) => ({
        label: locale === "es" && s.label_es ? s.label_es : s.label,
        color: s.color ?? "#16a34a",
        labelColor: s.label_color ?? "#ffffff",
        probability: Number(s.probability),
      }))}
      recentSpins={
        recentSpins?.map((s) => ({
          id: s.id,
          outcomeLabel: s.outcome_label,
          outcomeValue: s.outcome_value,
          createdAt: s.created_at,
        })) ?? []
      }
      displayDecimals={club?.spin_display_decimals ?? 0}
      spinCost={club?.spin_cost ?? 1}
    />
    </>
  );
}
