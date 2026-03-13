"use client";

import { useTransition } from "react";
import { requestService, cancelServiceRequest } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

interface ServiceItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
  price: number | null;
  order: { id: string; service_id: string; status: string } | null;
  fulfilled_count: number;
}

export function ServiceListClient({
  services,
  memberId,
  clubSlug,
}: {
  services: ServiceItem[];
  memberId: string;
  clubSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  function handleRequest(serviceId: string) {
    startTransition(async () => {
      await requestService(serviceId, memberId, clubSlug);
    });
  }

  function handleCancel(orderId: string) {
    startTransition(async () => {
      await cancelServiceRequest(orderId, memberId, clubSlug);
    });
  }

  return (
    <>
      {services.map((s) => (
        <div key={s.id} className="bg-white rounded-2xl shadow p-4 space-y-2">
          <div className="flex items-center gap-4">
            {s.image_url ? (
              <img src={s.image_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
              {s.description && (
                <p className="text-xs text-gray-400">{s.description}</p>
              )}
              {s.link && (
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-xs font-medium club-primary underline"
                >
                  {t("services.learnMore")}
                </a>
              )}
              {s.fulfilled_count > 0 && (
                <span className="text-xs text-gray-400 ml-2">
                  {t("services.fulfilledCount", { count: s.fulfilled_count })}
                </span>
              )}
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              {s.price != null ? (
                <span className="text-sm font-bold text-gray-900">${s.price.toFixed(2)}</span>
              ) : (
                <span className="text-sm font-bold text-green-600">{t("common.free")}</span>
              )}
              {s.order ? (
                <button
                  onClick={() => handleCancel(s.order!.id)}
                  disabled={isPending}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "..." : t("services.requested")}
                </button>
              ) : (
                <button
                  onClick={() => handleRequest(s.id)}
                  disabled={isPending}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "..." : t("services.request")}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
