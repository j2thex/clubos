import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

interface MembershipDeal {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  club_name: string;
  club_slug: string;
  club_logo: string | null;
  club_color: string | null;
}

export function MembershipExplorer({
  deals,
  labels,
}: {
  deals: MembershipDeal[];
  labels: {
    title: string;
    subtitle: string;
    duration: string;
    viewClub: string;
  };
}) {
  if (deals.length === 0) return null;

  return (
    <section className="landing-dark px-6 py-20 sm:py-28 border-t border-white/[0.04]">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
            {labels.title}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm opacity-40">
            {labels.subtitle}
          </p>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {deals.map((d, i) => (
            <ScrollReveal key={d.id} delay={i * 60}>
              <Link
                href={`/${d.club_slug}/public`}
                className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.06] transition-colors duration-300 block h-full"
              >
                <div className="flex items-center gap-3 mb-3">
                  {d.club_logo ? (
                    <img src={d.club_logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: d.club_color || "#16a34a" }}
                    >
                      {d.club_name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium truncate">{d.club_name}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xs opacity-40">{d.name}</p>
                    <p className="text-[10px] opacity-25 mt-0.5">
                      {labels.duration.replace("{months}", String(d.duration_months))}
                    </p>
                  </div>
                  <span className="text-2xl font-extralight text-gradient">
                    €{d.price}
                  </span>
                </div>
                <p className="text-[10px] opacity-20 mt-3">{labels.viewClub}</p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
