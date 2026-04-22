"use client";

import { useState, useTransition } from "react";
import { fulfillOfferOrder, addWalkinOfferOrder } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";
import { localized } from "@/lib/i18n";
import { DynamicIcon } from "@/components/dynamic-icon";
import { OfferDetailModal, type OfferDetail } from "../../(member)/offers/offer-detail-modal";

interface ProductInfo {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  stock: number;
  active: boolean;
}

interface Order {
  id: string;
  status: string;
  created_at: string;
  fulfilled_at: string | null;
  member_code: string;
  member_name: string;
  fulfilled_by_name: string | null;
  offer_title: string;
  product: ProductInfo | null;
}

interface Offer {
  id: string;
  title: string;
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
  product: ProductInfo | null;
}

export function StaffOfferClient({
  offers,
  initialOrders,
  clubId,
  clubSlug,
  staffMemberId,
}: {
  offers: Offer[];
  initialOrders: Order[];
  clubId: string;
  clubSlug: string;
  staffMemberId: string;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [memberCode, setMemberCode] = useState("");
  const [walkinOfferId, setWalkinOfferId] = useState(offers[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) ?? null;
  const selectedOfferDetail: OfferDetail | null = selectedOffer
    ? {
        id: selectedOffer.id,
        name: selectedOffer.name,
        name_es: selectedOffer.name_es,
        subtype: selectedOffer.subtype,
        icon: selectedOffer.icon,
        club_icon: selectedOffer.club_icon,
        description: selectedOffer.description,
        description_es: selectedOffer.description_es,
        image_url: selectedOffer.image_url,
        link: selectedOffer.link,
        orderable: selectedOffer.orderable,
        price: selectedOffer.price,
      }
    : null;

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const fulfilledOrders = orders.filter((o) => o.status === "fulfilled").slice(0, 20);

  const walkinProduct = offers.find((o) => o.id === walkinOfferId)?.product ?? null;
  const walkinBlocked =
    !!walkinProduct && (!walkinProduct.active || walkinProduct.stock < walkinProduct.quantity);

  function handleFulfill(orderId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await fulfillOfferOrder(orderId, staffMemberId, clubSlug);
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
    if (!code || !walkinOfferId) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addWalkinOfferOrder(code, walkinOfferId, clubId, staffMemberId, clubSlug);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const walkinOffer = offers.find((a) => a.id === walkinOfferId);
      const offerName = walkinOffer?.title ?? "";
      setOrders((prev) => [
        {
          id: crypto.randomUUID(),
          status: "fulfilled",
          created_at: new Date().toISOString(),
          fulfilled_at: new Date().toISOString(),
          member_code: code,
          member_name: "",
          fulfilled_by_name: null,
          offer_title: offerName,
          product: walkinOffer?.product ?? null,
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
              {pendingOrders.map((o) => {
                const stockBlocked =
                  !!o.product && (!o.product.active || o.product.stock < o.product.quantity);
                const stockBadge = o.product
                  ? !o.product.active
                    ? { label: t("staff.offerProductInactive"), cls: "bg-amber-100 text-amber-700" }
                    : o.product.stock < o.product.quantity
                      ? { label: t("staff.offerOutOfStock"), cls: "bg-red-100 text-red-700" }
                      : {
                          label: t("staff.offerStock", { n: String(o.product.stock) }),
                          cls: "bg-green-50 text-green-700",
                        }
                  : null;
                return (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {o.offer_title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-mono font-semibold">{o.member_code}</span>
                      {o.member_name ? ` \u2014 ${o.member_name}` : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-[10px] text-gray-400">{formatDate(o.created_at)}</p>
                      {o.product && (
                        <span className="text-[10px] font-medium text-gray-500">
                          {"→"} {o.product.name} {"×"}{o.product.quantity}
                          {o.product.unit === "gram" ? "g" : ""}
                        </span>
                      )}
                      {stockBadge && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${stockBadge.cls}`}>
                          {stockBadge.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleFulfill(o.id)}
                    disabled={isPending || stockBlocked}
                    title={stockBlocked ? stockBadge?.label : undefined}
                    className="rounded-lg bg-green-600 text-white px-4 py-2 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    {t("staff.fulfillOrder")}
                  </button>
                </div>
                );
              })}
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
          <form onSubmit={handleWalkin} className="px-5 py-4 space-y-2">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">{t("staff.offerLabel")}</label>
                <select
                  value={walkinOfferId}
                  onChange={(e) => setWalkinOfferId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-white"
                >
                  {offers.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
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
                disabled={isPending || !memberCode.trim() || walkinBlocked}
                className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {t("staff.fulfillOrder")}
              </button>
            </div>
            {walkinProduct && (
              <p className="text-[11px] text-gray-500">
                {"→"} {walkinProduct.name} {"×"}{walkinProduct.quantity}
                {walkinProduct.unit === "gram" ? "g" : ""}
                {" · "}
                {!walkinProduct.active
                  ? <span className="text-amber-600 font-semibold">{t("staff.offerProductInactive")}</span>
                  : walkinProduct.stock < walkinProduct.quantity
                    ? <span className="text-red-600 font-semibold">{t("staff.offerOutOfStock")}</span>
                    : <span className="text-green-700 font-semibold">{t("staff.offerStock", { n: String(walkinProduct.stock) })}</span>}
              </p>
            )}
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
                    <span className="font-semibold text-gray-700">{o.offer_title}</span>
                    {" \u2014 "}
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

      {/* Offer Catalog Browser */}
      {offers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
            {t("offers.detail.staffBrowseTitle")}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-3">
            <div className="grid grid-cols-3 gap-2">
              {offers.map((a) => {
                const displayIcon = a.club_icon || a.icon;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedOfferId(a.id)}
                    className="flex flex-col items-center text-center p-2 rounded-xl border border-gray-100 hover:border-gray-300 active:scale-95 transition-all"
                  >
                    {a.image_url ? (
                      <img src={a.image_url} alt="" className="w-10 h-10 rounded-full object-cover mb-1" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1 bg-gray-100 text-gray-500">
                        {displayIcon ? (
                          <DynamicIcon name={displayIcon} className="w-5 h-5" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        )}
                      </div>
                    )}
                    <span className="text-[11px] font-medium text-gray-800 leading-tight line-clamp-2">
                      {localized(a.name, a.name_es, locale)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <OfferDetailModal
        offer={selectedOfferDetail}
        onClose={() => setSelectedOfferId(null)}
        mode={{ kind: "staff" }}
      />

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
