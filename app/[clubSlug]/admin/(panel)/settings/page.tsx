import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { LoginModeManager } from "../../login-mode-manager";
import { RoleManager } from "../../role-manager";
import { MembershipPeriodManager } from "../../membership-period-manager";
import { BrandingManager } from "../../branding-manager";
import { GalleryManager } from "../../gallery-manager";
import { TelegramConfigManager } from "../../telegram-config-manager";
import { WheelManager } from "../../wheel-manager";
import { NotificationLightManager } from "../../notification-light-manager";
import { TagManager } from "../../tag-manager";
import { LocationManager } from "../../location-manager";
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
    .select("id, login_mode, invite_only, invite_mode, hide_member_login, tags, telegram_bot_token, telegram_chat_id, notification_secret, latitude, longitude, address, city, country, spin_display_decimals, spin_cost")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const [{ data: branding }, { data: segments }, { data: roles }, { data: membershipPeriods }, { data: galleryImages }, { data: inviteButtons }] = await Promise.all([
    supabase
      .from("club_branding")
      .select("logo_url, cover_url, primary_color, secondary_color, hero_content, social_instagram, social_whatsapp, social_telegram, social_google_maps, social_website, google_place_id")
      .eq("club_id", club.id)
      .single(),
    supabase
      .from("wheel_configs")
      .select(
        "id, label, label_es, color, label_color, probability, display_order, active"
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
    supabase
      .from("club_invite_buttons")
      .select("id, type, label, url, icon_url, display_order")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <TagManager
        tags={club.tags ?? []}
        clubId={club.id}
        clubSlug={clubSlug}
      />
      <LocationManager
        location={{
          address: club.address ?? null,
          city: club.city ?? null,
          country: club.country ?? null,
          latitude: club.latitude ?? null,
          longitude: club.longitude ?? null,
        }}
        clubId={club.id}
        clubSlug={clubSlug}
      />
      <LoginModeManager
        loginMode={club.login_mode ?? "code_only"}
        inviteOnly={club.invite_only ?? false}
        inviteMode={club.invite_mode ?? "form"}
        hideMemberLogin={club.hide_member_login ?? false}
        inviteButtons={(inviteButtons ?? []).map((b) => ({
          id: b.id,
          type: b.type,
          label: b.label ?? null,
          url: b.url,
          icon_url: b.icon_url ?? null,
          display_order: b.display_order,
        }))}
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
          google_place_id: branding?.google_place_id ?? null,
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
      <CollapsibleSection title="Notification Light">
        <NotificationLightManager
          clubId={club.id}
          clubSlug={clubSlug}
          currentSecret={club.notification_secret ?? null}
        />
      </CollapsibleSection>
      <CollapsibleSection title="Spin Wheel">
        <WheelManager
          segments={(segments ?? []).map((s) => ({
            id: s.id,
            label: s.label,
            label_es: s.label_es ?? null,
            color: s.color ?? "#16a34a",
            label_color: s.label_color ?? "#ffffff",
            probability: Number(s.probability),
            display_order: s.display_order,
          }))}
          clubId={club.id}
          clubSlug={clubSlug}
          spinDisplayDecimals={club.spin_display_decimals ?? 0}
          spinCost={club.spin_cost ?? 1}
        />
      </CollapsibleSection>
    </div>
  );
}
