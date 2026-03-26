import { type Locale } from "@/lib/i18n";

type WorkingHours = Record<string, { open: string; close: string } | null>;

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const DAY_LABELS: Record<string, { en: string; es: string }> = {
  mon: { en: "Monday", es: "Lunes" },
  tue: { en: "Tuesday", es: "Martes" },
  wed: { en: "Wednesday", es: "Miércoles" },
  thu: { en: "Thursday", es: "Jueves" },
  fri: { en: "Friday", es: "Viernes" },
  sat: { en: "Saturday", es: "Sábado" },
  sun: { en: "Sunday", es: "Domingo" },
};

// JS getDay() returns 0=Sun, we need to map to our day keys
const JS_DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function getTodayKey(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: timezone,
    });
    const weekday = formatter.format(now).toLowerCase(); // "mon", "tue", etc.
    // Intl returns "Mon", "Tue" etc — lowercased first 3 chars match our keys
    return weekday.slice(0, 3);
  } catch {
    // Fallback to local day
    return JS_DAY_MAP[new Date().getDay()];
  }
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const minute = m ?? "00";
  if (hour === 0) return `12:${minute} AM`;
  if (hour < 12) return `${hour}:${minute} AM`;
  if (hour === 12) return `12:${minute} PM`;
  return `${hour - 12}:${minute} PM`;
}

export function WorkingHoursDisplay({
  workingHours,
  timezone,
  locale,
}: {
  workingHours: WorkingHours;
  timezone: string;
  locale: Locale;
}) {
  const todayKey = getTodayKey(timezone);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {locale === "es" ? "Horario" : "Hours"}
        </h3>
      </div>
      <div className="divide-y divide-gray-50">
        {DAYS.map((day) => {
          const isToday = day === todayKey;
          const entry = workingHours[day] ?? null;
          const label = locale === "es" ? DAY_LABELS[day].es : DAY_LABELS[day].en;
          return (
            <div
              key={day}
              className={`px-5 py-2.5 flex items-center justify-between ${
                isToday ? "bg-green-50/60" : ""
              }`}
            >
              <span
                className={`text-sm ${
                  isToday ? "font-semibold text-gray-900" : "font-medium text-gray-600"
                }`}
              >
                {label}
                {isToday && (
                  <span className="ml-1.5 text-[10px] font-semibold text-green-600 uppercase">
                    {locale === "es" ? "Hoy" : "Today"}
                  </span>
                )}
              </span>
              {entry ? (
                <span className={`text-sm ${isToday ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                  {formatTime(entry.open)} — {formatTime(entry.close)}
                </span>
              ) : (
                <span className="text-sm text-gray-300 italic">
                  {locale === "es" ? "Cerrado" : "Closed"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
