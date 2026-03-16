import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { LoginModeManager } from "../../login-mode-manager";
import { RoleManager } from "../../role-manager";
import { MembershipPeriodManager } from "../../membership-period-manager";
import { BrandingManager } from "../../branding-manager";
import { GalleryManager } from "../../gallery-manager";
import { TelegramConfigManager } from "../../telegram-config-manager";
import { WheelManager } from "../../wheel-manager";
import { CollapsibleSection } from "@/components/collapsible-section";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, login_mode, invite_only, telegram_bot_token, telegram_chat_id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const [{ data: branding }, { data: segments }, { data: roles }, { data: membershipPeriods }, { data: galleryImages }] = await Promise.all([
    supabase
      .from("club_branding")
      .select("logo_url, cover_url, primary_color, secondary_color, hero_content, social_instagram, social_whatsapp, social_telegram, social_google_maps, social_website")
      .eq("club_id", club.id)
      .single(),
    supabase
      .from("wheel_configs")
      .select(
        "id, label, color, label_color, probability, display_order, active"
      )
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_roles")
      .select("id, name, display_order")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("membership_periods")
      .select("id, name, duration_months, display_order")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("club_gallery")
      .select("id, image_url, caption")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <LoginModeManager
        loginMode={club.login_mode ?? "code_only"}
        inviteOnly={club.invite_only ?? false}
        clubId={club.id}
        clubSlug={clubSlug}
      />
      <RoleManager
        roles={roles ?? []}
        clubId={club.id}
        clubSlug={clubSlug}
      />
      <MembershipPeriodManager
        periods={(membershipPeriods ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          duration_months: p.duration_months,
        }))}
        clubId={club.id}
        clubSlug={clubSlug}
      />
      <BrandingManager
        branding={{
          logo_url: branding?.logo_url ?? null,
          cover_url: branding?.cover_url ?? null,
          primary_color: branding?.primary_color ?? "#16a34a",
          secondary_color: branding?.secondary_color ?? "#052e16",
          hero_content: branding?.hero_content ?? null,
          social_instagram: branding?.social_instagram ?? null,
          social_whatsapp: branding?.social_whatsapp ?? null,
          social_telegram: branding?.social_telegram ?? null,
          social_google_maps: branding?.social_google_maps ?? null,
          social_website: branding?.social_website ?? null,
        }}
        clubId={club.id}
        clubSlug={clubSlug}
      />
      <GalleryManager
        images={(galleryImages ?? []).map((g) => ({
          id: g.id,
          image_url: g.image_url,
          caption: g.caption ?? null,
        }))}
        clubId={club.id}
        clubSlug={clubSlug}
      />
      <CollapsibleSection title="Telegram Notifications">
        <TelegramConfigManager
          botToken={club.telegram_bot_token ?? null}
          chatId={club.telegram_chat_id ?? null}
          clubId={club.id}
          clubSlug={clubSlug}
        />
      </CollapsibleSection>
      <CollapsibleSection title="Spin Wheel">
        <WheelManager
          segments={(segments ?? []).map((s) => ({
            id: s.id,
            label: s.label,
            color: s.color ?? "#16a34a",
            label_color: s.label_color ?? "#ffffff",
            probability: Number(s.probability),
            display_order: s.display_order,
          }))}
          clubId={club.id}
          clubSlug={clubSlug}
        />
      </CollapsibleSection>
    </div>
  );
}
