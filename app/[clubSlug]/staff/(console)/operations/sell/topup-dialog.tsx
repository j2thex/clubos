"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { topupSaldo } from "./actions";

type TopupMethod = "cash" | "transfer" | "bizum" | "other";

export function TopupDialog({
  open,
  clubId,
  clubSlug,
  memberId,
  memberCode,
  onClose,
  onSuccess,
}: {
  open: boolean;
  clubId: string;
  clubSlug: string;
  memberId: string;
  memberCode: string;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<TopupMethod>("cash");
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const amountNum = Number(amount);
  const amountValid = Number.isFinite(amountNum) && amountNum > 0;

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!amountValid) return;
    startTransition(async () => {
      const r = await topupSaldo(clubSlug, {
        clubId,
        memberId,
        amount: amountNum,
        method,
        comment: comment.trim() || null,
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(
        t("ops.topup.success", {
          amount: amountNum.toFixed(2),
          balance: r.balanceAfter.toFixed(2),
        }),
      );
      setAmount("");
      setComment("");
      setMethod("cash");
      onSuccess(r.balanceAfter);
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
        onSubmit={handleConfirm}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {t("ops.topup.title", { code: memberCode })}
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">
              {t("ops.topup.amount")}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 text-lg font-semibold text-gray-900 text-center"
            />
          </label>

          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold text-gray-700">
              {t("ops.topup.method")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "transfer", "bizum", "other"] as TopupMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`text-sm font-semibold rounded-lg px-3 py-2 transition ${
                    method === m
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t(
                    m === "cash"
                      ? "ops.topup.methodCash"
                      : m === "transfer"
                        ? "ops.topup.methodTransfer"
                        : m === "bizum"
                          ? "ops.topup.methodBizum"
                          : "ops.topup.methodOther",
                  )}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-xs font-semibold text-gray-700">
              {t("ops.topup.commentLabel")}
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </label>
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
            disabled={isPending || !amountValid}
            className="flex-1 rounded-lg bg-green-600 text-white text-sm font-semibold py-2.5 hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "…" : t("ops.topup.confirm")}
          </button>
        </div>
      </form>
    </div>
  );
}
