import type { VerticalExample } from "./verticals";

export function ExamplePortal({ vertical }: { vertical: VerticalExample }) {
  const heroStyle = {
    "--club-primary": vertical.primaryColor,
    "--club-secondary": vertical.secondaryColor,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50" style={heroStyle}>
      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 text-center">
        <p className="text-xs text-white/80">
          This is an example portal.{" "}
          <a href="/onboarding" className="text-white font-semibold underline underline-offset-2 hover:text-white/90">
            Create yours free &rarr;
          </a>
        </p>
      </div>

      {/* Hero */}
      <div
        className="relative px-6 pt-10 pb-16 text-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${vertical.primaryColor}, ${vertical.secondaryColor})` }}
      >
        <div className="relative">
          <div
            className="w-14 h-14 rounded-xl mx-auto mb-3 shadow-lg ring-2 ring-white/20 flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            {vertical.name.charAt(0)}
          </div>
          <p className="text-sm font-medium tracking-wide uppercase mb-2 text-white/70">
            {vertical.name}
          </p>
          <h1 className="text-2xl font-bold text-white">
            {vertical.heroContent.replace("{name}", "Alex")}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 -mt-8 pb-10 max-w-md mx-auto space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Remaining", value: "5", sub: "spins" },
            { label: "Completed", value: "12", sub: "spins" },
            { label: "Level", value: "3", sub: "/ 10" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-lg p-4 text-center">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{stat.label}</p>
              <p className="mt-1 text-3xl font-extrabold" style={{ color: vertical.primaryColor }}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Quests */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">Quests</h2>
          <div className="space-y-2">
            {vertical.sampleQuests.map((quest) => (
              <div key={quest.title} className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{quest.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{quest.description}</p>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full text-white shrink-0"
                    style={{ backgroundColor: vertical.primaryColor }}
                  >
                    +{quest.rewardSpins}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">Events</h2>
          <div className="space-y-2">
            {vertical.sampleEvents.map((event) => (
              <div key={event.title} className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{event.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                    <p className="text-xs mt-2" style={{ color: vertical.primaryColor }}>
                      {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {event.time && ` · ${event.time}`}
                    </p>
                  </div>
                  {event.price != null && (
                    <span className="text-sm font-bold text-gray-700 shrink-0">€{event.price}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">Services</h2>
          <div className="space-y-2">
            {vertical.sampleServices.map((service) => (
              <div key={service.title} className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{service.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-700 shrink-0">
                    {service.price != null ? `€${service.price}` : "Free"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-4">
          <a
            href="/onboarding"
            className="inline-block rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: vertical.primaryColor }}
          >
            Create your portal like this &rarr;
          </a>
          <p className="text-xs text-gray-400 mt-3">Free to get started. No credit card required.</p>
        </div>
      </div>
    </div>
  );
}
