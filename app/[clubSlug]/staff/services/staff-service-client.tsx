"use client";

import { useState, useTransition } from "react";
import { getServiceOrders, fulfillOrder, addWalkinOrder } from "./actions";

interface Service {
  id: string;
  title: string;
  pending_count: number;
}

interface Order {
  id: string;
  status: string;
  created_at: string;
  fulfilled_at: string | null;
  member_code: string;
  member_name: string;
  fulfilled_by_name: string | null;
}

export function StaffServiceClient({
  services,
  clubId,
  clubSlug,
  staffMemberId,
}: {
  services: Service[];
  clubId: string;
  clubSlug: string;
  staffMemberId: string;
}) {
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadedServiceId, setLoadedServiceId] = useState<string | null>(null);
  const [memberCode, setMemberCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function loadOrders(serviceId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await getServiceOrders(serviceId, clubId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setOrders(res.orders);
      setLoadedServiceId(serviceId);
    });
  }

  function handleSelectService(serviceId: string) {
    setSelectedServiceId(serviceId);
    setError(null);
    setSuccess(null);
    setOrders([]);
    setLoadedServiceId(null);
  }

  function handleFulfill(orderId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await fulfillOrder(orderId, staffMemberId, clubSlug);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSuccess("Order fulfilled");
      loadOrders(selectedServiceId);
    });
  }

  function handleWalkin(e: React.FormEvent) {
    e.preventDefault();
    const code = memberCode.trim().toUpperCase();
    if (!code || !selectedServiceId) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await addWalkinOrder(code, selectedServiceId, clubId, staffMemberId, clubSlug);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSuccess("Walk-in order added & fulfilled");
      setMemberCode("");
      loadOrders(selectedServiceId);
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

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const fulfilledOrders = orders.filter((o) => o.status === "fulfilled");

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Service Orders
        </h3>
      </div>

      {/* Service selector */}
      <div className="px-5 py-3 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
        <div className="flex gap-2">
          <select
            value={selectedServiceId}
            onChange={(e) => handleSelectService(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-white"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}{s.pending_count > 0 ? ` (${s.pending_count} pending)` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadOrders(selectedServiceId)}
            disabled={isPending || !selectedServiceId}
            className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {isPending ? "..." : "Load"}
          </button>
        </div>
      </div>

      {/* Walk-in order */}
      {loadedServiceId && (
        <form onSubmit={handleWalkin} className="px-5 py-3 border-b border-gray-100 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Walk-in Order</label>
            <input
              type="text"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
              placeholder="Member code"
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-center"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !memberCode.trim()}
            className="rounded-lg bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            Add & Fulfill
          </button>
        </form>
      )}

      {/* Orders list */}
      {loadedServiceId && (
        <div className="divide-y divide-gray-100">
          {pendingOrders.length === 0 && fulfilledOrders.length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-gray-400">
              No orders for this service
            </div>
          )}

          {pendingOrders.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Pending ({pendingOrders.length})
              </p>
              <div className="space-y-2">
                {pendingOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 py-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-mono text-xs text-gray-500">{o.member_code}</span>{" "}
                        {o.member_name}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(o.created_at)}</p>
                    </div>
                    <button
                      onClick={() => handleFulfill(o.id)}
                      disabled={isPending}
                      className="rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
                    >
                      Fulfill
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fulfilledOrders.length > 0 && (
            <div className="px-5 py-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Fulfilled ({fulfilledOrders.length})
              </p>
              <div className="space-y-1">
                {fulfilledOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 py-1 opacity-60">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">
                        <span className="font-mono text-xs text-gray-400">{o.member_code}</span>{" "}
                        {o.member_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {o.fulfilled_at ? formatDate(o.fulfilled_at) : ""}{" "}
                        {o.fulfilled_by_name ? `by ${o.fulfilled_by_name}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-green-600 font-medium shrink-0">Done</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="px-5 py-2 text-xs text-green-700 bg-green-50 border-t border-green-100">
          {success}
        </div>
      )}
    </div>
  );
}
