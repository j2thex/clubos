"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  lookupMemberForEntry,
  admitMember,
  checkoutEntry,
  type LookedUpMember,
} from "./actions";

// Camera scanner is client-only and heavy — lazy-load it.
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false, loading: () => <ScannerPlaceholder /> },
);

function ScannerPlaceholder() {
  return (
    <div className="aspect-square w-full rounded-2xl bg-gray-900 flex items-center justify-center">
      <span className="text-xs text-gray-400">Loading camera…</span>
    </div>
  );
}

type Mode = "idle" | "scanning" | "manual";

export function EntryClient({
  clubId,
  clubSlug,
}: {
  clubId: string;
  clubSlug: string;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [manualCode, setManualCode] = useState("");
  const [found, setFound] = useState<LookedUpMember | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  function handleAdmit() {
    if (!found) return;
    startTransition(async () => {
      const res = await admitMember(clubId, clubSlug, found.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`${found.memberCode} admitted`);
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
      toast.success(`${found.memberCode} checked out`);
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
              Cancel
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
              Member code
            </label>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="ABC12"
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
                {isPending ? "Looking up…" : "Find member"}
              </button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
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
              Scan QR code
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setMode("manual");
              }}
              className="w-full rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 py-3 hover:bg-gray-50"
            >
              Enter code manually
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
          isPending={isPending}
          onAdmit={handleAdmit}
          onCheckout={handleCheckout}
          onClose={reset}
        />
      )}
    </div>
  );
}

function EntryDialog({
  member,
  isPending,
  onAdmit,
  onCheckout,
  onClose,
}: {
  member: LookedUpMember;
  isPending: boolean;
  onAdmit: () => void;
  onCheckout: () => void;
  onClose: () => void;
}) {
  const alreadyInside = !!member.openEntryId;
  const under21 = member.age !== null && member.age < 21;
  const blocked = member.validExpired || under21 || member.age === null;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {member.idPhotoSignedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.idPhotoSignedUrl}
          alt="Stored ID photo"
          className="w-full max-h-72 object-cover bg-gray-100"
        />
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
          No ID photo on file
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
              Age {member.age}
            </span>
          )}
          {member.age === null && (
            <span className="text-xs rounded-full px-2.5 py-1 bg-red-100 text-red-700 font-semibold">
              No DOB
            </span>
          )}
          {member.idVerifiedAt ? (
            <span className="text-xs rounded-full px-2.5 py-1 bg-green-100 text-green-700 font-semibold">
              ID Verified
            </span>
          ) : (
            <span className="text-xs rounded-full px-2.5 py-1 bg-amber-100 text-amber-800 font-semibold">
              Not verified
            </span>
          )}
          {member.validExpired && (
            <span className="text-xs rounded-full px-2.5 py-1 bg-red-100 text-red-700 font-semibold">
              Expired {member.validTill}
            </span>
          )}
          {alreadyInside && (
            <span className="text-xs rounded-full px-2.5 py-1 bg-blue-100 text-blue-800 font-semibold">
              Already inside
            </span>
          )}
        </div>

        {alreadyInside ? (
          <button
            type="button"
            onClick={onCheckout}
            disabled={isPending}
            className="w-full rounded-lg bg-blue-600 text-white text-sm font-semibold py-3 hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "…" : "Check out"}
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
            {isPending ? "…" : blocked ? "Blocked" : "Admit"}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="w-full rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
