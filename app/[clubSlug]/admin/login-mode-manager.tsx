"use client";

import { useState, useEffect, useTransition } from "react";
import { updateLoginMode, updateInviteOnly, updateInviteMode, saveInviteButtons, updateHideMemberLogin, updatePreregistrationEnabled, updateAutoRegistration } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

interface InviteButton {
  id: string;
  type: string;
  label: string | null;
  url: string;
  icon_url: string | null;
  display_order: number;
}

const PREDEFINED_TYPES = [
  { type: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/..." },
  { type: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { type: "telegram", label: "Telegram", placeholder: "https://t.me/..." },
  { type: "email", label: "Email", placeholder: "mailto:..." },
];

export function LoginModeManager({
  loginMode,
  inviteOnly,
  inviteMode,
  inviteButtons,
  hideMemberLogin,
  preregistrationEnabled,
  autoRegistration,
  clubId,
  clubSlug,
}: {
  loginMode: string;
  inviteOnly: boolean;
  inviteMode: string;
  inviteButtons: InviteButton[];
  hideMemberLogin: boolean;
  preregistrationEnabled: boolean;
  autoRegistration: boolean;
  clubId: string;
  clubSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  // Local state for button editing
  const [localMode, setLocalMode] = useState(inviteMode);
  const [predefined, setPredefined] = useState<Record<string, { enabled: boolean; url: string }>>(() => {
    const map: Record<string, { enabled: boolean; url: string }> = {};
    for (const p of PREDEFINED_TYPES) {
      const existing = inviteButtons.find((b) => b.type === p.type);
      map[p.type] = { enabled: !!existing, url: existing?.url ?? "" };
    }
    return map;
  });
  const [customButtons, setCustomButtons] = useState<{ label: string; url: string }[]>(() =>
    inviteButtons
      .filter((b) => !PREDEFINED_TYPES.some((p) => p.type === b.type))
      .map((b) => ({ label: b.label ?? "", url: b.url })),
  );
  const [customLabel, setCustomLabel] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Sync props when they change from server
  useEffect(() => {
    setLocalMode(inviteMode);
  }, [inviteMode]);

  useEffect(() => {
    const map: Record<string, { enabled: boolean; url: string }> = {};
    for (const p of PREDEFINED_TYPES) {
      const existing = inviteButtons.find((b) => b.type === p.type);
      map[p.type] = { enabled: !!existing, url: existing?.url ?? "" };
    }
    setPredefined(map);
    setCustomButtons(
      inviteButtons
        .filter((b) => !PREDEFINED_TYPES.some((p) => p.type === b.type))
        .map((b) => ({ label: b.label ?? "", url: b.url })),
    );
  }, [inviteButtons]);

  function handleChange(mode: string) {
    startTransition(async () => {
      await updateLoginMode(clubId, mode, clubSlug);
    });
  }

  function handleInviteToggle(checked: boolean) {
    startTransition(async () => {
      await updateInviteOnly(clubId, checked, clubSlug);
    });
  }

  function handleHideLoginToggle(checked: boolean) {
    startTransition(async () => {
      await updateHideMemberLogin(clubId, checked, clubSlug);
    });
  }

  function handlePreregToggle(checked: boolean) {
    startTransition(async () => {
      await updatePreregistrationEnabled(clubId, checked, clubSlug);
    });
  }

  function handleAutoRegToggle(checked: boolean) {
    startTransition(async () => {
      await updateAutoRegistration(clubId, checked, clubSlug);
    });
  }

  function handleModeChange(mode: string) {
    setLocalMode(mode);
    startTransition(async () => {
      await updateInviteMode(clubId, mode, clubSlug);
    });
  }

  function handleAddCustom() {
    if (!customLabel.trim() || !customUrl.trim()) return;
    setCustomButtons((prev) => [...prev, { label: customLabel.trim(), url: customUrl.trim() }]);
    setCustomLabel("");
    setCustomUrl("");
  }

  function handleRemoveCustom(index: number) {
    setCustomButtons((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSaveButtons() {
    const buttons: { type: string; label: string | null; url: string }[] = [];

    for (const p of PREDEFINED_TYPES) {
      const state = predefined[p.type];
      if (state.enabled && state.url.trim()) {
        buttons.push({ type: p.type, label: null, url: state.url.trim() });
      }
    }

    for (const c of customButtons) {
      if (c.url.trim()) {
        buttons.push({ type: "custom", label: c.label || null, url: c.url.trim() });
      }
    }

    setSaveStatus(null);
    startTransition(async () => {
      const result = await saveInviteButtons(clubId, buttons, clubSlug);
      if ("error" in result) {
        setSaveStatus(result.error);
      } else {
        setSaveStatus("Saved!");
        setTimeout(() => setSaveStatus(null), 2000);
      }
    });
  }

  const options = [
    {
      value: "code_only",
      label: t("admin.codeOnly"),
      description: t("admin.codeOnlyDesc"),
    },
    {
      value: "code_and_expiry",
      label: t("admin.codeAndExpiry"),
      description: t("admin.codeAndExpiryDesc"),
    },
  ];

  const inviteModeOptions = [
    {
      value: "form",
      label: t("admin.inviteModeForm"),
      description: t("admin.inviteModeFormDesc"),
    },
    {
      value: "social",
      label: t("admin.inviteModeSocial"),
      description: t("admin.inviteModeSocialDesc"),
    },
  ];

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t("admin.memberLogin")}
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              type="radio"
              name="loginMode"
              value={opt.value}
              checked={loginMode === opt.value}
              onChange={() => handleChange(opt.value)}
              className="mt-0.5 rounded-full border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
            </div>
          </label>
        ))}
        <label
          className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            type="checkbox"
            checked={inviteOnly}
            onChange={(e) => handleInviteToggle(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{t("admin.inviteOnly")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("admin.inviteOnlyDesc")}</p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            type="checkbox"
            checked={preregistrationEnabled}
            onChange={(e) => handlePreregToggle(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{t("admin.preregistration")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("admin.preregistrationDesc")}</p>
          </div>
        </label>

        {/* Auto-registration sub-option */}
        {preregistrationEnabled && (
          <label
            className={`flex items-start gap-3 px-5 py-3 ml-8 cursor-pointer hover:bg-gray-50 transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              type="checkbox"
              checked={autoRegistration}
              onChange={(e) => handleAutoRegToggle(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{t("admin.autoRegistration")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("admin.autoRegistrationDesc")}</p>
            </div>
          </label>
        )}

        {/* Invite Mode sub-section */}
        {inviteOnly && (
          <div className="bg-gray-50 px-5 py-4 ml-8 space-y-4">
            <label
              className={`flex items-start gap-3 cursor-pointer ${isPending ? "opacity-50 pointer-events-none" : ""}`}
            >
              <input
                type="checkbox"
                checked={hideMemberLogin}
                onChange={(e) => handleHideLoginToggle(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{t("admin.hideMemberLogin")}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t("admin.hideMemberLoginDesc")}</p>
              </div>
            </label>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t("admin.inviteMode")}
            </p>

            {inviteModeOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 cursor-pointer ${isPending ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  type="radio"
                  name="inviteMode"
                  value={opt.value}
                  checked={localMode === opt.value}
                  onChange={() => handleModeChange(opt.value)}
                  className="mt-0.5 rounded-full border-gray-300 text-gray-800 focus:ring-gray-400"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
                </div>
              </label>
            ))}

            {/* Social buttons editor */}
            {localMode === "social" && (
              <div className="space-y-4 pt-2">
                {/* Predefined buttons */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500">Predefined:</p>
                  {PREDEFINED_TYPES.map((p) => (
                    <div key={p.type} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={predefined[p.type].enabled}
                        onChange={(e) =>
                          setPredefined((prev) => ({
                            ...prev,
                            [p.type]: { ...prev[p.type], enabled: e.target.checked },
                          }))
                        }
                        className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                      />
                      <span className="text-sm text-gray-700 w-20 shrink-0">{p.label}</span>
                      <input
                        type="text"
                        value={predefined[p.type].url}
                        onChange={(e) =>
                          setPredefined((prev) => ({
                            ...prev,
                            [p.type]: { ...prev[p.type], url: e.target.value },
                          }))
                        }
                        placeholder={p.placeholder}
                        disabled={!predefined[p.type].enabled}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition disabled:opacity-40 disabled:bg-gray-100"
                      />
                    </div>
                  ))}
                </div>

                {/* Custom buttons */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500">Custom buttons:</p>
                  {customButtons.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 truncate max-w-[100px]">{c.label}</span>
                      <span className="text-xs text-gray-400 truncate flex-1">{c.url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustom(i)}
                        className="text-xs text-red-500 hover:text-red-700 shrink-0"
                      >
                        {t("common.remove")}
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="Label"
                      className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                    />
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustom}
                      disabled={!customLabel.trim() || !customUrl.trim()}
                      className="text-xs font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
                    >
                      {t("common.add")}
                    </button>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveButtons}
                    disabled={isPending}
                    className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {isPending ? t("common.loading") : t("admin.inviteButtonsSave")}
                  </button>
                  {saveStatus && (
                    <span className={`text-xs ${saveStatus === "Saved!" ? "text-green-600" : "text-red-600"}`}>
                      {saveStatus}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
