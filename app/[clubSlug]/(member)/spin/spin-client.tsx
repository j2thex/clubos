"use client";

import { useState, useTransition, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { memberSpin, claimSpinPrize } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

const SpinWheel = dynamic(() => import("@/components/club/spin-wheel"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[480px] aspect-square mx-auto bg-gray-100 rounded-full animate-pulse" />
  ),
});

interface SpinRecord {
  id: string;
  outcomeLabel: string;
  outcomeValue: number;
  status?: "pending" | "fulfilled";
  createdAt: string;
}

interface PendingPrize {
  id: string;
  outcomeLabel: string;
  outcomeValue: number;
  createdAt: string;
}

interface Segment {
  label: string;
  color: string;
  labelColor?: string;
  probability: number;
}

function formatBalance(value: number, decimals: number): string {
  if (decimals === 2) {
    const fixed = value.toFixed(2);
    return value < 10 ? "0" + fixed : fixed;
  }
  return String(value);
}

export function MemberSpinClient({
  clubSlug,
  balance,
  totalSpins,
  level,
  segments,
  pendingPrizes: initialPending,
  recentSpins: initialSpins,
  displayDecimals,
  spinCost,
  questsSection,
}: {
  clubSlug: string;
  balance: number;
  totalSpins: number;
  level: number;
  segments: Segment[];
  pendingPrizes: PendingPrize[];
  recentSpins: SpinRecord[];
  displayDecimals: number;
  spinCost: number;
  questsSection?: ReactNode;
}) {
  const { t } = useLanguage();
  const [currentBalance, setCurrentBalance] = useState(balance);
  const [recentSpins, setRecentSpins] = useState(initialSpins);
  const [pendingPrizes, setPendingPrizes] = useState(initialPending);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSpin() {
    const res = await memberSpin(clubSlug);

    if ("error" in res) {
      return res;
    }

    // Use the localized segment label for display
    const localizedLabel = segments[res.segmentIndex]?.label ?? res.outcome.label;
    const isWin = res.outcome.rewardType !== "nothing" && res.outcome.value > 0;

    setCurrentBalance(res.newBalance);

    const newSpinId = crypto.randomUUID();

    // Prepend new spin to history
    setRecentSpins((prev) => [
      {
        id: newSpinId,
        outcomeLabel: localizedLabel,
        outcomeValue: res.outcome.value,
        status: isWin ? "pending" : "fulfilled",
        createdAt: new Date().toISOString(),
      },
      ...prev.slice(0, 9),
    ]);

    // Add to unclaimed prizes if it's a win
    if (isWin) {
      setPendingPrizes((prev) => [
        {
          id: newSpinId,
          outcomeLabel: localizedLabel,
          outcomeValue: res.outcome.value,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    // Return with localized label for the wheel result overlay
    return {
      ...res,
      outcome: { ...res.outcome, label: localizedLabel },
    };
  }

  function handleClaim(prizeId: string) {
    setClaimingId(prizeId);
    startTransition(async () => {
      const res = await claimSpinPrize(prizeId);
      if (!("error" in res)) {
        setClaimedIds((prev) => new Set(prev).add(prizeId));
      }
      setClaimingId(null);
    });
  }

  return (
    <div className="min-h-screen club-page-bg">
      {/* Header */}
      <div className="club-hero px-6 pt-10 pb-16 text-center">
        <h1 className="text-2xl font-bold text-white">{t("spin.title")}</h1>
        {spinCost > 1 && (
          <p className="mt-2 text-xs club-light-text">Cost: {formatBalance(spinCost, displayDecimals)} per spin</p>
        )}
      </div>

      {/* Wheel */}
      <div className="relative z-10 px-4 -mt-8 pb-20 max-w-md mx-auto space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {t("dashboard.remaining")}
            </p>
            <p className="mt-1 text-3xl font-extrabold club-primary">
              {formatBalance(currentBalance, displayDecimals)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{t("dashboard.spinsLabel")}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {t("dashboard.completed")}
            </p>
            <p className="mt-1 text-3xl font-extrabold club-primary">
              {totalSpins}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{t("dashboard.spinsLabel")}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {t("dashboard.level")}
            </p>
            <p className="mt-1 text-3xl font-extrabold club-primary">
              {level}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">/ 10</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-2">
          <SpinWheel
            segments={segments}
            balance={currentBalance}
            spinCost={spinCost}
            onSpin={handleSpin}
          />
        </div>

        {/* Unclaimed prizes */}
        {pendingPrizes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">
                {t("spin.unclaimedPrizes")}
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingPrizes.map((prize) => {
                const isClaimed = claimedIds.has(prize.id);
                const isClaiming = claimingId === prize.id;
                return (
                  <div key={prize.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{prize.outcomeLabel}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(prize.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleClaim(prize.id)}
                      disabled={isClaiming || isClaimed}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors shrink-0 ${
                        isClaimed
                          ? "bg-green-100 text-green-700"
                          : "club-btn text-white"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {isClaimed
                        ? t("spin.claimed")
                        : isClaiming
                          ? t("spin.claiming")
                          : t("spin.getBonus")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {questsSection}

        {/* No spins message */}
        {currentBalance < spinCost && (
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-sm text-gray-500">{t("spin.earnMore")}</p>
          </div>
        )}

        {/* Recent spins */}
        {recentSpins.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">{t("spin.recentSpins")}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {recentSpins.map((spin) => {
                const isWin = spin.outcomeValue > 0;
                return (
                  <div key={spin.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isWin ? "club-tint-bg club-primary" : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isWin ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{spin.outcomeLabel}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(spin.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isWin && spin.status === "pending" && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {t("spin.pending")}
                        </span>
                      )}
                      {isWin && spin.status === "fulfilled" && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                          {t("spin.fulfilled")}
                        </span>
                      )}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isWin ? "club-tint-bg club-tint-text" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isWin ? `+${spin.outcomeValue}` : t("common.noWin")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
