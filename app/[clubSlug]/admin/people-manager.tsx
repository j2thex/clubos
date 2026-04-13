"use client";

import { useState, useTransition } from "react";
import { createMember, createStaffMember, toggleMemberStatus, deleteMember, createReferralSource, deleteReferralSource } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";
import { ReferralTree, type ReferrerSummary, type MemberOption } from "./referral-tree";

interface Member {
  id: string;
  member_code: string;
  full_name: string | null;
  spin_balance: number;
  is_staff: boolean;
  status: string;
  roleName: string | null;
}

const PRESET_SOURCES = [
  { label: "Google Maps", code: "GOOGLE-MAPS" },
  { label: "Instagram", code: "INSTAGRAM" },
  { label: "Facebook", code: "FACEBOOK" },
  { label: "WhatsApp", code: "WHATSAPP" },
  { label: "Telegram", code: "TELEGRAM" },
  { label: "TikTok", code: "TIKTOK" },
  { label: "osocios", code: "OSOCIOS" },
];

export function PeopleManager({
  clubId,
  clubSlug,
  members,
  staff,
  referralSources = [],
  referralTree = [],
  referralMemberOptions = [],
}: {
  clubId: string;
  clubSlug: string;
  members: Member[];
  staff: Member[];
  referralSources?: Member[];
  referralTree?: ReferrerSummary[];
  referralMemberOptions?: MemberOption[];
}) {
  const [tab, setTab] = useState<"members" | "staff" | "referrals" | "tree">("members");
  const totalReferrals = referralTree.reduce((sum, r) => sum + r.referrals.length, 0);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [referralName, setReferralName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = tab === "staff"
        ? await createStaffMember(clubId, code, pin, clubSlug)
        : await createMember(clubId, code, clubSlug);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(t("admin.codeCreated", { code: code.toUpperCase() }));
        setCode("");
        setPin("");
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  function handleCreateReferral(sourceName: string) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await createReferralSource(clubId, sourceName, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(`Referral source "${sourceName.toUpperCase()}" created`);
        setReferralName("");
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  function handleDeleteReferral(source: Member) {
    if (!window.confirm(`Delete referral source "${source.member_code}"?`)) return;

    startTransition(async () => {
      const result = await deleteReferralSource(source.id, clubSlug);
      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  const list = tab === "members" ? members : staff;

  // Existing referral source codes for hiding preset buttons already added
  const existingCodes = new Set(referralSources.map((s) => s.member_code));

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t("admin.people")}
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Tab toggle */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setTab("members"); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              tab === "members"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t("admin.membersCount", { count: members.length })}
          </button>
          <button
            onClick={() => { setTab("staff"); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              tab === "staff"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t("admin.staffCount", { count: staff.length })}
          </button>
          <button
            onClick={() => { setTab("referrals"); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              tab === "referrals"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Sources ({referralSources.length})
          </button>
          <button
            onClick={() => { setTab("tree"); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              tab === "tree"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Referrals ({totalReferrals})
          </button>
        </div>

        {tab === "tree" && (
          <div className="p-4">
            <ReferralTree
              referrers={referralTree}
              clubSlug={clubSlug}
              memberOptions={referralMemberOptions}
            />
          </div>
        )}

        {/* Members / Staff create form */}
        {(tab === "members" || tab === "staff") && (
          <form onSubmit={handleCreate} className="px-4 py-4 border-b border-gray-100">
            <div className={`flex gap-3 items-end ${tab === "staff" ? "" : ""}`}>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {tab === "staff" ? t("common.staffCode") : t("common.memberCode")}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC12"
                  maxLength={8}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
                />
              </div>

              {tab === "staff" && (
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t("common.pin")}
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder={t("admin.pinPlaceholder")}
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-widest text-center text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || !code.trim() || (tab === "staff" && !pin.trim())}
                className="rounded-lg bg-gray-800 text-white px-5 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {isPending ? "..." : t("common.add")}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            )}
            {success && (
              <p className="mt-2 text-xs text-green-700">{success}</p>
            )}
          </form>
        )}

        {/* Referral Sources panel */}
        {tab === "referrals" && (
          <div className="px-4 py-4 border-b border-gray-100 space-y-3">
            {/* Quick-add preset buttons */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Quick add
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SOURCES.filter((s) => !existingCodes.has(s.code)).map((source) => (
                  <button
                    key={source.code}
                    type="button"
                    onClick={() => handleCreateReferral(source.code)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-700 px-3 py-1.5 text-xs font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    {source.label}
                  </button>
                ))}
                {PRESET_SOURCES.every((s) => existingCodes.has(s.code)) && (
                  <span className="text-xs text-gray-400">All preset sources added</span>
                )}
              </div>
            </div>

            {/* Custom referral source input */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Custom source
              </label>
              <div className="flex gap-3 items-end">
                <input
                  type="text"
                  value={referralName}
                  onChange={(e) => setReferralName(e.target.value)}
                  placeholder="e.g. FLYER-MARCH"
                  maxLength={30}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
                />
                <button
                  type="button"
                  onClick={() => referralName.trim() && handleCreateReferral(referralName)}
                  disabled={isPending || !referralName.trim()}
                  className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {isPending ? "..." : "Add"}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
            {success && (
              <p className="mt-1 text-xs text-green-700">{success}</p>
            )}
          </div>
        )}

        {/* Members / Staff list */}
        {(tab === "members" || tab === "staff") && (
          <>
            {list.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {list.map((person) => (
                  <div key={person.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-gray-900 text-sm tracking-wide">
                          {person.member_code}
                        </span>
                        {person.roleName && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {person.roleName}
                          </span>
                        )}
                      </div>
                      {person.full_name && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{person.full_name}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      {tab === "members" && (
                        <p className="text-sm font-semibold text-gray-900">
                          {person.spin_balance} <span className="text-xs font-normal text-gray-400">{t("common.spinsLabel")}</span>
                        </p>
                      )}
                      <button
                        onClick={() => {
                          startTransition(async () => {
                            await toggleMemberStatus(person.id, clubSlug);
                          });
                        }}
                        disabled={isPending}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
                          person.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                            : "bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-700"
                        }`}
                      >
                        {person.status === "active" ? t("common.active") : t("common.inactive")}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t("admin.deleteConfirm", { code: person.member_code }))) {
                            startTransition(async () => {
                              await deleteMember(person.id, clubSlug);
                            });
                          }
                        }}
                        disabled={isPending}
                        className="text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors"
                        title="Delete member"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                {tab === "members" ? t("admin.noMembers") : t("admin.noStaff")}
              </div>
            )}
          </>
        )}

        {/* Referral Sources list */}
        {tab === "referrals" && (
          <>
            {referralSources.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {referralSources.map((source) => (
                  <div key={source.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono font-semibold text-gray-900 text-sm tracking-wide">
                        {source.member_code}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteReferral(source)}
                      disabled={isPending}
                      className="text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors"
                      title="Delete referral source"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                No referral sources yet. Add one above to start tracking where members come from.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
