"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import {
  getMemberSaldoLedger,
  adminAdjustSaldo,
  type SaldoLedgerEntry,
} from "./actions";

type LedgerState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; balance: number; entries: SaldoLedgerEntry[] }
  | { status: "error"; message: string };

export function SaldoLedgerCard({
  memberId,
  memberCode,
  clubSlug,
}: {
  memberId: string;
  memberCode: string;
  clubSlug: string;
}) {
  const { t } = useLanguage();
  const [state, setState] = useState<LedgerState>({ status: "idle" });
  const [adjustOpen, setAdjustOpen] = useState(false);

  async function load() {
    setState({ status: "loading" });
    const r = await getMemberSaldoLedger(memberId);
    if ("error" in r) {
      setState({ status: "error", message: r.error });
      return;
    }
    setState({ status: "ready", balance: r.balance, entries: r.entries });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-gray-400 tracking-wide">
            {t("admin.saldo.title")}
          </p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {state.status === "ready" ? `${state.balance.toFixed(2)} €` : "…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdjustOpen(true)}
          disabled={state.status !== "ready"}
          className="text-xs rounded-full bg-gray-900 text-white px-3 py-2 font-semibold hover:bg-gray-700 disabled:opacity-50"
        >
          {t("admin.saldo.adjust")}
        </button>
      </div>

      {state.status === "error" && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}

      {state.status === "ready" && state.entries.length === 0 && (
        <p className="text-xs text-gray-500">{t("admin.saldo.noEntries")}</p>
      )}

      {state.status === "ready" && state.entries.length > 0 && (
        <div className="border-t border-gray-100 -mx-4">
          <div className="divide-y divide-gray-100">
            {state.entries.map((e) => (
              <LedgerRow key={e.id} entry={e} />
            ))}
          </div>
        </div>
      )}

      <AdjustSaldoDialog
        open={adjustOpen}
        memberId={memberId}
        memberCode={memberCode}
        clubSlug={clubSlug}
        currentBalance={state.status === "ready" ? state.balance : 0}
        onClose={() => setAdjustOpen(false)}
        onAdjusted={() => {
          setAdjustOpen(false);
          load();
        }}
      />
    </div>
  );
}

function LedgerRow({ entry }: { entry: SaldoLedgerEntry }) {
  const { t } = useLanguage();
  const isPositive = entry.amount >= 0;
  const typeKey = `admin.saldo.type.${entry.type}` as const;
  return (
    <div className="px-4 py-2 flex items-center gap-3 text-xs">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-700">{t(typeKey)}</p>
        <p className="text-[10px] text-gray-400">
          {new Date(entry.createdAt).toLocaleString()}
          {entry.method ? ` · ${entry.method}` : ""}
        </p>
        {entry.comment && (
          <p className="text-[10px] text-gray-500 italic truncate">{entry.comment}</p>
        )}
      </div>
      <span
        className={`tabular-nums font-semibold ${
          isPositive ? "text-green-700" : "text-red-700"
        }`}
      >
        {isPositive ? "+" : ""}
        {entry.amount.toFixed(2)} €
      </span>
      <span className="tabular-nums text-gray-500 w-16 text-right">
        {entry.balanceAfter.toFixed(2)} €
      </span>
    </div>
  );
}

function AdjustSaldoDialog({
  open,
  memberId,
  memberCode,
  clubSlug,
  currentBalance,
  onClose,
  onAdjusted,
}: {
  open: boolean;
  memberId: string;
  memberCode: string;
  clubSlug: string;
  currentBalance: number;
  onClose: () => void;
  onAdjusted: () => void;
}) {
  const { t } = useLanguage();
  const [direction, setDirection] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const amountNum = Number(amount);
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;
  const signedAmount = direction === "add" ? amountNum : -amountNum;
  const wouldBe = currentBalance + signedAmount;
  const tooNegative = wouldBe < 0;
  const canSubmit = amountValid && comment.trim().length > 0 && !tooNegative;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    startTransition(async () => {
      const r = await adminAdjustSaldo(memberId, clubSlug, signedAmount, comment.trim());
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(t("admin.saldo.adjustedToast", { balance: r.balanceAfter.toFixed(2) }));
      setAmount("");
      setComment("");
      setDirection("add");
      onAdjusted();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      onClick={onClose}
      role="presentation"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {t("admin.saldo.adjustTitle", { code: memberCode })}
          </h2>
          <p className="text-xs text-gray-500 mt-1 tabular-nums">
            {t("admin.saldo.currentBalance", { balance: currentBalance.toFixed(2) })}
          </p>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("add")}
              className={`text-sm font-semibold rounded-lg px-3 py-2 transition ${
                direction === "add"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              + {t("admin.saldo.add")}
            </button>
            <button
              type="button"
              onClick={() => setDirection("subtract")}
              className={`text-sm font-semibold rounded-lg px-3 py-2 transition ${
                direction === "subtract"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              − {t("admin.saldo.subtract")}
            </button>
          </div>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg font-semibold text-gray-900 text-center"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("admin.saldo.commentRequired")}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {amountValid && (
            <div
              className={`rounded-lg px-3 py-2 text-xs ${
                tooNegative
                  ? "bg-red-50 text-red-700 font-semibold"
                  : "bg-gray-50 text-gray-700"
              }`}
            >
              {tooNegative
                ? t("admin.saldo.wouldGoNegative")
                : t("admin.saldo.balanceAfter", { balance: wouldBe.toFixed(2) })}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 py-2.5 disabled:opacity-50"
          >
            {t("ops.sell.cancel")}
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="flex-1 rounded-lg bg-gray-900 text-white text-sm font-semibold py-2.5 disabled:opacity-50"
          >
            {isPending ? "…" : t("admin.saldo.confirmAdjust")}
          </button>
        </div>
      </form>
    </div>
  );
}
