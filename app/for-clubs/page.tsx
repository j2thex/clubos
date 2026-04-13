import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SalesHero } from "../_landing/sales-hero";
import { TheLoop } from "../_landing/the-loop";
import { QuestsPitch } from "../_landing/quests-pitch";
import { FeatureShowcases } from "../_landing/feature-showcases";
import { UseCases } from "../_landing/use-cases";
import { PortalsOverview } from "../_landing/portals-overview";
import { PricingTeaser } from "../_landing/pricing-teaser";
import { FinalCta } from "../_landing/final-cta";
import { LandingFooter } from "../_landing/landing-footer";

export const metadata: Metadata = {
  title: "For Clubs — osocios.club",
  description:
    "Spin. Win. Return. Turn every visit into loyalty with gamified quests, spin-the-wheel rewards, events, and member management — all under your brand.",
  alternates: { canonical: "/for-clubs" },
};

export const revalidate = 3600;

async function getLandingStats() {
  try {
    const supabase = createAdminClient();
    const [clubsResult, membersResult, eventsResult] = await Promise.all([
      supabase.from("clubs").select("id", { count: "exact", head: true }).eq("active", true).eq("approved", true),
      supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("events").select("id", { count: "exact", head: true }),
    ]);
    return {
      clubs: clubsResult.count ?? 0,
      members: membersResult.count ?? 0,
      events: eventsResult.count ?? 0,
    };
  } catch {
    return { clubs: 0, members: 0, events: 0 };
  }
}

export default async function ForClubsPage() {
  const locale = await getServerLocale();
  const stats = await getLandingStats();
  const tr = (key: string, params?: Record<string, string | number>) =>
    t(locale, key, params);

  return (
    <div className="min-h-screen">
      <SalesHero t={tr} stats={stats} />
      <TheLoop t={tr} />
      <QuestsPitch t={tr} />
      <FeatureShowcases t={tr} />
      <UseCases t={tr} />
      <PortalsOverview t={tr} />
      <PricingTeaser t={tr} />
      <FinalCta t={tr} />
      <LandingFooter t={tr} />
    </div>
  );
}
