import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

interface ClubInfo {
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string | null;
}

export function ClubDirectory({
  t,
  clubs,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  clubs: ClubInfo[];
}) {
  if (clubs.length === 0) return null;

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-white/[0.04]">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("landing.directoryTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm opacity-40">
            {t("landing.directorySubtitle", { count: clubs.length })}
          </p>
        </ScrollReveal>

        <div className={`mt-14 flex flex-wrap justify-center gap-4 ${clubs.length <= 3 ? "max-w-2xl mx-auto" : ""}`}>
          {clubs.map((club, i) => (
            <ScrollReveal
              key={club.slug}
              delay={i * 60}
              className={clubs.length === 1 ? "w-full max-w-xs" : clubs.length <= 3 ? "w-full sm:flex-1 sm:min-w-[220px] sm:max-w-[280px]" : "w-[calc(50%-0.5rem)] sm:w-[calc(33.33%-0.75rem)] lg:w-[calc(25%-0.75rem)]"}
            >
              <Link
                href={`/${club.slug}/public`}
                className="group block rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:bg-white/[0.06] transition-colors duration-300 h-full"
              >
                <div
                  className="h-20 bg-cover bg-center relative"
                  style={
                    club.cover_url
                      ? { backgroundImage: `url(${club.cover_url})` }
                      : { background: `linear-gradient(135deg, ${club.primary_color || "#16a34a"}40, ${club.primary_color || "#16a34a"}10)` }
                  }
                >
                  {club.cover_url && (
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  )}
                </div>

                <div className="p-4 flex items-center gap-3">
                  {club.logo_url ? (
                    <img src={club.logo_url} alt={club.name} className="w-9 h-9 rounded-lg object-cover shrink-0 -mt-7 ring-2 ring-[oklch(0.06_0.02_150)]" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-lg shrink-0 -mt-7 ring-2 ring-[oklch(0.06_0.02_150)] flex items-center justify-center text-white font-medium text-xs"
                      style={{ backgroundColor: club.primary_color || "#16a34a" }}
                    >
                      {club.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{club.name}</p>
                    <p className="text-[10px] opacity-30">{t("landing.directoryViewClub")}</p>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
