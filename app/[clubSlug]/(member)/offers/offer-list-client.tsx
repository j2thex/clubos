"use client";

import { useTransition } from "react";
import { requestOffer, cancelOfferRequest } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";
import { localized } from "@/lib/i18n";
import { DynamicIcon } from "@/components/dynamic-icon";

interface OfferItem {
  id: string;
  name: string;
  name_es: string | null;
  subtype: string;
  icon: string | null;
  club_icon: string | null;
  description: string | null;
  description_es: string | null;
  image_url: string | null;
  orderable: boolean;
  price: number | null;
  order: { id: string; club_offer_id: string; status: string } | null;
}

const SUBTYPE_LABELS: Record<string, { en: string; es: string }> = {
  activity: { en: "Activities", es: "Actividades" },
  experience: { en: "Experiences", es: "Experiencias" },
  service: { en: "Services", es: "Servicios" },
  product: { en: "Products", es: "Productos" },
};

function groupBySubtype(offers: OfferItem[]) {
  const groups: Record<string, OfferItem[]> = {};
  for (const a of offers) {
    const key = a.subtype || "service";
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return groups;
}

export function OfferListClient({
  offers,
  memberId,
  clubSlug,
}: {
  offers: OfferItem[];
  memberId: string;
  clubSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useLanguage();

  function handleRequest(clubOfferId: string) {
    startTransition(async () => {
      await requestOffer(clubOfferId, memberId, clubSlug);
    });
  }

  function handleCancel(orderId: string) {
    startTransition(async () => {
      await cancelOfferRequest(orderId, memberId, clubSlug);
    });
  }

  if (offers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full club-tint-bg flex items-center justify-center">
          <svg className="w-8 h-8 club-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <p className="text-gray-700 font-semibold text-lg">{t("offers.noOffers")}</p>
        <p className="text-gray-400 text-sm mt-1">{t("offers.availableSoon")}</p>
      </div>
    );
  }

  const groups = groupBySubtype(offers);
  const subtypeOrder = ["activity", "experience", "service", "product"];
  const sortedKeys = Object.keys(groups).sort(
    (a, b) => (subtypeOrder.indexOf(a) === -1 ? 99 : subtypeOrder.indexOf(a)) - (subtypeOrder.indexOf(b) === -1 ? 99 : subtypeOrder.indexOf(b)),
  );

  return (
    <div className="space-y-5">
      {sortedKeys.map((subtype) => (
        <div key={subtype} className="space-y-2">
          <h2 className="text-xs font-semibold text-white/60 uppercase tracking-wide px-1">
            {locale === "es"
              ? (SUBTYPE_LABELS[subtype]?.es ?? subtype)
              : (SUBTYPE_LABELS[subtype]?.en ?? subtype)}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {groups[subtype].map((a) => {
              const displayIcon = a.club_icon || a.icon;
              return (
                <div
                  key={a.id}
                  className={`bg-white rounded-xl shadow p-3 flex flex-col items-center text-center relative ${
                    a.orderable ? "cursor-pointer active:scale-95 transition-transform" : ""
                  }`}
                  onClick={() => {
                    if (!a.orderable || isPending) return;
                    if (a.order) {
                      handleCancel(a.order.id);
                    } else {
                      handleRequest(a.id);
                    }
                  }}
                >
                  {/* Price badge */}
                  {a.orderable && (
                    <div className="absolute top-1.5 right-1.5">
                      {a.price != null && a.price > 0 ? (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full">${a.price.toFixed(2)}</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{t("common.free")}</span>
                      )}
                    </div>
                  )}
                  {/* Icon/Image */}
                  {a.image_url ? (
                    <img src={a.image_url} alt="" className="w-10 h-10 rounded-full object-cover mb-1.5" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1.5 bg-gray-100 text-gray-400">
                      {displayIcon ? (
                        <DynamicIcon name={displayIcon} className="w-5 h-5" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      )}
                    </div>
                  )}
                  {/* Name */}
                  <span className="text-xs font-medium text-gray-900 leading-tight">
                    {localized(a.name, a.name_es, locale)}
                  </span>
                  {/* Order status */}
                  {a.orderable && a.order && (
                    <span className="mt-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {t("offers.requested")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
