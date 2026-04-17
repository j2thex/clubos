"use client";

import { useState, useMemo } from "react";

interface LogEntry {
  id: string;
  action: string;
  target_member_code: string | null;
  details: string | null;
  created_at: string;
  staff_code: string | null;
  staff_name: string | null;
}

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  member_created: { label: "Created member", color: "bg-blue-100 text-blue-700" },
  membership_assigned: { label: "Assigned membership", color: "bg-blue-100 text-blue-700" },
  membership_prolongated: { label: "Extended membership", color: "bg-blue-100 text-blue-700" },
  role_assigned: { label: "Assigned role", color: "bg-blue-100 text-blue-700" },
  validity_updated: { label: "Updated validity", color: "bg-blue-100 text-blue-700" },
  referral_reward: { label: "Referral reward", color: "bg-blue-100 text-blue-700" },
  quest_auto_completed: { label: "Auto-completed", color: "bg-blue-100 text-blue-700" },
  spin_performed: { label: "Performed spin", color: "bg-purple-100 text-purple-700" },
  member_spin: { label: "Member spin", color: "bg-purple-100 text-purple-700" },
  quest_validated: { label: "Validated quest", color: "bg-green-100 text-green-700" },
  quest_approved: { label: "Approved quest", color: "bg-green-100 text-green-700" },
  quest_declined: { label: "Declined quest", color: "bg-red-100 text-red-700" },
  checkin: { label: "Checked in", color: "bg-emerald-100 text-emerald-700" },
  order_fulfilled: { label: "Fulfilled order", color: "bg-amber-100 text-amber-700" },
  walkin_order: { label: "Walk-in order", color: "bg-amber-100 text-amber-700" },
  offer_order_fulfilled: { label: "Fulfilled order", color: "bg-amber-100 text-amber-700" },
  offer_walkin_order: { label: "Walk-in order", color: "bg-amber-100 text-amber-700" },
  email_collected: { label: "Email collected", color: "bg-indigo-100 text-indigo-700" },
  // Operations module
  operations_module_toggled: { label: "Ops toggled", color: "bg-slate-100 text-slate-700" },
  id_verified: { label: "ID verified", color: "bg-teal-100 text-teal-700" },
  id_verification_revoked: { label: "ID revoked", color: "bg-rose-100 text-rose-700" },
  entry_checkin: { label: "Door admit", color: "bg-teal-100 text-teal-700" },
  entry_checkout: { label: "Door check-out", color: "bg-teal-100 text-teal-700" },
  entry_bulk_checkout: { label: "All checked out", color: "bg-teal-100 text-teal-700" },
  entry_blocked_expired: { label: "Blocked: expired", color: "bg-rose-100 text-rose-700" },
  entry_blocked_no_dob: { label: "Blocked: no DOB", color: "bg-rose-100 text-rose-700" },
  entry_blocked_underage: { label: "Blocked: underage", color: "bg-rose-100 text-rose-700" },
  entry_blocked_duplicate: { label: "Blocked: dup scan", color: "bg-rose-100 text-rose-700" },
  product_sale: { label: "Sale", color: "bg-emerald-100 text-emerald-700" },
  product_sale_voided: { label: "Sale voided", color: "bg-rose-100 text-rose-700" },
  product_created: { label: "Product +", color: "bg-slate-100 text-slate-700" },
  product_updated: { label: "Product edit", color: "bg-slate-100 text-slate-700" },
  product_archived: { label: "Product archived", color: "bg-slate-100 text-slate-700" },
  product_restored: { label: "Product restored", color: "bg-slate-100 text-slate-700" },
  product_stock_adjusted: { label: "Stock adjust", color: "bg-slate-100 text-slate-700" },
  product_category_created: { label: "Category +", color: "bg-slate-100 text-slate-700" },
  product_category_updated: { label: "Category edit", color: "bg-slate-100 text-slate-700" },
  product_category_archived: { label: "Category archived", color: "bg-slate-100 text-slate-700" },
  product_category_restored: { label: "Category restored", color: "bg-slate-100 text-slate-700" },
};

const OPS_ACTIONS = [
  "operations_module_toggled",
  "id_verified",
  "id_verification_revoked",
  "entry_checkin",
  "entry_checkout",
  "entry_bulk_checkout",
  "entry_blocked_expired",
  "entry_blocked_no_dob",
  "entry_blocked_underage",
  "entry_blocked_duplicate",
  "product_sale",
  "product_sale_voided",
  "product_created",
  "product_updated",
  "product_archived",
  "product_restored",
  "product_stock_adjusted",
  "product_category_created",
  "product_category_updated",
  "product_category_archived",
  "product_category_restored",
];

const BASE_CATEGORIES: { key: string; label: string; actions: string[]; color: string }[] = [
  { key: "all", label: "All", actions: [], color: "bg-gray-100 text-gray-700" },
  { key: "members", label: "Members", actions: ["member_created", "role_assigned", "membership_assigned", "membership_prolongated", "validity_updated", "referral_reward", "quest_auto_completed", "email_collected"], color: "bg-blue-100 text-blue-700" },
  { key: "spins", label: "Spins", actions: ["member_spin", "spin_performed"], color: "bg-purple-100 text-purple-700" },
  { key: "quests", label: "Quests", actions: ["quest_validated", "quest_approved", "quest_declined"], color: "bg-green-100 text-green-700" },
  { key: "orders", label: "Orders", actions: ["offer_order_fulfilled", "offer_walkin_order", "order_fulfilled", "walkin_order"], color: "bg-amber-100 text-amber-700" },
  { key: "events", label: "Events", actions: ["checkin"], color: "bg-emerald-100 text-emerald-700" },
];

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function LogViewer({ logs, opsEnabled = false }: { logs: LogEntry[]; opsEnabled?: boolean }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(() => {
    if (!opsEnabled) return BASE_CATEGORIES;
    return [
      ...BASE_CATEGORIES,
      {
        key: "operations",
        label: "Operations",
        actions: OPS_ACTIONS,
        color: "bg-teal-100 text-teal-700",
      },
    ];
  }, [opsEnabled]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: logs.length };
    for (const cat of categories) {
      if (cat.key === "all") continue;
      counts[cat.key] = logs.filter((l) => cat.actions.includes(l.action)).length;
    }
    return counts;
  }, [logs, categories]);

  const filteredLogs = useMemo(() => {
    if (activeCategory === "all") return logs;
    const cat = categories.find((c) => c.key === activeCategory);
    if (!cat) return logs;
    return logs.filter((l) => cat.actions.includes(l.action));
  }, [logs, activeCategory, categories]);

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-gray-400 text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Category filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const count = categoryCounts[cat.key] ?? 0;
          const isActive = activeCategory === cat.key;
          if (cat.key !== "all" && count === 0) return null;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive ? cat.color : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
            >
              {cat.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-white/40" : "bg-gray-200/60 text-gray-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Log entries */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
        {filteredLogs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-400 text-sm">No entries in this category</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const config = ACTION_CONFIG[log.action] ?? {
              label: log.action,
              color: "bg-gray-100 text-gray-700",
            };

            return (
              <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.color}`}>
                      {config.label}
                    </span>
                    {log.target_member_code && (
                      <span className="text-xs font-mono font-semibold text-gray-900">
                        {log.target_member_code}
                      </span>
                    )}
                  </div>
                  {log.details && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{log.details}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {log.staff_name ?? log.staff_code ?? "System"}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                  {timeAgo(log.created_at)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
