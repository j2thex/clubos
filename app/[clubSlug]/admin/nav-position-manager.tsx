"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { setNavPosition, type NavPosition } from "./actions";

export function NavPositionManager({
  clubId,
  clubSlug,
  initialPosition,
}: {
  clubId: string;
  clubSlug: string;
  initialPosition: NavPosition;
}) {
  const { t } = useLanguage();
  const [position, setPosition] = useState<NavPosition>(initialPosition);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: NavPosition) {
    if (next === position) return;
    const previous = position;
    setPosition(next);
    startTransition(async () => {
      const result = await setNavPosition(clubId, next, clubSlug);
      if ("error" in result) {
        setPosition(previous);
        toast.error(result.error);
        return;
      }
      toast.success(t("admin.layout.toastSaved"));
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 py-4 space-y-3">
        <p className="text-xs text-gray-500">{t("admin.layout.desc")}</p>
        <div className="space-y-2">
          <PositionOption
            value="bottom"
            checked={position === "bottom"}
            disabled={isPending}
            onSelect={handleChange}
            label={t("admin.layout.bottom")}
            desc={t("admin.layout.bottomDesc")}
          />
          <PositionOption
            value="top"
            checked={position === "top"}
            disabled={isPending}
            onSelect={handleChange}
            label={t("admin.layout.top")}
            desc={t("admin.layout.topDesc")}
          />
        </div>
      </div>
    </div>
  );
}

function PositionOption({
  value,
  checked,
  disabled,
  onSelect,
  label,
  desc,
}: {
  value: NavPosition;
  checked: boolean;
  disabled: boolean;
  onSelect: (v: NavPosition) => void;
  label: string;
  desc: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="radio"
        name="nav-position"
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
