"use client";

import { useState, useTransition } from "react";
import { setPremiumReferrer } from "./actions";

export interface ReferrerSummary {
  code: string;
  name: string | null;
  memberId: string;
  isPremiumReferrer: boolean;
  referralRewardSpins: number;
  referrals: { code: string; name: string | null; date: string }[];
}

export interface MemberOption {
  id: string;
  code: string;
  name: string | null;
}

export function ReferralTree({
  referrers,
  clubSlug,
  memberOptions,
}: {
  referrers: ReferrerSummary[];
  clubSlug: string;
  memberOptions: MemberOption[];
}) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [showAddPremium, setShowAddPremium] = useState(false);
  const [newPremiumId, setNewPremiumId] = useState("");
  const [newPremiumSpins, setNewPremiumSpins] = useState("2");
  const [isPending, startTransition] = useTransition();

  function handleTogglePremium(referrer: ReferrerSummary) {
    startTransition(async () => {
      await setPremiumReferrer(
        referrer.memberId,
        !referrer.isPremiumReferrer,
        referrer.referralRewardSpins || 2,
        clubSlug,
      );
    });
  }

  function handleUpdateSpins(referrer: ReferrerSummary, spins: number) {
    startTransition(async () => {
      await setPremiumReferrer(referrer.memberId, true, spins, clubSlug);
    });
  }

  function handleAddPremium() {
    if (!newPremiumId) return;
    startTransition(async () => {
      await setPremiumReferrer(
        newPremiumId,
        true,
        parseInt(newPremiumSpins) || 2,
        clubSlug,
      );
      setNewPremiumId("");
      setNewPremiumSpins("2");
      setShowAddPremium(false);
    });
  }

  return (
    <div className="space-y-3">
      {/* Add premium referrer button */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {!showAddPremium ? (
          <button
            onClick={() => setShowAddPremium(true)}
            className="w-full px-5 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Premium Referrer
          </button>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">New Premium Referrer</p>
            <select
              value={newPremiumId}
              onChange={(e) => setNewPremiumId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select member...</option>
              {memberOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code}{m.name ? ` — ${m.name}` : ""}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Reward spins:</label>
              <input
                type="number"
                min={0}
                max={100}
                value={newPremiumSpins}
                onChange={(e) => setNewPremiumSpins(e.target.value)}
                className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddPremium}
                disabled={!newPremiumId || isPending}
                className="flex-1 rounded-lg bg-blue-600 text-white text-sm font-medium py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Saving..." : "Add"}
              </button>
              <button
                onClick={() => setShowAddPremium(false)}
                className="px-4 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Referrer list */}
      {referrers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-400 text-sm">No referrals yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
          {referrers.map((referrer, index) => {
            const isExpanded = expandedCode === referrer.code;

            return (
              <div key={referrer.code}>
                <button
                  onClick={() => setExpandedCode(isExpanded ? null : referrer.code)}
                  className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-gray-400 w-6">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-semibold text-gray-900 text-sm">{referrer.code}</p>
                      {referrer.isPremiumReferrer && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          PREMIUM · {referrer.referralRewardSpins} spins
                        </span>
                      )}
                    </div>
                    {referrer.name && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{referrer.name}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                    {referrer.referrals.length} {referrer.referrals.length === 1 ? "referral" : "referrals"}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="bg-gray-50 px-5 pb-3 pt-1">
                    {/* Premium referrer controls */}
                    <div className="ml-9 mb-3 flex items-center gap-3 py-2 border-b border-gray-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={referrer.isPremiumReferrer}
                          onChange={() => handleTogglePremium(referrer)}
                          disabled={isPending}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs font-medium text-gray-600">Premium referrer</span>
                      </label>
                      {referrer.isPremiumReferrer && (
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-gray-400">Spins:</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={referrer.referralRewardSpins}
                            onChange={(e) => handleUpdateSpins(referrer, parseInt(e.target.value) || 0)}
                            disabled={isPending}
                            className="w-16 rounded border border-gray-200 px-2 py-1 text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Referral list */}
                    <div className="space-y-2 ml-9">
                      {referrer.referrals.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No referrals yet</p>
                      ) : (
                        referrer.referrals.map((ref) => (
                          <div key={ref.code + ref.date} className="flex items-center justify-between">
                            <div>
                              <span className="font-mono text-xs font-semibold text-gray-700">{ref.code}</span>
                              {ref.name && (
                                <span className="text-xs text-gray-400 ml-2">{ref.name}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {new Date(ref.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
