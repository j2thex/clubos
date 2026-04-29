import Image from "next/image";
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
  totalClubs,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  clubs: ClubInfo[];
  totalClubs?: number;
}) {
  if (clubs.length === 0) return null;
  const hasMore = typeof totalClubs === "number" && totalClubs > clubs.length;

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-landing-border-subtle">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {t("landing.directoryTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm opacity-60">
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
                className="group block rounded-2xl bg-landing-surface border border-landing-border-subtle overflow-hidden hover:bg-landing-surface-hover transition-colors duration-300 h-full"
              >
                <div className="h-20 relative overflow-hidden">
                  {club.cover_url ? (
                    <>
                      <Image
                        src={club.cover_url}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(135deg, ${club.primary_color || "#16a34a"}40, ${club.primary_color || "#16a34a"}10)` }}
                    />
                  )}
                </div>

                <div className="p-4 flex items-center gap-3">
                  {club.logo_url ? (
                    <Image
                      src={club.logo_url}
                      alt={club.name}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-lg object-cover shrink-0 -mt-7 ring-2 ring-background"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-lg shrink-0 -mt-7 ring-2 ring-background flex items-center justify-center text-white font-medium text-xs"
                      style={{ backgroundColor: club.primary_color || "#16a34a" }}
                    >
                      {club.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{club.name}</p>
                    <p className="text-[10px] opacity-50">{t("landing.directoryViewClub")}</p>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        {hasMore && (
          <div className="mt-10 text-center">
            <Link
              href="/discover#clubs"
              className="inline-block text-sm opacity-80 hover:opacity-100 transition-opacity underline underline-offset-4"
            >
              {t("landing.directoryViewAll", { count: totalClubs })}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
