import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { SocialLinks } from "@/components/club/social-links";
import { PhotoGallery } from "@/components/club/photo-gallery";
import { InviteForm } from "./invite-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}): Promise<Metadata> {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  return {
    title: club ? club.name : "Club",
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, invite_only, club_branding(logo_url, cover_url, primary_color, secondary_color, social_instagram, social_whatsapp, social_telegram, social_google_maps)")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;

  const today = new Date().toISOString().split("T")[0];

  const [{ data: events }, { data: quests }, { data: services }, { data: galleryImages }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, title, description, date, time, price, image_url, link, reward_spins")
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", true)
        .gte("date", today)
        .order("date", { ascending: true }),
      supabase
        .from("quests")
        .select("id, title, description, image_url, link, reward_spins")
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("services")
        .select("id, title, description, image_url, link, price")
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("club_gallery")
        .select("id, image_url, caption")
        .eq("club_id", club.id)
        .order("display_order", { ascending: true }),
    ]);

  const hasEvents = events && events.length > 0;
  const hasQuests = quests && quests.length > 0;
  const hasServices = services && services.length > 0;

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(t: string) {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  return (
    <div className="min-h-screen club-page-bg">
      {/* Hero */}
      <div
        className="relative px-6 pt-12 pb-16 text-center bg-cover bg-center overflow-hidden"
        style={
          branding?.cover_url
            ? { backgroundImage: `url(${branding.cover_url})` }
            : undefined
        }
      >
        {branding?.cover_url && (
          <div className="absolute inset-0 bg-black/50" />
        )}
        {!branding?.cover_url && (
          <div className="absolute inset-0 club-hero" />
        )}

        <div className="relative z-10">
          {branding?.logo_url && (
            <img
              src={branding.logo_url}
              alt={club.name}
              className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-lg border-2 border-white/20"
            />
          )}
          <h1 className="text-2xl font-bold text-white">{club.name}</h1>
          {(branding?.social_instagram || branding?.social_whatsapp || branding?.social_telegram || branding?.social_google_maps) && (
            <div className="mt-4 flex justify-center">
              <SocialLinks
                instagram={branding?.social_instagram}
                whatsapp={branding?.social_whatsapp}
                telegram={branding?.social_telegram}
                googleMaps={branding?.social_google_maps}
                variant="light"
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10 space-y-6 pb-12">
        {/* Gallery */}
        {galleryImages && galleryImages.length > 0 && (
          <PhotoGallery
            images={galleryImages.map((g) => ({
              id: g.id,
              image_url: g.image_url,
              caption: g.caption,
            }))}
          />
        )}

        {/* Member Login (hidden if invite-only — invite form shown in quests) */}
        {!club.invite_only && (
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
            <p className="text-sm text-gray-500 mb-3">Already a member?</p>
            <Link
              href={`/${clubSlug}/login`}
              className="inline-block w-full rounded-xl club-btn px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              Member Login
            </Link>
          </div>
        )}

        {/* Events */}
        {hasEvents && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              Upcoming Events
            </h2>
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="bg-white rounded-2xl shadow overflow-hidden">
                  {ev.image_url && (
                    <img
                      src={ev.image_url}
                      alt=""
                      className="w-full h-36 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{ev.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(ev.date)}
                          {ev.time && ` at ${formatTime(ev.time)}`}
                        </p>
                        {ev.description && (
                          <p className="text-xs text-gray-400 mt-1">{ev.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {ev.price != null ? (
                          <span className="text-sm font-bold text-gray-900">${Number(ev.price).toFixed(2)}</span>
                        ) : (
                          <span className="text-sm font-bold text-green-600">Free</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {ev.reward_spins > 0 && (
                        <span className="text-xs club-tint-text font-medium px-2 py-0.5 club-tint-bg rounded-full">
                          +{ev.reward_spins} spin{ev.reward_spins === 1 ? "" : "s"}
                        </span>
                      )}
                      {ev.link && (
                        <a
                          href={ev.link.match(/^https?:\/\//) ? ev.link : `https://${ev.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium club-primary underline"
                        >
                          Learn more
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quests */}
        {(hasQuests || club.invite_only) && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              Quests
            </h2>
            <div className="space-y-3">
              {/* Invite quest card */}
              {club.invite_only && (
                <InviteForm clubId={club.id} clubName={club.name} />
              )}
              {(quests ?? []).map((q) => (
                <div key={q.id} className="bg-white rounded-2xl shadow p-4">
                  <div className="flex items-center gap-4">
                    {q.image_url ? (
                      <img src={q.image_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{q.title}</p>
                      {q.description && (
                        <p className="text-xs text-gray-400">{q.description}</p>
                      )}
                      {q.link && (() => {
                        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.link!);
                        const href = isEmail
                          ? `mailto:${q.link}`
                          : q.link!.match(/^https?:\/\//) ? q.link! : `https://${q.link}`;
                        const display = isEmail
                          ? q.link!
                          : q.link!.replace(/^https?:\/\//, "").replace(/\/$/, "");
                        return (
                          <a
                            href={href}
                            target={isEmail ? undefined : "_blank"}
                            rel={isEmail ? undefined : "noopener noreferrer"}
                            className="inline-block mt-1 text-xs font-medium club-primary underline truncate max-w-[200px]"
                          >
                            {display.length > 40 ? `${display.slice(0, 37)}...` : display}
                          </a>
                        );
                      })()}
                    </div>
                    {q.reward_spins > 0 && (
                      <span className="shrink-0 text-xs club-tint-text font-medium px-2 py-0.5 club-tint-bg rounded-full">
                        +{q.reward_spins} spin{q.reward_spins === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {hasServices && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              Services
            </h2>
            <div className="space-y-3">
              {services.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl shadow p-4">
                  <div className="flex items-center gap-4">
                    {s.image_url ? (
                      <img src={s.image_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                      {s.description && (
                        <p className="text-xs text-gray-400">{s.description}</p>
                      )}
                      {s.link && (
                        <a
                          href={s.link.match(/^https?:\/\//) ? s.link : `https://${s.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-1 text-xs font-medium club-primary underline"
                        >
                          Learn more
                        </a>
                      )}
                    </div>
                    <div className="shrink-0">
                      {s.price != null ? (
                        <span className="text-sm font-bold text-gray-900">${Number(s.price).toFixed(2)}</span>
                      ) : (
                        <span className="text-sm font-bold text-green-600">Free</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 pt-4">
          © {new Date().getFullYear()} {club.name} · Powered by osocios
        </p>
      </div>
    </div>
  );
}
