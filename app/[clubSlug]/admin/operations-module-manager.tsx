"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { setCurrencyMode, toggleOperationsModule } from "./actions";

type CurrencyMode = "saldo" | "cash";

export function OperationsModuleManager({
  clubId,
  clubSlug,
  initialEnabled,
  initialCurrencyMode,
}: {
  clubId: string;
  clubSlug: string;
  initialEnabled: boolean;
  initialCurrencyMode: CurrencyMode;
}) {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [currencyMode, setCurrencyModeState] = useState<CurrencyMode>(initialCurrencyMode);
  const [isPending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await toggleOperationsModule(clubId, next, clubSlug);
      if ("error" in result) {
        setEnabled(previous);
        toast.error(result.error);
        return;
      }
      toast.success(t(next ? "ops.admin.toastEnabled" : "ops.admin.toastDisabled"));
    });
  }

  function handleCurrencyChange(next: CurrencyMode) {
    if (next === currencyMode) return;
    const previous = currencyMode;
    setCurrencyModeState(next);
    startTransition(async () => {
      const result = await setCurrencyMode(clubId, next, clubSlug);
      if ("error" in result) {
        setCurrencyModeState(previous);
        toast.error(result.error);
        return;
      }
      toast.success(t("ops.admin.currencyChanged"));
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 py-4 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            disabled={isPending}
            onChange={(e) => handleToggle(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-900">
            {t("ops.admin.enableLabel")}
            <span className="block text-xs text-gray-500 mt-0.5">
              {t("ops.admin.enableDesc")}
            </span>
          </span>
        </label>

        {enabled && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            {t("ops.admin.warning")}
          </div>
        )}

        {enabled && (
          <fieldset className="border-t border-gray-100 pt-3 space-y-2">
            <legend className="text-sm font-medium text-gray-900">
              {t("ops.admin.currencyLabel")}
              <span className="block text-xs font-normal text-gray-500 mt-0.5">
                {t("ops.admin.currencyDesc")}
              </span>
            </legend>
            <div className="space-y-2">
              <CurrencyOption
                value="cash"
                checked={currencyMode === "cash"}
                disabled={isPending}
                onSelect={handleCurrencyChange}
                label={t("ops.admin.currencyCash")}
                desc={t("ops.admin.currencyCashDesc")}
              />
              <CurrencyOption
                value="saldo"
                checked={currencyMode === "saldo"}
                disabled={isPending}
                onSelect={handleCurrencyChange}
                label={t("ops.admin.currencySaldo")}
                desc={t("ops.admin.currencySaldoDesc")}
              />
            </div>
          </fieldset>
        )}
      </div>
    </div>
  );
}

function CurrencyOption({
  value,
  checked,
  disabled,
  onSelect,
  label,
  desc,
}: {
  value: CurrencyMode;
  checked: boolean;
  disabled: boolean;
  onSelect: (v: CurrencyMode) => void;
  label: string;
  desc: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="radio"
        name="currency-mode"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="mt-0.5 h-4 w-4 border-gray-300"
      />
      <span className="text-sm text-gray-900">
        {label}
        <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
      </span>
    </label>
  );
}
