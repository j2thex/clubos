"use client";

import { useState, useTransition } from "react";
import { requestOffer, cancelOfferRequest } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";
import { localized } from "@/lib/i18n";
import { DynamicIcon } from "@/components/dynamic-icon";
import { OfferDetailModal } from "./offer-detail-modal";

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
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) ?? null;
  const selectedOfferDetail = selectedOffer
    ? { ...selectedOffer, hasPendingOrder: !!selectedOffer.order }
    : null;

  function handleRequest(clubOfferId: string) {
    startTransition(async () => {
      await requestOffer(clubOfferId, memberId, clubSlug);
      setSelectedOfferId(null);
    });
  }

  function handleCancel(orderId: string) {
    startTransition(async () => {
      await cancelOfferRequest(orderId, memberId, clubSlug);
      setSelectedOfferId(null);
    });
  }

  if (offers.length === 0) {
    return (
      <div className="m-card p-10 text-center">
        <p className="m-headline text-[color:var(--m-ink)]">{t("offers.noOffers")}</p>
        <p className="mt-1 text-sm text-[color:var(--m-ink-muted)]">
          {t("offers.availableSoon")}
        </p>
      </div>
    );
  }

  const groups = groupBySubtype(offers);
  const subtypeOrder = ["activity", "experience", "service", "product"];
  const sortedKeys = Object.keys(groups).sort(
    (a, b) => (subtypeOrder.indexOf(a) === -1 ? 99 : subtypeOrder.indexOf(a)) - (subtypeOrder.indexOf(b) === -1 ? 99 : subtypeOrder.indexOf(b)),
  );

  return (
    <div className="space-y-6">
      {sortedKeys.map((subtype) => (
        <div key={subtype} className="space-y-3">
          <h2 className="m-caption px-1">
            {locale === "es"
              ? (SUBTYPE_LABELS[subtype]?.es ?? subtype)
              : (SUBTYPE_LABELS[subtype]?.en ?? subtype)}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {groups[subtype].map((a) => {
              const displayIcon = a.club_icon || a.icon;
              const isRequested = a.orderable && !!a.order;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelectedOfferId(a.id)}
                  className="m-card relative flex min-h-[128px] flex-col overflow-hidden text-left transition-transform active:scale-[0.98]"
                >
                  {/* Cover image or icon block */}
                  <div
                    className="relative h-20 w-full"
                    style={{ background: "var(--m-surface-sunken)" }}
                  >
                    {a.image_url ? (
                      <img
                        src={a.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[color:var(--m-ink-muted)]">
                        {displayIcon ? (
                          <DynamicIcon name={displayIcon} className="h-8 w-8" />
                        ) : (
                          <svg
                            className="h-8 w-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                    {a.orderable && (
                      <div className="absolute right-2 top-2">
                        {a.price != null && a.price > 0 ? (
                          <span
                            className="inline-flex rounded-[var(--m-radius-xs)] px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--m-ink)]"
                            style={{
                              background: "var(--m-surface)",
                              border: "1px solid var(--m-border)",
                            }}
                          >
                            ${a.price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-[var(--m-radius-xs)] bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {t("common.free")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Text */}
                  <div className="flex flex-1 flex-col justify-between gap-1 p-2.5">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-[color:var(--m-ink)]">
                      {localized(a.name, a.name_es, locale)}
                    </p>
                    {isRequested && (
                      <span className="m-caption inline-flex w-fit items-center rounded-[var(--m-radius-xs)] bg-amber-100 px-1.5 py-0.5 text-amber-800">
                        {t("offers.requested")}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <OfferDetailModal
        offer={selectedOfferDetail}
        onClose={() => setSelectedOfferId(null)}
        mode={{
          kind: "member",
          isPending,
          onRequest: () => selectedOffer && handleRequest(selectedOffer.id),
          onCancel: () => {
            if (selectedOffer?.order) handleCancel(selectedOffer.order.id);
          },
        }}
      />
    </div>
  );
}
