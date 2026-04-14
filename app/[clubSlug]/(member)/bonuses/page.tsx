import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { MemberSpinClient } from "../spin/spin-client";
import { CircleSlash } from "lucide-react";

function WheelPreload() {
  return (
    <>
      <link rel="preload" href="/wheel/hub.svg" as="image" type="image/svg+xml" />
      <link rel="preload" href="/wheel/overlay.svg" as="image" type="image/svg+xml" />
    </>
  );
}

export default async function BonusesPage({
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

  const [
    { data: club },
    { data: member },
    { data: segments },
    { data: recentSpins },
    { count: spinsDone },
    { data: pendingPrizes },
    locale,
  ] = await Promise.all([
    supabase
      .from("clubs")
      .select("id, name, spin_enabled, spin_display_decimals, spin_cost")
      .eq("id", session.club_id)
      .single(),
    supabase
      .from("members")
      .select("spin_balance, full_name, member_code")
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
      .select("id, outcome_label, outcome_value, status, created_at")
      .eq("member_id", session.member_id)
      .eq("club_id", session.club_id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("spins")
      .select("*", { count: "exact", head: true })
      .eq("member_id", session.member_id),
    supabase
      .from("spins")
      .select("id, outcome_label, outcome_value, created_at")
      .eq("member_id", session.member_id)
      .eq("club_id", session.club_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    getServerLocale(),
  ]);

  const totalSpins = spinsDone ?? 0;
  const level = Math.min(10, Math.floor(totalSpins / 5) + 1);

  if (club?.spin_enabled === false) {
    return (
      <div className="min-h-screen" style={{ background: "var(--m-surface-sunken)" }}>
        <header
          className="border-b px-5 pt-12 pb-5"
          style={{
            background: "var(--m-surface)",
            borderColor: "var(--m-border)",
            paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)",
          }}
        >
          <p className="m-caption">BONUSES</p>
          <h1 className="m-display mt-1 text-[color:var(--m-ink)]">
            {t(locale, "spin.title")}
          </h1>
        </header>
        <div className="mx-auto max-w-md px-5 pb-10 pt-5">
          <div className="m-card p-10 text-center">
            <CircleSlash className="mx-auto mb-3 h-10 w-10 text-[color:var(--m-ink-muted)]" />
            <p className="text-sm text-[color:var(--m-ink-muted)]">
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
      <div className="min-h-screen" style={{ background: "var(--m-surface-sunken)" }}>
        <header
          className="border-b px-5 pt-12 pb-5"
          style={{
            background: "var(--m-surface)",
            borderColor: "var(--m-border)",
            paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)",
          }}
        >
          <p className="m-caption">BONUSES</p>
          <h1 className="m-display mt-1 text-[color:var(--m-ink)]">
            {t(locale, "spin.title")}
          </h1>
        </header>
        <div className="mx-auto max-w-md px-5 pb-10 pt-5">
          <div className="m-card p-10 text-center text-sm text-[color:var(--m-ink-muted)]">
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
        totalSpins={totalSpins}
        level={level}
        segments={segments.map((s) => ({
          label: locale === "es" && s.label_es ? s.label_es : s.label,
          color: s.color ?? "#16a34a",
          labelColor: s.label_color ?? "#ffffff",
          probability: Number(s.probability),
        }))}
        pendingPrizes={
          pendingPrizes?.map((s) => ({
            id: s.id,
            outcomeLabel: s.outcome_label,
            outcomeValue: s.outcome_value,
            createdAt: s.created_at,
          })) ?? []
        }
        recentSpins={
          recentSpins?.map((s) => ({
            id: s.id,
            outcomeLabel: s.outcome_label,
            outcomeValue: s.outcome_value,
            status: s.status as "pending" | "fulfilled",
            createdAt: s.created_at,
          })) ?? []
        }
        displayDecimals={club?.spin_display_decimals ?? 0}
        spinCost={club?.spin_cost ?? 1}
      />
    </>
  );
}
