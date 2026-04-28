"use client";

import { useState, useTransition } from "react";
import { updateWorkingHours } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

type WorkingHours = Record<string, { open: string; close: string } | null> | null;

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

export function WorkingHoursManager({
  clubId,
  clubSlug,
  initialHours,
}: {
  clubId: string;
  clubSlug: string;
  initialHours: WorkingHours;
}) {
  const { locale } = useLanguage();
  const [hours, setHours] = useState<Record<string, { open: string; close: string } | null>>(() => {
    const defaults: Record<string, { open: string; close: string } | null> = {};
    for (const day of DAYS) {
      defaults[day] = initialHours?.[day] ?? null;
    }
    return defaults;
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleDay(day: string) {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: "12:00", close: "00:00" },
    }));
  }

  function updateTime(day: string, field: "open" | "close", value: string) {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : { open: "09:00", close: "18:00", [field]: value },
    }));
  }

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      // Check if all days are closed — save as null
      const allClosed = DAYS.every((d) => hours[d] === null);
      const result = await updateWorkingHours(clubId, allClosed ? null : hours, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="divide-y divide-gray-100">
        {DAYS.map((day) => {
          const isOpen = hours[day] !== null;
          const label = locale === "es" ? DAY_LABELS[day].es : DAY_LABELS[day].en;
          return (
            <div key={day} className="px-5 py-3 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-24 shrink-0">
                {label}
              </span>
              <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!isOpen}
                  onChange={() => toggleDay(day)}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-400"
                />
                <span className="text-xs text-gray-500">
                  {locale === "es" ? "Cerrado" : "Closed"}
                </span>
              </label>
              {isOpen && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="time"
                    value={hours[day]!.open}
                    onChange={(e) => updateTime(day, "open", e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                  />
                  <span className="text-xs text-gray-400">—</span>
                  <input
                    type="time"
                    value={hours[day]!.close}
                    onChange={(e) => updateTime(day, "close", e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                  />
                </div>
              )}
              {!isOpen && (
                <span className="ml-auto text-xs text-gray-300 italic">
                  {locale === "es" ? "Sin horario" : "No hours"}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
        <div>
          {success && <span className="text-xs text-green-600 font-medium">Saved</span>}
          {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-gray-800 text-white px-5 py-1.5 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? (locale === "es" ? "Guardando..." : "Saving...") : (locale === "es" ? "Guardar Horario" : "Save Hours")}
        </button>
      </div>
    </div>
  );
}
