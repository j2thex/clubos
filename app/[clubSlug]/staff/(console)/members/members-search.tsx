"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { StaffMemberRow } from "../../members/member-row";
import { markIdVerified, revokeIdVerification } from "../../members/actions";

export type MembersSearchMember = {
  id: string;
  memberCode: string;
  fullName: string | null;
  spinBalance: number;
  roleId: string | null;
  roleName: string | null;
  validTill: string | null;
  dateOfBirth: string | null;
  idVerifiedAt: string | null;
  idPhotoSignedUrl: string | null;
};

type Filter = "all" | "verified" | "unverified" | "expired";

function computeAge(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function VerifyRow({
  memberId,
  clubSlug,
  dateOfBirth,
  idVerifiedAt,
  idPhotoSignedUrl,
  age,
}: {
  memberId: string;
  clubSlug: string;
  dateOfBirth: string | null;
  idVerifiedAt: string | null;
  idPhotoSignedUrl: string | null;
  age: number | null;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function handleVerify() {
    startTransition(async () => {
      const r = await markIdVerified(memberId, clubSlug);
      if ("error" in r) toast.error(r.error);
      else toast.success("Marked verified");
    });
  }

  function handleRevoke() {
    if (!window.confirm("Revoke ID verification for this member?")) return;
    startTransition(async () => {
      const r = await revokeIdVerification(memberId, clubSlug);
      if ("error" in r) toast.error(r.error);
      else toast.success("Verification revoked");
    });
  }

  return (
    <div className="px-5 pb-3 -mt-2 flex items-center gap-2 flex-wrap">
      {dateOfBirth && (
        <span
          className={`text-xs rounded-full px-2 py-0.5 ${
            age !== null && age < 21
              ? "bg-red-100 text-red-700 font-semibold"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {age !== null ? t("ops.entry.age", { age }) : t("ops.memberForm.dobLabel")}
        </span>
      )}
      {idVerifiedAt ? (
        <>
          <span className="text-xs rounded-full px-2 py-0.5 bg-green-100 text-green-700 font-semibold">
            {t("ops.entry.verified")}
          </span>
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isPending}
            className="text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
          >
            {t("ops.entry.cancel")}
          </button>
        </>
      ) : (
        <>
          <span className="text-xs rounded-full px-2 py-0.5 bg-amber-100 text-amber-800">
            {t("ops.entry.notVerified")}
          </span>
          <button
            type="button"
            onClick={handleVerify}
            disabled={isPending || !dateOfBirth}
            title={!dateOfBirth ? t("ops.memberForm.dobRequired") : ""}
            className="text-xs rounded-full px-2 py-0.5 bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isPending ? "..." : t("ops.entry.verified")}
          </button>
        </>
      )}
      {idPhotoSignedUrl && (
        <a
          href={idPhotoSignedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs rounded-full px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          {t("ops.memberForm.photoLabel")}
        </a>
      )}
    </div>
  );
}

export function MembersSearch({
  members,
  roles,
  clubSlug,
  opsEnabled,
  initialQuery = "",
}: {
  members: MembersSearchMember[];
  roles: { id: string; name: string }[];
  clubSlug: string;
  opsEnabled: boolean;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    return members.filter((m) => {
      if (q) {
        const haystack = `${m.memberCode} ${m.fullName ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filter === "verified" && !m.idVerifiedAt) return false;
      if (filter === "unverified" && m.idVerifiedAt) return false;
      if (filter === "expired") {
        if (!m.validTill) return false;
        const v = new Date(m.validTill + "T00:00:00");
        if (v >= now) return false;
      }
      return true;
    });
  }, [members, query, filter]);

  const chips: { id: Filter; label: string }[] = opsEnabled
    ? [
        { id: "all", label: `All (${members.length})` },
        { id: "verified", label: `Verified (${members.filter((m) => m.idVerifiedAt).length})` },
        { id: "unverified", label: `Unverified (${members.filter((m) => !m.idVerifiedAt).length})` },
        { id: "expired", label: "Expired" },
      ]
    : [
        { id: "all", label: `All (${members.length})` },
        { id: "expired", label: "Expired" },
      ];

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 space-y-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or code"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          />
          <div className="flex gap-2 flex-wrap">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`text-xs font-semibold rounded-full px-3 py-1 transition ${
                  filter === c.id
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filtered.map((m) => {
              const age = computeAge(m.dateOfBirth);
              return (
                <div key={m.id}>
                  <StaffMemberRow
                    member={{
                      id: m.id,
                      memberCode: m.memberCode,
                      fullName: m.fullName,
                      spinBalance: m.spinBalance,
                      roleId: m.roleId,
                      roleName: m.roleName,
                      validTill: m.validTill,
                    }}
                    roles={roles}
                    clubSlug={clubSlug}
                  />
                  {opsEnabled && (
                    <VerifyRow
                      memberId={m.id}
                      clubSlug={clubSlug}
                      dateOfBirth={m.dateOfBirth}
                      idVerifiedAt={m.idVerifiedAt}
                      idPhotoSignedUrl={m.idPhotoSignedUrl}
                      age={age}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">No members match.</div>
        )}
      </div>
    </div>
  );
}
