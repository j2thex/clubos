import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Hero } from "./_landing/hero";
import { PlatformOverview } from "./_landing/platform-overview";
import { FeatureGrid } from "./_landing/feature-grid";
import { HowItWorks } from "./_landing/how-it-works";
import { UseCases } from "./_landing/use-cases";
import { ServiceFinder } from "./_landing/service-finder";
import { MembershipExplorer } from "./_landing/membership-explorer";
import { ClubDirectory } from "./_landing/club-directory";
import { FinalCta } from "./_landing/final-cta";
import { LandingFooter } from "./_landing/landing-footer";

export const revalidate = 3600;

async function getLandingStats() {
  try {
    const supabase = createAdminClient();
    const [clubsResult, membersResult, eventsResult] = await Promise.all([
      supabase.from("clubs").select("id", { count: "exact", head: true }).eq("active", true),
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

async function getPublicClubs() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("clubs")
      .select("name, slug, club_branding(logo_url, cover_url, primary_color)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(20);
    return (data ?? []).map((c) => {
      const branding = Array.isArray(c.club_branding) ? c.club_branding[0] : c.club_branding;
      return {
        name: c.name,
        slug: c.slug,
        logo_url: branding?.logo_url ?? null,
        cover_url: branding?.cover_url ?? null,
        primary_color: branding?.primary_color ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function getPublicServices() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("services")
      .select("id, title, description, price, image_url, clubs(name, slug, club_branding(logo_url, primary_color))")
      .eq("active", true)
      .eq("is_public", true)
      .order("display_order", { ascending: true })
      .limit(50);
    return (data ?? []).map((s) => {
      const club = Array.isArray(s.clubs) ? s.clubs[0] : s.clubs;
      const branding = club ? (Array.isArray(club.club_branding) ? club.club_branding[0] : club.club_branding) : null;
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        price: s.price,
        image_url: s.image_url,
        club_name: club?.name ?? "",
        club_slug: club?.slug ?? "",
        club_logo: branding?.logo_url ?? null,
        club_color: branding?.primary_color ?? null,
      };
    });
  } catch {
    return [];
  }
}

async function getMembershipDeals() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("membership_periods")
      .select("id, name, duration_months, price, clubs(name, slug, club_branding(logo_url, primary_color))")
      .eq("active", true)
      .not("price", "is", null)
      .order("price", { ascending: true })
      .limit(30);
    return (data ?? []).map((d) => {
      const club = Array.isArray(d.clubs) ? d.clubs[0] : d.clubs;
      const branding = club ? (Array.isArray(club.club_branding) ? club.club_branding[0] : club.club_branding) : null;
      return {
        id: d.id,
        name: d.name,
        duration_months: d.duration_months,
        price: d.price as number,
        club_name: club?.name ?? "",
        club_slug: club?.slug ?? "",
        club_logo: branding?.logo_url ?? null,
        club_color: branding?.primary_color ?? null,
      };
    });
  } catch {
    return [];
  }
}

export default async function Home() {
  const locale = await getServerLocale();
  const [stats, clubs, services, deals] = await Promise.all([
    getLandingStats(),
    getPublicClubs(),
    getPublicServices(),
    getMembershipDeals(),
  ]);

  const tr = (key: string, params?: Record<string, string | number>) =>
    t(locale, key, params);

  return (
    <div className="min-h-screen">
      <Hero t={tr} stats={stats} />
      <PlatformOverview t={tr} />
      <FeatureGrid t={tr} />
      <HowItWorks t={tr} />
      <UseCases t={tr} />
      <ServiceFinder
        services={services}
        labels={{
          title: tr("landing.serviceFinderTitle"),
          subtitle: tr("landing.serviceFinderSubtitle"),
          placeholder: tr("landing.serviceFinderPlaceholder"),
          noResults: tr("landing.serviceFinderNoResults"),
          free: tr("landing.serviceFree"),
          viewClub: tr("landing.directoryViewClub"),
        }}
      />
      <MembershipExplorer
        deals={deals}
        labels={{
          title: tr("landing.membershipTitle"),
          subtitle: tr("landing.membershipSubtitle"),
          duration: tr("landing.membershipDuration"),
          viewClub: tr("landing.directoryViewClub"),
        }}
      />
      <ClubDirectory t={tr} clubs={clubs} />
      <FinalCta t={tr} />
      <LandingFooter t={tr} />
    </div>
  );
}
