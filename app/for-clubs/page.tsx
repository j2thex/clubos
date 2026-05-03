import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFaqPageJsonLd } from "@/lib/structured-data";

const FOR_CLUBS_FAQS = [
  {
    question: "What is osocios.club?",
    answer:
      "A membership platform for private clubs. You get a public profile, a member portal, a staff console, and an admin panel — all white-labelled to your brand, all under one roof.",
  },
  {
    question: "Is the platform white-label?",
    answer:
      "Yes. Members see your club's name, logo, and colours. The osocios brand stays in the background.",
  },
  {
    question: "Is it bilingual?",
    answer:
      "English and Spanish are wired in from day one. Members and staff get the language they prefer; you only need to write your content once if you stick to one language, or in both if you want to reach both audiences.",
  },
  {
    question: "Can I bring my existing members across?",
    answer:
      "Yes. We can help you import an existing list during onboarding so your regulars don't lose their history.",
  },
  {
    question: "How does the gamification actually work?",
    answer:
      "Members complete quests you define — follow on Instagram, attend an event, refer a friend, leave a review. Each quest awards spins. Spins fuel a custom prize wheel where you set the rewards. The loop is: spin, win, return.",
  },
  {
    question: "What does it cost?",
    answer:
      "Pricing depends on your club size and which features you use. Reach out via the contact page and we'll talk through what makes sense for you.",
  },
];
import { SalesHero } from "../_landing/sales-hero";
import { TheLoop } from "../_landing/the-loop";
import { QuestsPitch } from "../_landing/quests-pitch";
import { FeatureShowcases } from "../_landing/feature-showcases";
import { UseCases } from "../_landing/use-cases";
import { PortalsOverview } from "../_landing/portals-overview";
import { PricingTeaser } from "../_landing/pricing-teaser";
import { FinalCta } from "../_landing/final-cta";
import { LandingFooter } from "../_landing/landing-footer";
import { TopNav } from "../_landing/top-nav";

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

  const faqJsonLd = getFaqPageJsonLd(FOR_CLUBS_FAQS);

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <TopNav />
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
