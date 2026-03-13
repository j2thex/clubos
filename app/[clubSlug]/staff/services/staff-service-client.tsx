"use client";

import { useState, useTransition } from "react";
import { fulfillOrder, addWalkinOrder } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

interface Order {
  id: string;
  status: string;
  created_at: string;
  fulfilled_at: string | null;
  member_code: string;
  member_name: string;
  fulfilled_by_name: string | null;
  service_title: string;
}

interface Service {
  id: string;
  title: string;
}

export function StaffServiceClient({
  services,
  initialOrders,
  clubId,
  clubSlug,
  staffMemberId,
}: {
  services: Service[];
  initialOrders: Order[];
  clubId: string;
  clubSlug: string;
  staffMemberId: string;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [memberCode, setMemberCode] = useState("");
  const [walkinServiceId, setWalkinServiceId] = useState(services[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const fulfilledOrders = orders.filter((o) => o.status === "fulfilled").slice(0, 20);

  function handleFulfill(orderId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await fulfillOrder(orderId, staffMemberId, clubSlug);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "fulfilled", fulfilled_at: new Date().toISOString() }
            : o,
        ),
      );
      setSuccess(t("staff.orderFulfilled"));
      setTimeout(() => setSuccess(null), 3000);
    });
  }

  function handleWalkin(e: React.FormEvent) {
    e.preventDefault();
    const code = memberCode.trim().toUpperCase();
    if (!code || !walkinServiceId) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addWalkinOrder(code, walkinServiceId, clubId, staffMemberId, clubSlug);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const serviceName = services.find((s) => s.id === walkinServiceId)?.title ?? "";
      setOrders((prev) => [
        {
          id: crypto.randomUUID(),
          status: "fulfilled",
          created_at: new Date().toISOString(),
          fulfilled_at: new Date().toISOString(),
          member_code: code,
          member_name: "",
          fulfilled_by_name: null,
          service_title: serviceName,
        },
        ...prev,
      ]);
      setSuccess(t("staff.walkinFulfilled", { code }));
      setMemberCode("");
      setTimeout(() => setSuccess(null), 3000);
    });
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      {/* Pending Orders */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
          {t("staff.pendingOrders", { count: pendingOrders.length })}
        </h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {pendingOrders.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {pendingOrders.map((o) => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {o.service_title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-mono font-semibold">{o.member_code}</span>
                      {o.member_name ? ` — ${o.member_name}` : ""}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(o.created_at)}</p>
                  </div>
                  <button
                    onClick={() => handleFulfill(o.id)}
                    disabled={isPending}
                    className="rounded-lg bg-green-600 text-white px-4 py-2 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {t("staff.fulfillOrder")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-6 text-center text-sm text-gray-400">
              {t("staff.noPendingOrders")}
            </div>
          )}
        </div>
      </div>

      {/* Walk-in Order */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
          {t("staff.walkinOrder")}
        </h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <form onSubmit={handleWalkin} className="px-5 py-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">{t("staff.serviceLabel")}</label>
                <select
                  value={walkinServiceId}
                  onChange={(e) => setWalkinServiceId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 mb-1">{t("staff.memberLabel")}</label>
                <input
                  type="text"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
                  placeholder={t("staff.memberCodePlaceholder")}
                  maxLength={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-center"
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !memberCode.trim()}
                className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {t("staff.fulfillOrder")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Fulfilled */}
      {fulfilledOrders.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
            {t("staff.recentlyFulfilled")}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
            {fulfilledOrders.map((o) => (
              <div key={o.id} className="px-5 py-2.5 flex items-center justify-between gap-2 opacity-60">
                <div className="min-w-0">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-700">{o.service_title}</span>
                    {" — "}
                    <span className="font-mono">{o.member_code}</span>
                    {o.member_name ? ` ${o.member_name}` : ""}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {o.fulfilled_at ? formatDate(o.fulfilled_at) : ""}
                  </p>
                </div>
                <span className="text-[10px] text-green-600 font-semibold shrink-0">{t("common.done")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl px-4 py-2.5 text-xs text-red-600 bg-red-50 border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl px-4 py-2.5 text-xs text-green-700 bg-green-50 border border-green-100">
          {success}
        </div>
      )}
    </div>
  );
}
