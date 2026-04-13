import { createAdminClient } from "@/lib/supabase/admin";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { SetupChecklistCard } from "./setup-checklist-card";

export async function SetupChecklist({
  clubId,
  clubSlug,
}: {
  clubId: string;
  clubSlug: string;
}) {
  const locale = await getServerLocale();
  const tr = (key: string, params?: Record<string, string | number>) =>
    t(locale, key, params);

  const supabase = createAdminClient();

  const [
    { data: branding },
    { data: clubRow },
    { count: questCount },
    { count: eventCount },
    { count: memberCount },
  ] = await Promise.all([
    supabase
      .from("club_branding")
      .select("logo_url, primary_color")
      .eq("club_id", clubId)
      .maybeSingle(),
    supabase
      .from("clubs")
      .select("spin_enabled")
      .eq("id", clubId)
      .maybeSingle(),
    supabase
      .from("quests")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId),
    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("is_system_member", false)
      .eq("is_staff", false),
  ]);

  const items = [
    {
      key: "branding",
      label: tr("adminSetup.branding"),
      ctaLabel: tr("adminSetup.brandingCta"),
      href: `/${clubSlug}/admin/settings`,
      done: Boolean(branding?.logo_url && branding?.primary_color),
    },
    {
      key: "quest",
      label: tr("adminSetup.quest"),
      ctaLabel: tr("adminSetup.questCta"),
      href: `/${clubSlug}/admin/quests`,
      done: (questCount ?? 0) > 0,
    },
    {
      key: "wheel",
      label: tr("adminSetup.wheel"),
      ctaLabel: tr("adminSetup.wheelCta"),
      href: `/${clubSlug}/admin/settings#spin-wheel`,
      done: clubRow?.spin_enabled === true,
    },
    {
      key: "event",
      label: tr("adminSetup.event"),
      ctaLabel: tr("adminSetup.eventCta"),
      href: `/${clubSlug}/admin/events`,
      done: (eventCount ?? 0) > 0,
    },
    {
      key: "member",
      label: tr("adminSetup.member"),
      ctaLabel: tr("adminSetup.memberCta"),
      href: `/${clubSlug}/admin`,
      done: (memberCount ?? 0) > 0,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return null;

  return (
    <SetupChecklistCard
      clubId={clubId}
      title={tr("adminSetup.title")}
      subtitle={tr("adminSetup.subtitle", {
        done: doneCount,
        total: items.length,
      })}
      dismissLabel={tr("adminSetup.dismiss")}
      items={items}
    />
  );
}
