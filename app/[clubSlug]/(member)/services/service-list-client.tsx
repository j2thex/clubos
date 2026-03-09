"use client";

import { useTransition } from "react";
import { requestService, cancelServiceRequest } from "./actions";

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
        <div key={s.id} className="bg-white rounded-2xl shadow overflow-hidden">
          {s.image_url && (
            <img src={s.image_url} alt="" className="w-full h-36 object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{s.title}</p>
                {s.description && (
                  <p className="text-xs text-gray-500 mt-1">{s.description}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {s.price != null ? (
                  <span className="text-sm font-bold text-gray-900">${s.price.toFixed(2)}</span>
                ) : (
                  <span className="text-sm font-bold text-green-600">Free</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 gap-2">
              <div className="flex items-center gap-2">
                {s.link && (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium club-primary underline"
                  >
                    Learn more
                  </a>
                )}
                {s.fulfilled_count > 0 && (
                  <span className="text-xs text-gray-400">
                    {s.fulfilled_count}x fulfilled
                  </span>
                )}
              </div>

              {s.order ? (
                <button
                  onClick={() => handleCancel(s.order!.id)}
                  disabled={isPending}
                  className="rounded-lg border border-amber-300 bg-amber-50 text-amber-700 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors"
                >
                  {isPending ? "..." : "Requested — Cancel"}
                </button>
              ) : (
                <button
                  onClick={() => handleRequest(s.id)}
                  disabled={isPending}
                  className="rounded-lg club-btn text-white px-4 py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {isPending ? "..." : "Request"}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
