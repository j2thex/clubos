import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "./actions";
import { MemberIdCard } from "@/components/club/member-id-card";
import { EmailField } from "./email-field";
import { BentoStatTile } from "@/components/club/bento-stat-tile";
import { BadgeCollection } from "../badge-collection";
import { t, getDateLocale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n";

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatValidity(
  validTill: string | null,
  locale: Locale,
): { label: string; className: string } {
  if (!validTill) {
    return {
      label: t(locale, "dashboard.validUnlimited"),
      className: "text-[color:var(--m-ink)]",
    };
  }
  const days = daysUntil(validTill);
  if (days < 0) {
    return { label: t(locale, "dashboard.expired"), className: "text-red-600" };
  }
  if (days === 0) {
    return { label: t(locale, "dashboard.today"), className: "text-amber-600" };
  }
  return {
    label: t(locale, "dashboard.validDays", { days }),
    className: days <= 14 ? "text-amber-600" : "text-[color:var(--m-ink)]",
  };
}

export default async function ProfilePage({
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
    { data: member },
    { count: totalSpinsCount },
    { count: eventCheckinsCount },
    { data: branding },
    { data: clubBadges },
    { data: memberBadges },
    { data: clubOps },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("member_code, full_name, spin_balance, valid_till, created_at, email, id_verified_at")
      .eq("id", session.member_id)
      .single(),
    supabase
      .from("spins")
      .select("*", { count: "exact", head: true })
      .eq("member_id", session.member_id)
      .eq("club_id", session.club_id)
      .gt("outcome_value", 0),
    supabase
      .from("event_checkins")
      .select("*", { count: "exact", head: true })
      .eq("member_id", session.member_id),
    supabase
      .from("club_branding")
      .select("cover_url, logo_url")
      .eq("club_id", session.club_id)
      .single(),
    supabase
      .from("badges")
      .select("id, name, description, icon, image_url, color, quests(title)")
      .eq("club_id", session.club_id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("member_badges")
      .select("badge_id, earned_at")
      .eq("member_id", session.member_id),
    supabase
      .from("clubs")
      .select("operations_module_enabled, spin_enabled")
      .eq("id", session.club_id)
      .single(),
  ]);
  const opsEnabled = clubOps?.operations_module_enabled ?? false;
  const spinEnabled = clubOps?.spin_enabled ?? true;
  const idVerified = opsEnabled && !!member?.id_verified_at;

  const { data: referrals } = member?.member_code
    ? await supabase
        .from("members")
        .select("member_code, full_name, created_at")
        .eq("club_id", session.club_id)
        .eq("referred_by", member.member_code)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: recentPurchases } = opsEnabled
    ? await supabase
        .from("product_transactions")
        .select(
          "id, quantity, total_price, created_at, products(name, name_es, unit)",
        )
        .eq("member_id", session.member_id)
        .is("voided_at", null)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: null };

  const locale = await getServerLocale();
  const coverUrl = branding?.cover_url ?? null;
  const memberCode = member?.member_code ?? "";
  const fullName = member?.full_name ?? "";
  const memberSince = member?.created_at
    ? new Date(member.created_at).toLocaleDateString(getDateLocale(locale), {
        month: "long",
        year: "numeric",
      })
    : "";
  const validity = formatValidity(member?.valid_till ?? null, locale);
  const logoutWithSlug = logout.bind(null, clubSlug);
  const earnedBadgesCount = (memberBadges ?? []).length;
  const totalBadgesCount = (clubBadges ?? []).length;

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
        <p className="m-caption">{t(locale, "profile.caption")}</p>
        <h1 className="m-display mt-1 text-[color:var(--m-ink)]">
          {t(locale, "profile.title")}
        </h1>
      </header>

      <div className="mx-auto max-w-md space-y-6 px-5 py-5 pb-10">
        {/* Identity card — photo bg, dark gradient, name + code + QR */}
        <section
          className="relative overflow-hidden"
          style={{
            borderRadius: "var(--m-radius-sm)",
            boxShadow: "var(--m-elev-raised)",
            border: "1px solid var(--m-border)",
            background: "var(--m-ink)",
          }}
        >
          {coverUrl && (
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.85) 100%)",
            }}
          />
          <div className="relative flex flex-col gap-4 p-5 pb-6 text-white">
            <div>
              <p
                className="text-[11px] font-semibold uppercase leading-none text-white/85"
                style={{ letterSpacing: "0.08em" }}
              >
                {t(locale, "profile.memberSince")} · {memberSince.toUpperCase()}
              </p>
              <h2 className="m-display mt-2 text-white">{fullName || "Member"}</h2>
              {idVerified && (
                <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-green-500/20 border border-green-300/40 px-2 py-0.5 text-[11px] font-semibold text-green-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3 h-3"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t(locale, "profile.ageVerified")}
                </span>
              )}
            </div>
            <MemberIdCard memberCode={memberCode} />
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold uppercase leading-none text-white/85"
                style={{ letterSpacing: "0.08em" }}
              >
                {t(locale, "profile.validTill")}
              </span>
              <span className={`text-sm font-semibold ${validity.className} text-white`}>
                {validity.label}
              </span>
            </div>
          </div>
        </section>

        {/* Bento stat strip */}
        <div className={`grid gap-3 ${spinEnabled ? "grid-cols-3" : "grid-cols-2"}`}>
          {spinEnabled && (
            <BentoStatTile
              caption={t(locale, "dashboard.spinsLabel").toUpperCase()}
              value={<span className="text-2xl font-bold tabular-nums">{totalSpinsCount ?? 0}</span>}
            />
          )}
          <BentoStatTile
            caption={t(locale, "events.title").toUpperCase()}
            value={<span className="text-2xl font-bold tabular-nums">{eventCheckinsCount ?? 0}</span>}
            href={`/${clubSlug}/events`}
          />
          <BentoStatTile
            caption={t(locale, "profile.badges").toUpperCase()}
            value={
              <span className="text-2xl font-bold tabular-nums">
                {earnedBadgesCount}
                <span className="text-sm font-medium text-[color:var(--m-ink-muted)]">
                  /{totalBadgesCount}
                </span>
              </span>
            }
          />
        </div>

        {/* Recent purchases (ops-enabled clubs only) */}
        {opsEnabled && recentPurchases && recentPurchases.length > 0 && (
          <section className="space-y-3">
            <h2 className="m-caption px-1">{t(locale, "profile.recentPurchases")}</h2>
            <div
              className="overflow-hidden"
              style={{
                borderRadius: "var(--m-radius-sm)",
                background: "var(--m-surface)",
                border: "1px solid var(--m-border)",
              }}
            >
              <ul className="divide-y" style={{ borderColor: "var(--m-border)" }}>
                {recentPurchases.map((p) => {
                  const product = Array.isArray(p.products) ? p.products[0] : p.products;
                  const name =
                    locale === "es" && product?.name_es
                      ? product.name_es
                      : product?.name ?? "—";
                  const when = new Date(p.created_at).toLocaleDateString(
                    getDateLocale(locale),
                    { month: "short", day: "numeric" },
                  );
                  const qty = Number(p.quantity).toFixed(
                    product?.unit === "gram" ? 1 : 0,
                  );
                  return (
                    <li
                      key={p.id}
                      className="px-4 py-3 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[color:var(--m-ink)] truncate">
                          {name}
                        </p>
                        <p className="text-xs text-[color:var(--m-ink-muted)]">
                          {qty}
                          {product?.unit === "gram" ? "g" : ""} · {when}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[color:var(--m-ink)] tabular-nums">
                        {Number(p.total_price).toFixed(2)} €
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* Badges */}
        {clubBadges && clubBadges.length > 0 && (
          <section className="space-y-3">
            <h2 className="m-caption px-1">{t(locale, "profile.badges")}</h2>
            <BadgeCollection
              allBadges={(clubBadges ?? []).map((b) => {
                const quest = Array.isArray(b.quests) ? b.quests[0] : b.quests;
                return {
                  id: b.id,
                  name: b.name,
                  description: b.description,
                  icon: b.icon ?? null,
                  imageUrl: b.image_url ?? null,
                  color: b.color ?? "#6b7280",
                  questTitle: quest?.title ?? null,
                };
              })}
              earnedBadges={(memberBadges ?? []).map((mb) => ({
                badgeId: mb.badge_id,
                earnedAt: mb.earned_at,
              }))}
            />
          </section>
        )}

        {/* Referrals */}
        {referrals && referrals.length > 0 && (
          <section className="space-y-3">
            <h2 className="m-caption px-1">
              {t(locale, "profile.referralsTitle")} · {referrals.length}
            </h2>
            <div className="m-card divide-y" style={{ borderColor: "var(--m-border)" }}>
              {referrals.map((ref) => (
                <div key={ref.member_code} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-semibold uppercase tracking-wide text-[color:var(--m-ink)]">
                      {ref.member_code}
                    </p>
                    {ref.full_name && (
                      <p className="truncate text-xs text-[color:var(--m-ink-muted)]">
                        {ref.full_name}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-xs text-[color:var(--m-ink-muted)]">
                    {new Date(ref.created_at).toLocaleDateString(getDateLocale(locale), {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Account */}
        <section className="space-y-3">
          <h2 className="m-caption px-1">ACCOUNT</h2>
          <div className="m-card overflow-hidden">
            <EmailField
              currentEmail={member?.email ?? null}
              memberId={session.member_id}
            />
          </div>
        </section>

        <Link
          href="/discover"
          className="m-card block w-full px-4 py-3.5 text-center text-sm font-semibold text-[color:var(--m-ink)] transition-transform active:scale-[0.98]"
        >
          {t(locale, "profile.backToDiscover")}
        </Link>

        <form action={logoutWithSlug}>
          <button
            type="submit"
            className="w-full rounded-[var(--m-radius-sm)] border border-red-200 bg-white py-3.5 text-center text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 active:bg-red-100"
          >
            {t(locale, "common.logout")}
          </button>
        </form>
      </div>
    </div>
  );
}
