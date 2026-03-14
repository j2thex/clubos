import { AnimatedCounter } from "./animated-counter";

export function StatsBar({
  t,
  stats,
}: {
  t: (key: string) => string;
  stats: { clubs: number; members: number; events: number };
}) {
  return (
    <div className="relative z-10 mx-auto max-w-3xl px-6 -mt-8">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
          <div>
            <div className="text-2xl sm:text-4xl font-bold text-foreground tabular-nums">
              <AnimatedCounter target={stats.clubs} suffix="+" />
            </div>
            <p className="mt-1 text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("landing.statsClubs")}
            </p>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-bold text-foreground tabular-nums">
              <AnimatedCounter target={stats.members} suffix="+" />
            </div>
            <p className="mt-1 text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("landing.statsMembers")}
            </p>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-bold text-foreground tabular-nums">
              <AnimatedCounter target={stats.events} suffix="+" />
            </div>
            <p className="mt-1 text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("landing.statsEvents")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
