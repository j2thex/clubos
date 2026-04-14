"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type ReactNode } from "react";
import SpinWheel, { type SpinWheelHandle } from "@/components/club/spin-wheel";
import { memberSpin, claimSpinPrize } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

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

  // Freeze the segments reference seen by <SpinWheel> so RSC refreshes
  // triggered by server actions (which re-run the server page and produce
  // a fresh segments.map(...) array) don't leak a new reference into the
  // wheel and cause its init effect to tear down the canvas mid-spin.
  const stableSegments = useRef(segments).current;

  const [currentBalance, setCurrentBalance] = useState(balance);
  const [recentSpins, setRecentSpins] = useState(initialSpins);
  const [pendingPrizes, setPendingPrizes] = useState(initialPending);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinError, setSpinError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const wheelRef = useRef<SpinWheelHandle>(null);

  function handleSpinClick() {
    if (isSpinning || currentBalance < spinCost) return;
    if (wheelRef.current?.isSpinning()) return;

    setSpinError(null);
    setIsSpinning(true);

    startTransition(async () => {
      const res = await memberSpin(clubSlug);

      if ("error" in res) {
        setSpinError(res.error);
        setIsSpinning(false);
        return;
      }

      const localizedLabel = segments[res.segmentIndex]?.label ?? res.outcome.label;
      const isWin = res.outcome.rewardType !== "nothing" && res.outcome.value > 0;
      const newSpinId = crypto.randomUUID();

      // Kick off the wheel animation imperatively — no prop/callback churn.
      wheelRef.current?.spin({
        ...res,
        outcome: { ...res.outcome, label: localizedLabel },
      });

      // Defer parent state updates until after the ~4s wheel animation
      // so the balance prop doesn't change mid-spin.
      setTimeout(() => {
        setCurrentBalance(res.newBalance);
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
        setIsSpinning(false);
      }, 4200);
    });
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
    <div className="min-h-screen" style={{ background: "var(--m-surface-sunken)" }}>
      {/* Editorial top bar */}
      <header
        className="border-b px-5 pt-12 pb-5"
        style={{
          background: "var(--m-surface)",
          borderColor: "var(--m-border)",
          paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)",
        }}
      >
        <p className="m-caption">BONUSES</p>
        <h1 className="m-display mt-1 text-[color:var(--m-ink)]">{t("spin.title")}</h1>
        {spinCost > 1 && (
          <p className="mt-2 text-xs text-[color:var(--m-ink-muted)]">
            Cost: {formatBalance(spinCost, displayDecimals)} per spin
          </p>
        )}
      </header>

      <div className="mx-auto max-w-md space-y-5 px-5 pb-10 pt-5">
        {/* Stats row — editorial */}
        <div className="grid grid-cols-3 gap-3">
          <div className="m-card p-3 text-center">
            <p className="m-caption">{t("spin.statsRemaining")}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums club-primary">
              {formatBalance(currentBalance, displayDecimals)}
            </p>
          </div>
          <div className="m-card p-3 text-center">
            <p className="m-caption">{t("spin.statsCompleted")}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums club-primary">{totalSpins}</p>
          </div>
          <div className="m-card p-3 text-center">
            <p className="m-caption">{t("spin.statsLevel")}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums club-primary">
              {level}
              <span className="text-sm font-medium text-[color:var(--m-ink-muted)]">/10</span>
            </p>
          </div>
        </div>

        {/* Wheel card */}
        <div className="m-card p-2">
          <SpinWheel
            ref={wheelRef}
            segments={stableSegments}
            balance={currentBalance}
            spinCost={spinCost}
            hideButton
          />
          <div className="mt-2 flex flex-col items-center gap-2 pb-2">
            <button
              onClick={handleSpinClick}
              disabled={isSpinning || currentBalance < spinCost}
              className="club-btn rounded-full px-8 py-3 text-lg font-bold shadow-lg disabled:cursor-not-allowed"
            >
              {isSpinning
                ? "Spinning..."
                : currentBalance < spinCost
                  ? "No Spins Left"
                  : "Spin the Wheel"}
            </button>
            {spinError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center">
                <p className="text-sm text-red-400">{spinError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Earn more spins → Quests link */}
        <Link
          href={`/${clubSlug}`}
          className="m-card flex items-center justify-center gap-2 px-4 py-3 text-center text-sm font-semibold text-[color:var(--m-ink)] transition-transform active:scale-[0.98]"
        >
          <span>{t("spin.goToQuests")}</span>
        </Link>

        {/* Unclaimed prizes */}
        {pendingPrizes.length > 0 && (
          <section className="space-y-2">
            <h2 className="m-caption px-1">{t("spin.unclaimedPrizes")}</h2>
            <div className="m-card overflow-hidden">
              <div className="divide-y" style={{ borderColor: "var(--m-border)" }}>
                {pendingPrizes.map((prize) => {
                  const isClaimed = claimedIds.has(prize.id);
                  const isClaiming = claimingId === prize.id;
                  return (
                    <div
                      key={prize.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[color:var(--m-ink)]">
                          {prize.outcomeLabel}
                        </p>
                        <p
                          className="mt-0.5 text-[11px] text-[color:var(--m-ink-muted)]"
                          suppressHydrationWarning
                        >
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
                        className={`shrink-0 rounded-[var(--m-radius-sm)] px-4 py-2 text-xs font-semibold transition ${
                          isClaimed
                            ? "bg-green-100 text-green-800"
                            : "m-btn-ink"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
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
          </section>
        )}

        {questsSection}

        {/* No spins message */}
        {currentBalance < spinCost && (
          <div className="m-card p-4 text-center">
            <p className="text-sm text-[color:var(--m-ink-muted)]">{t("spin.earnMore")}</p>
          </div>
        )}

        {/* Prize history (was recent spins) */}
        {recentSpins.length > 0 && (
          <section className="space-y-2">
            <h2 className="m-caption px-1">{t("spin.prizeHistory")}</h2>
            <div className="m-card overflow-hidden">
              <div className="divide-y" style={{ borderColor: "var(--m-border)" }}>
                {recentSpins.map((spin) => {
                  const isWin = spin.outcomeValue > 0;
                  return (
                    <div
                      key={spin.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            isWin ? "club-tint-bg club-primary" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isWin ? (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 12H4"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--m-ink)]">
                            {spin.outcomeLabel}
                          </p>
                          <p
                            className="text-[11px] text-[color:var(--m-ink-muted)]"
                            suppressHydrationWarning
                          >
                            {new Date(spin.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isWin && spin.status === "pending" && (
                          <span className="rounded-[var(--m-radius-xs)] bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            {t("spin.pending")}
                          </span>
                        )}
                        {isWin && spin.status === "fulfilled" && (
                          <span className="rounded-[var(--m-radius-xs)] bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                            {t("spin.fulfilled")}
                          </span>
                        )}
                        <span
                          className={`rounded-[var(--m-radius-xs)] px-2 py-0.5 text-xs font-semibold ${
                            isWin
                              ? "club-tint-bg club-tint-text"
                              : "bg-gray-100 text-gray-500"
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
          </section>
        )}
      </div>
    </div>
  );
}
