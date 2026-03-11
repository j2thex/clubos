import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

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
    .select("id, name, club_branding(logo_url, cover_url, primary_color, secondary_color)")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;

  const today = new Date().toISOString().split("T")[0];

  const [{ data: events }, { data: quests }, { data: services }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, title, description, date, time, price, image_url")
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", true)
        .gte("date", today)
        .order("date", { ascending: true }),
      supabase
        .from("quests")
        .select("id, title, description, image_url")
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("services")
        .select("id, title, description, image_url, price")
        .eq("club_id", club.id)
        .eq("active", true)
        .eq("is_public", true)
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
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10 space-y-6 pb-12">
        {/* Member Login */}
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
          <p className="text-sm text-gray-500 mb-3">Already a member?</p>
          <Link
            href={`/${clubSlug}/login`}
            className="inline-block w-full rounded-xl club-btn px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            Member Login
          </Link>
        </div>

        {/* Events */}
        {hasEvents && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              Upcoming Events
            </h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
              {events.map((ev) => (
                <div key={ev.id} className="p-4 flex gap-3">
                  {ev.image_url && (
                    <img
                      src={ev.image_url}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(ev.date)}
                      {ev.time && ` at ${ev.time}`}
                    </p>
                    {ev.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {ev.description}
                      </p>
                    )}
                    <div className="mt-1.5">
                      {ev.price != null ? (
                        <span className="text-xs font-medium club-primary">
                          ${Number(ev.price).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-green-600">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quests */}
        {hasQuests && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              Quests
            </h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
              {quests.map((q) => (
                <div key={q.id} className="p-4 flex gap-3">
                  {q.image_url && (
                    <img
                      src={q.image_url}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {q.title}
                    </p>
                    {q.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {q.description}
                      </p>
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
              {services.map((s) => (
                <div key={s.id} className="p-4 flex gap-3">
                  {s.image_url && (
                    <img
                      src={s.image_url}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {s.title}
                    </p>
                    {s.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                    {s.price != null && (
                      <p className="text-xs font-medium club-primary mt-1">
                        ${Number(s.price).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 pt-4">
          Powered by osocio
        </p>
      </div>
    </div>
  );
}
