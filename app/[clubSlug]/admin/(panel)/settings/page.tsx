import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { LoginModeManager } from "../../login-mode-manager";
import { VisibilityManager } from "../../visibility-manager";
import type { ClubVisibility } from "../../actions";
import { RoleManager } from "../../role-manager";
import { MembershipPeriodManager } from "../../membership-period-manager";
import { BrandingManager } from "../../branding-manager";
import { GalleryManager } from "../../gallery-manager";
import { TelegramConfigManager } from "../../telegram-config-manager";
import { TelegramBotManager } from "../../telegram-bot-manager";
import { WheelManager } from "../../wheel-manager";
import { NotificationLightManager } from "../../notification-light-manager";
import { TagManager } from "../../tag-manager";
import { LocationManager } from "../../location-manager";
import { WorkingHoursManager } from "../../working-hours-manager";
import { CollapsibleSection } from "@/components/collapsible-section";
import Link from "next/link";
import { EmailCampaignManager } from "../../email-campaign-manager";
import { getCampaignHistory, getEmailStats } from "../../email-actions";
import { getOwnerFromCookie } from "@/lib/auth";
import { QrCodesManager } from "../../qr-codes-manager";
import { OperationsModuleManager } from "../../operations-module-manager";
import { ConsumptionLimitManager } from "../../consumption-limit-manager";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, login_mode, invite_only, invite_mode, hide_member_login, preregistration_enabled, auto_registration, tags, visibility, requested_visibility, telegram_bot_token, telegram_chat_id, notification_secret, latitude, longitude, address, city, country, spin_enabled, working_hours, spin_display_decimals, spin_cost, telegram_bot_enabled, telegram_bot_referral_name, telegram_bot_registration_price, telegram_bot_welcome_message, telegram_bot_keywords, telegram_bot_age_restricted, operations_module_enabled, currency_mode, monthly_consumption_limit_grams")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const [{ data: branding }, { data: segments }, { data: roles }, { data: membershipPeriods }, { data: galleryImages }, { data: inviteButtons }, { data: emailQuests }, { data: emailEvents }, { data: emailOffers }] = await Promise.all([
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
      .select("id, name, duration_months, price, display_order, is_default")
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
    supabase
      .from("quests")
      .select("id, title")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("events")
      .select("id, title")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("date", { ascending: false })
      .limit(20),
    supabase
      .from("club_offers")
      .select("id, offer_catalog(name)")
      .eq("club_id", club.id),
  ]);

  // Fetch email-specific data
  const [emailCount, campaigns, ownerSession] = await Promise.all([
    getEmailStats(club.id),
    getCampaignHistory(club.id),
    getOwnerFromCookie(),
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
      <CollapsibleSection title="Working Hours">
        <WorkingHoursManager
          clubId={club.id}
          clubSlug={clubSlug}
          initialHours={club.working_hours as Record<string, { open: string; close: string } | null> | null}
        />
      </CollapsibleSection>
      <CollapsibleSection title="QR Codes">
        <QrCodesManager clubSlug={clubSlug} />
      </CollapsibleSection>
      <VisibilityManager
        visibility={(club.visibility ?? "public") as ClubVisibility}
        requestedVisibility={(club.requested_visibility ?? "public") as ClubVisibility}
        clubId={club.id}
        clubSlug={clubSlug}
      />
      <LoginModeManager
        loginMode={club.login_mode ?? "code_only"}
        inviteOnly={club.invite_only ?? false}
        inviteMode={club.invite_mode ?? "form"}
        hideMemberLogin={club.hide_member_login ?? false}
        preregistrationEnabled={club.preregistration_enabled ?? false}
        autoRegistration={club.auto_registration ?? false}
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
          price: p.price ?? null,
          is_default: p.is_default ?? false,
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
      <CollapsibleSection title="Telegram Bot">
        <TelegramBotManager
          enabled={club.telegram_bot_enabled ?? false}
          referralName={club.telegram_bot_referral_name ?? null}
          registrationPrice={club.telegram_bot_registration_price ?? null}
          welcomeMessage={club.telegram_bot_welcome_message ?? null}
          keywords={club.telegram_bot_keywords ?? []}
          ageRestricted={club.telegram_bot_age_restricted ?? true}
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
      <CollapsibleSection title="Operations Module">
        <div className="space-y-3">
          <OperationsModuleManager
            clubId={club.id}
            clubSlug={clubSlug}
            initialEnabled={club.operations_module_enabled ?? false}
            initialCurrencyMode={(club.currency_mode as "saldo" | "cash") ?? "cash"}
          />
          {club.operations_module_enabled && (
            <ConsumptionLimitManager
              clubId={club.id}
              clubSlug={clubSlug}
              initialLimitGrams={
                club.monthly_consumption_limit_grams === null ||
                club.monthly_consumption_limit_grams === undefined
                  ? null
                  : Number(club.monthly_consumption_limit_grams)
              }
            />
          )}
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Push Notifications">
        <Link
          href={`/${clubSlug}/admin/push`}
          className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors"
        >
          <h3 className="text-sm font-semibold text-gray-900">Send a test push</h3>
          <p className="mt-1 text-xs text-gray-500">
            Compose a title, body, and optional link. Sends to all members who have subscribed on this club.
          </p>
        </Link>
      </CollapsibleSection>
      <CollapsibleSection id="spin-wheel" title="Spin Wheel">
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
          spinEnabled={club.spin_enabled ?? true}
          spinDisplayDecimals={club.spin_display_decimals ?? 0}
          spinCost={club.spin_cost ?? 1}
        />
      </CollapsibleSection>
      <CollapsibleSection title="Email Campaigns">
        <EmailCampaignManager
          clubId={club.id}
          clubSlug={clubSlug}
          emailCount={emailCount}
          roles={(roles ?? []).map((r) => ({ id: r.id, name: r.name }))}
          quests={(emailQuests ?? []).map((q) => ({ id: q.id, title: q.title }))}
          events={(emailEvents ?? []).map((e) => ({ id: e.id, title: e.title }))}
          offers={(emailOffers ?? []).map((o) => {
            const catalog = Array.isArray(o.offer_catalog) ? o.offer_catalog[0] : o.offer_catalog;
            return { id: o.id, name: catalog?.name ?? "Unknown" };
          })}
          campaigns={campaigns}
          ownerId={ownerSession?.owner_id ?? null}
        />
      </CollapsibleSection>
    </div>
  );
}
