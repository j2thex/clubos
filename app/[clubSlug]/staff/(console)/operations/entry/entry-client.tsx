"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import {
  lookupMemberForEntry,
  admitMember,
  checkoutEntry,
  searchMembersByName,
  type LookedUpMember,
  type MemberSearchResult,
} from "./actions";

// Camera scanner is client-only and heavy — lazy-load it.
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false, loading: () => <ScannerPlaceholder /> },
);

function ScannerPlaceholder() {
  return (
    <div className="aspect-square w-full rounded-2xl bg-gray-900 flex items-center justify-center">
      <span className="text-xs text-gray-400">…</span>
    </div>
  );
}

type Mode = "idle" | "scanning" | "manual" | "search";

type BlockedReason = {
  key: string;
  params?: Record<string, string | number>;
  fixable: boolean;
};

function computeBlockedReason(member: LookedUpMember): BlockedReason | null {
  if (member.age === null) {
    return { key: "ops.entry.reasonNoDob", fixable: true };
  }
  if (member.age < 21) {
    return { key: "ops.entry.reasonUnderage", params: { age: member.age }, fixable: false };
  }
  if (member.validExpired && member.validTill) {
    return { key: "ops.entry.reasonExpired", params: { date: member.validTill }, fixable: true };
  }
  return null;
}

export function EntryClient({
  clubId,
  clubSlug,
  initialMemberCode,
  membersHrefBase,
}: {
  clubId: string;
  clubSlug: string;
  initialMemberCode?: string | null;
  /**
   * Base path for the "fix in members" link shown when a member is blocked
   * (missing DOB, expired membership). Defaults to the staff members list;
   * admin can pass its own people/members route.
   */
  membersHrefBase?: string;
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("idle");
  const [manualCode, setManualCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [found, setFound] = useState<LookedUpMember | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const prefilledRef = useRef(false);

  async function runSearch(q: string) {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const r = await searchMembersByName(clubId, q);
    setSearchLoading(false);
    if ("ok" in r) setSearchResults(r.matches);
    else setSearchResults([]);
  }

  function reset() {
    setFound(null);
    setMessage(null);
    setManualCode("");
  }

  function handleCode(code: string) {
    setMode("idle");
    setMessage(null);
    startTransition(async () => {
      const res = await lookupMemberForEntry(clubId, code);
      if ("error" in res) {
        setMessage(res.error);
        setFound(null);
      } else {
        setFound(res.member);
      }
    });
  }

  useEffect(() => {
    if (prefilledRef.current) return;
    if (!initialMemberCode) return;
    prefilledRef.current = true;
    handleCode(initialMemberCode.toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMemberCode]);

  function handleAdmit() {
    if (!found) return;
    startTransition(async () => {
      const res = await admitMember(clubId, clubSlug, found.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(t("ops.entry.admitted", { code: found.memberCode }));
      reset();
    });
  }

  function handleCheckout() {
    if (!found?.openEntryId) return;
    startTransition(async () => {
      const res = await checkoutEntry(found.openEntryId!, clubSlug);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(t("ops.entry.checkedOut", { code: found.memberCode }));
      reset();
    });
  }

  return (
    <div className="space-y-4">
      {/* Scanner panel */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {mode === "scanning" ? (
          <div className="relative">
            <Scanner
              onScan={(results) => {
                const first = results[0]?.rawValue;
                if (first) handleCode(first);
              }}
              onError={(err) => {
                toast.error(
                  err instanceof Error ? err.message : "Camera error",
                );
                setMode("idle");
              }}
              constraints={{ facingMode: "environment" }}
              allowMultiple={false}
              scanDelay={400}
              styles={{ container: { aspectRatio: "1 / 1" } }}
            />
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="absolute top-3 right-3 rounded-full bg-black/60 text-white text-xs font-semibold px-3 py-1.5 hover:bg-black/80"
            >
              {t("ops.entry.cancel")}
            </button>
          </div>
        ) : mode === "manual" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) handleCode(manualCode.trim());
            }}
            className="p-5 space-y-3"
          >
            <label className="block text-xs font-medium text-gray-500">
              {t("ops.entry.memberCode")}
            </label>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder={t("ops.memberForm.codePlaceholder")}
              maxLength={8}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-mono uppercase tracking-wide text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending || !manualCode.trim()}
                className="flex-1 rounded-lg bg-gray-800 text-white text-sm font-semibold py-2 hover:bg-gray-700 disabled:opacity-50"
              >
                {isPending ? t("ops.entry.lookingUp") : t("ops.entry.findMember")}
              </button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 px-4 py-2 hover:bg-gray-50"
              >
                {t("ops.entry.cancel")}
              </button>
            </div>
          </form>
        ) : mode === "search" ? (
          <div className="p-4 space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => runSearch(e.target.value)}
              placeholder={t("ops.entry.searchPlaceholder")}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
            {searchLoading ? (
              <p className="text-xs text-gray-400 text-center">…</p>
            ) : searchResults.length === 0 && searchQuery.trim().length >= 2 ? (
              <p className="text-xs text-gray-400 text-center">
                {t("ops.entry.searchNoResults")}
              </p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto rounded-lg border border-gray-100">
                {searchResults.map((r) => (
                  <button
                    key={r.memberCode}
                    type="button"
                    onClick={() => handleCode(r.memberCode)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {r.memberCode}
                      </p>
                      {r.fullName && (
                        <p className="text-xs text-gray-500 truncate">
                          {r.fullName}
                        </p>
                      )}
                    </div>
                    {r.idVerifiedAt && (
                      <span className="text-[10px] rounded-full px-2 py-0.5 bg-green-100 text-green-700 font-semibold shrink-0">
                        {t("ops.entry.verified")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setMode("idle");
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="w-full rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 px-4 py-2"
            >
              {t("ops.entry.cancel")}
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <button
              type="button"
              onClick={() => {
                reset();
                setMode("scanning");
              }}
              className="w-full rounded-lg bg-gray-800 text-white text-sm font-semibold py-3 hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6.5V4a1 1 0 011-1h2.5M4 17.5V20a1 1 0 001 1h2.5M17.5 3H20a1 1 0 011 1v2.5M17.5 21H20a1 1 0 001-1v-2.5M8 8h8v8H8z"
                />
              </svg>
              {t("ops.entry.scanQr")}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setMode("manual");
              }}
              className="w-full rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 py-3 hover:bg-gray-50"
            >
              {t("ops.entry.enterManually")}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setSearchQuery("");
                setSearchResults([]);
                setMode("search");
              }}
              className="w-full rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 py-3 hover:bg-gray-50"
            >
              {t("ops.entry.searchByName")}
            </button>
          </div>
        )}
      </div>

      {message && !found && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {found && (
        <EntryDialog
          member={found}
          clubSlug={clubSlug}
          isPending={isPending}
          onAdmit={handleAdmit}
          onCheckout={handleCheckout}
          onClose={reset}
          membersHrefBase={membersHrefBase}
        />
      )}
    </div>
  );
}

function EntryDialog({
  member,
  clubSlug,
  isPending,
  onAdmit,
  onCheckout,
  onClose,
  membersHrefBase,
}: {
  member: LookedUpMember;
  clubSlug: string;
  isPending: boolean;
  onAdmit: () => void;
  onCheckout: () => void;
  onClose: () => void;
  membersHrefBase?: string;
}) {
  const { t } = useLanguage();
  const alreadyInside = !!member.openEntryId;
  const under21 = member.age !== null && member.age < 21;
  const blockedReason = computeBlockedReason(member);
  const blocked = !!blockedReason;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {member.idPhotoSignedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.idPhotoSignedUrl}
          alt=""
          className="w-full max-h-72 object-cover bg-gray-100"
        />
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
          {t("ops.entry.noPhoto")}
        </div>
      )}
      <div className="p-5 space-y-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            {member.memberCode}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {member.fullName ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {member.age !== null && (
            <span
              className={`text-xs rounded-full px-2.5 py-1 font-semibold ${
                under21
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {t("ops.entry.age", { age: member.age })}
            </span>
          )}
          {member.age === null && (
            <span className="text-xs rounded-full px-2.5 py-1 bg-red-100 text-red-700 font-semibold">
              {t("ops.entry.noDob")}
            </span>
          )}
          {member.idVerifiedAt ? (
            <span className="text-xs rounded-full px-2.5 py-1 bg-green-100 text-green-700 font-semibold">
              {t("ops.entry.verified")}
            </span>
          ) : (
            <span className="text-xs rounded-full px-2.5 py-1 bg-amber-100 text-amber-800 font-semibold">
              {t("ops.entry.notVerified")}
            </span>
          )}
          {member.validExpired && member.validTill && (
            <span className="text-xs rounded-full px-2.5 py-1 bg-red-100 text-red-700 font-semibold">
              {t("ops.entry.expired", { date: member.validTill })}
            </span>
          )}
          {!member.validExpired && member.validTill && (() => {
            const target = new Date(member.validTill + "T00:00:00").getTime();
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const days = Math.ceil((target - now.getTime()) / 86400000);
            if (days < 0 || days > 7) return null;
            return (
              <span className="text-xs rounded-full px-2.5 py-1 bg-amber-100 text-amber-800 font-semibold">
                {t("ops.entry.expiresSoon", { days })}
              </span>
            );
          })()}
          {alreadyInside && (
            <span className="text-xs rounded-full px-2.5 py-1 bg-blue-100 text-blue-800 font-semibold">
              {t("ops.entry.alreadyInside")}
            </span>
          )}
        </div>

        {blockedReason && !alreadyInside && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 space-y-1">
            <p className="font-semibold">{t(blockedReason.key, blockedReason.params)}</p>
            {blockedReason.fixable && (
              <Link
                href={`${membersHrefBase ?? `/${clubSlug}/staff/members`}?q=${member.memberCode}`}
                className="inline-block text-xs text-red-800 underline hover:text-red-900"
              >
                {t("ops.entry.fixInMembers")}
              </Link>
            )}
          </div>
        )}

        {alreadyInside ? (
          <button
            type="button"
            onClick={onCheckout}
            disabled={isPending}
            className="w-full rounded-lg bg-blue-600 text-white text-sm font-semibold py-3 hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "…" : t("ops.entry.checkOut")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdmit}
            disabled={isPending || blocked}
            className={`w-full rounded-lg text-white text-sm font-semibold py-3 disabled:opacity-50 ${
              blocked ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isPending ? "…" : blocked ? t("ops.entry.blocked") : t("ops.entry.admit")}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="w-full rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          {t("ops.entry.cancel")}
        </button>
      </div>
    </div>
  );
}
