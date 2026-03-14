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
    <section className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
          {t("landing.directoryTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground text-base sm:text-lg">
          {t("landing.directorySubtitle", { count: clubs.length })}
        </p>

        <div className={`mt-14 flex flex-wrap justify-center gap-4 ${clubs.length <= 3 ? "max-w-2xl mx-auto" : ""}`}>
          {clubs.map((club, i) => (
            <ScrollReveal key={club.slug} delay={i * 60} className={clubs.length === 1 ? "w-full max-w-xs" : clubs.length <= 3 ? "w-full sm:flex-1 sm:min-w-[220px] sm:max-w-[280px]" : "w-[calc(50%-0.5rem)] sm:w-[calc(33.33%-0.75rem)] lg:w-[calc(25%-0.75rem)]"}>
              <Link
                href={`/${club.slug}/public`}
                className="group block rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full"
              >
                {/* Cover area */}
                <div
                  className="h-20 sm:h-24 bg-cover bg-center relative"
                  style={
                    club.cover_url
                      ? { backgroundImage: `url(${club.cover_url})` }
                      : {
                          background: `linear-gradient(135deg, ${club.primary_color || "#16a34a"}, ${club.primary_color ? club.primary_color + "99" : "#052e16"})`,
                        }
                  }
                >
                  {club.cover_url && (
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex items-center gap-3">
                  {club.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt={club.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm -mt-8 ring-2 ring-card"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 -mt-8 ring-2 ring-card flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: club.primary_color || "#16a34a" }}
                    >
                      {club.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {club.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("landing.directoryViewClub")}
                    </p>
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
