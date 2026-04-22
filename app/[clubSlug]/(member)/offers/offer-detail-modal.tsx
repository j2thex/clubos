"use client";

import { useEffect } from "react";
import { DynamicIcon } from "@/components/dynamic-icon";
import { useLanguage } from "@/lib/i18n/provider";
import { localized } from "@/lib/i18n";

export interface OfferDetail {
  id: string;
  name: string;
  name_es: string | null;
  subtype: string;
  icon: string | null;
  club_icon: string | null;
  description: string | null;
  description_es: string | null;
  image_url: string | null;
  link: string | null;
  orderable: boolean;
  price: number | null;
  hasPendingOrder?: boolean;
  unavailable?: boolean;
}

const SUBTYPE_LABELS: Record<string, { en: string; es: string }> = {
  activity: { en: "Activity", es: "Actividad" },
  experience: { en: "Experience", es: "Experiencia" },
  service: { en: "Service", es: "Servicio" },
  product: { en: "Product", es: "Producto" },
};

type ActionMode =
  | { kind: "member"; onRequest: () => void; onCancel: () => void; isPending: boolean }
  | { kind: "staff" };

export function OfferDetailModal({
  offer,
  onClose,
  mode,
}: {
  offer: OfferDetail | null;
  onClose: () => void;
  mode: ActionMode;
}) {
  const { t, locale } = useLanguage();

  useEffect(() => {
    if (!offer) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [offer, onClose]);

  if (!offer) return null;

  const displayIcon = offer.club_icon || offer.icon;
  const subtypeLabel =
    locale === "es"
      ? (SUBTYPE_LABELS[offer.subtype]?.es ?? offer.subtype)
      : (SUBTYPE_LABELS[offer.subtype]?.en ?? offer.subtype);
  const description = localized(offer.description ?? "", offer.description_es, locale);
  const name = localized(offer.name, offer.name_es, locale);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-sm w-full max-h-[85svh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 space-y-4">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("offers.detail.close")}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-lg leading-none"
          >
            ×
          </button>

          <div className="flex flex-col items-center text-center pt-2">
            {offer.image_url ? (
              <img
                src={offer.image_url}
                alt=""
                className="w-20 h-20 rounded-lg object-cover mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg flex items-center justify-center mb-3 bg-gray-100 text-gray-500">
                {displayIcon ? (
                  <DynamicIcon name={displayIcon} className="w-10 h-10" />
                ) : (
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                )}
              </div>
            )}
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              {subtypeLabel}
            </span>
            <h2 className="text-xl font-bold text-gray-900 mt-0.5">{name}</h2>
            {offer.price != null && offer.price > 0 ? (
              <span className="mt-1 text-sm font-semibold text-gray-700">
                ${offer.price.toFixed(2)}
              </span>
            ) : offer.orderable ? (
              <span className="mt-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                {t("common.free")}
              </span>
            ) : null}
          </div>

          {description && (
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {description}
            </p>
          )}

          {offer.link && (
            <a
              href={offer.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg border border-gray-300 text-center text-sm font-semibold text-gray-700 px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              {t("offers.detail.openLink")} →
            </a>
          )}

          {mode.kind === "member" && (
            <div className="pt-2 space-y-2">
              {offer.orderable ? (
                offer.hasPendingOrder ? (
                  <>
                    <button
                      type="button"
                      onClick={mode.onCancel}
                      disabled={mode.isPending}
                      className="w-full rounded-lg bg-amber-50 text-amber-700 border border-amber-200 px-4 py-3 text-sm font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors"
                    >
                      {t("offers.detail.pending")}
                    </button>
                    <p className="text-[11px] text-gray-400 text-center">
                      {t("offers.detail.pendingHint")}
                    </p>
                  </>
                ) : offer.unavailable ? (
                  <p className="text-xs text-red-600 text-center bg-red-50 rounded-lg px-4 py-3 font-medium">
                    {t("offers.detail.unavailable")}
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={mode.onRequest}
                      disabled={mode.isPending}
                      className="w-full rounded-lg club-btn px-4 py-3 text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      {t("offers.detail.request")}
                    </button>
                    <p className="text-[11px] text-gray-400 text-center">
                      {t("offers.detail.requestHint")}
                    </p>
                  </>
                )
              ) : (
                <p className="text-xs text-gray-500 text-center bg-gray-50 rounded-lg px-4 py-3">
                  {t("offers.detail.notOrderable")}
                </p>
              )}
            </div>
          )}

          {mode.kind === "staff" && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 text-center bg-gray-50 rounded-lg px-4 py-3">
                {t("offers.detail.staffInfo")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
