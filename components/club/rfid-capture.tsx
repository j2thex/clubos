"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/provider";

// Sycreader SYC ID&IC (and most cheap HID-keyboard RFID readers) type the
// tag's UID into the focused input as plain characters, then press Enter.
// This component focuses a capture input, collects whatever gets typed, and
// locks the UID in when Enter arrives. Works read-only — it can't write
// chips. Also supports manual text entry as a fallback.

export function RfidCapture({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (uid: string | null) => void;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [showManual, setShowManual] = useState(false);

  // When entering scan mode, auto-focus the capture input so keystrokes from
  // the reader land here instead of bubbling to another focused field.
  useEffect(() => {
    if (!value && mode === "scan" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [value, mode]);

  function commit(raw: string) {
    const uid = raw.trim();
    if (!uid) return;
    onChange(uid);
    setDraft("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(draft);
    }
  }

  function rescan() {
    onChange(null);
    setDraft("");
    setMode("scan");
    setShowManual(false);
    // focus handled by effect once value becomes null
  }

  if (value) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">{label}</span>
          <button
            type="button"
            onClick={rescan}
            className="text-[11px] text-blue-600 hover:underline"
          >
            {t("ops.memberForm.rfid.rescan")}
          </button>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-mono text-green-800">
          {value}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-gray-500 block">{label}</span>

      {mode === "scan" && (
        <>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("ops.memberForm.rfid.prompt")}
            autoComplete="off"
            className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-3 py-3 text-sm font-mono tracking-wide text-gray-900 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          />
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-400">{t("ops.memberForm.rfid.hint")}</span>
            <button
              type="button"
              onClick={() => {
                setMode("manual");
                setShowManual(true);
              }}
              className="text-blue-600 hover:underline"
            >
              {t("ops.memberForm.rfid.manualToggle")}
            </button>
          </div>
        </>
      )}

      {mode === "manual" && showManual && (
        <>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("ops.memberForm.rfid.manualPlaceholder")}
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          />
          <div className="flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => commit(draft)}
              disabled={!draft.trim()}
              className="rounded-lg bg-gray-800 text-white px-3 py-1 font-semibold hover:bg-gray-700 disabled:opacity-50"
            >
              {t("ops.memberForm.rfid.save")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("scan");
                setShowManual(false);
                setDraft("");
              }}
              className="text-blue-600 hover:underline"
            >
              {t("ops.memberForm.rfid.backToScan")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
