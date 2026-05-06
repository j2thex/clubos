"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";
import { StaffMemberRow } from "../../members/member-row";
import { TopupDialog } from "../operations/sell/topup-dialog";
import {
  markIdVerified,
  revokeIdVerification,
  staffUpdateMemberIdentity,
  staffReplaceMemberIdPhoto,
  staffReplaceMemberPhoto,
  staffReplaceMemberSignature,
  staffRebindMemberRfid,
} from "../../members/actions";
import {
  MemberDetail,
  type MemberDetailRecord,
  type MemberDetailActions,
} from "@/components/club/member-detail";

const staffMemberDetailActions: MemberDetailActions = {
  updateIdentity: staffUpdateMemberIdentity,
  replaceIdPhoto: staffReplaceMemberIdPhoto,
  replacePortrait: staffReplaceMemberPhoto,
  replaceSignature: staffReplaceMemberSignature,
  rebindRfid: staffRebindMemberRfid,
  markVerified: markIdVerified,
  revokeVerification: revokeIdVerification,
};

export type MembersSearchMember = {
  id: string;
  memberCode: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  spinBalance: number;
  roleId: string | null;
  roleName: string | null;
  validTill: string | null;
  dateOfBirth: string | null;
  idVerifiedAt: string | null;
  idPhotoSignedUrl: string | null;
  photoSignedUrl: string | null;
  createdAt: string | null;
};

type GroupKey =
  | "pendingActivation"
  | "newThisWeek"
  | "verified"
  | "active"
  | "expired";

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
  age,
}: {
  memberId: string;
  clubSlug: string;
  dateOfBirth: string | null;
  idVerifiedAt: string | null;
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
            age !== null && age < 18
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
            className="text-xs rounded-full px-3 py-0.5 bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "..." : t("staff.members.activate")}
          </button>
        </>
      )}
    </div>
  );
}

function OpsActionsRow({
  clubId,
  clubSlug,
  memberId,
  memberCode,
  deepLinks,
}: {
  clubId: string;
  clubSlug: string;
  memberId: string;
  memberCode: string;
  deepLinks: { entry: boolean; sell: boolean; topup: boolean };
}) {
  const { t } = useLanguage();
  const [topupOpen, setTopupOpen] = useState(false);
  return (
    <div className="px-5 pb-3 -mt-1 flex items-center gap-2 flex-wrap">
      {deepLinks.entry && (
        <Link
          href={`/${clubSlug}/staff/operations/entry?memberCode=${memberCode}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-800 text-white text-xs font-semibold px-3 py-2 hover:bg-gray-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4m8-12v16" />
          </svg>
          {t("ops.deepLink.openAtDoor")}
        </Link>
      )}
      {deepLinks.sell && (
        <Link
          href={`/${clubSlug}/staff/operations/sell?memberCode=${memberCode}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-800 text-white text-xs font-semibold px-3 py-2 hover:bg-gray-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {t("ops.deepLink.sellToMember")}
        </Link>
      )}
      {deepLinks.topup && (
        <button
          type="button"
          onClick={() => setTopupOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-2 hover:bg-blue-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t("ops.topup.button")}
        </button>
      )}
      <TopupDialog
        open={topupOpen}
        clubId={clubId}
        clubSlug={clubSlug}
        memberId={memberId}
        memberCode={memberCode}
        onClose={() => setTopupOpen(false)}
        onSuccess={() => setTopupOpen(false)}
      />
    </div>
  );
}

export function MembersSearch({
  clubId,
  members,
  memberDetails = [],
  roles,
  clubSlug,
  opsEnabled,
  initialQuery = "",
  initialOpenCode = null,
  deepLinks,
}: {
  clubId: string;
  members: MembersSearchMember[];
  memberDetails?: MemberDetailRecord[];
  roles: { id: string; name: string }[];
  clubSlug: string;
  opsEnabled: boolean;
  initialQuery?: string;
  initialOpenCode?: string | null;
  deepLinks?: { entry: boolean; sell: boolean; topup: boolean };
}) {
  const [query, setQuery] = useState(initialQuery);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const didApplyDeepLink = useRef(false);

  useEffect(() => {
    if (didApplyDeepLink.current) return;
    if (!initialOpenCode) return;
    const code = initialOpenCode.toUpperCase();
    const match = members.find((m) => m.memberCode.toUpperCase() === code);
    if (!match) return;
    didApplyDeepLink.current = true;
    setExpandedId(match.id);
    requestAnimationFrame(() => {
      rowRefs.current.get(match.id)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [initialOpenCode, members]);

  const initialOpenGroups = useMemo<Set<GroupKey>>(
    () =>
      new Set<GroupKey>(
        opsEnabled ? ["pendingActivation"] : ["newThisWeek"],
      ),
    [opsEnabled],
  );
  const [openGroups, setOpenGroups] = useState<Set<GroupKey>>(initialOpenGroups);
  const { t: tRoot } = useLanguage();
  const memberDetailById = useMemo(
    () => new Map(memberDetails.map((d) => [d.id, d])),
    [memberDetails],
  );

  const searching = query.trim().length > 0;

  const searchFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const haystack = `${m.memberCode} ${m.fullName ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [members, query]);

  const groups = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const isExpired = (m: MembersSearchMember) => {
      if (!m.validTill) return false;
      const v = new Date(m.validTill + "T00:00:00");
      return v < now;
    };
    const isNew = (m: MembersSearchMember) =>
      !!m.createdAt && new Date(m.createdAt) >= sevenDaysAgo;

    if (opsEnabled) {
      const pendingActivation: MembersSearchMember[] = [];
      const newThisWeek: MembersSearchMember[] = [];
      const verified: MembersSearchMember[] = [];
      const expired: MembersSearchMember[] = [];
      for (const m of members) {
        if (isExpired(m)) {
          expired.push(m);
          continue;
        }
        if (!m.idVerifiedAt) {
          pendingActivation.push(m);
          continue;
        }
        if (isNew(m)) {
          newThisWeek.push(m);
          continue;
        }
        verified.push(m);
      }
      return [
        { key: "pendingActivation" as GroupKey, label: tRoot("staff.members.groupPendingActivation"), rows: pendingActivation },
        { key: "newThisWeek" as GroupKey, label: tRoot("staff.members.groupNewThisWeek"), rows: newThisWeek },
        { key: "verified" as GroupKey, label: tRoot("staff.members.groupVerified"), rows: verified },
        { key: "expired" as GroupKey, label: tRoot("staff.members.groupExpired"), rows: expired },
      ];
    }

    const newThisWeek: MembersSearchMember[] = [];
    const active: MembersSearchMember[] = [];
    const expired: MembersSearchMember[] = [];
    for (const m of members) {
      if (isExpired(m)) {
        expired.push(m);
        continue;
      }
      if (isNew(m)) {
        newThisWeek.push(m);
        continue;
      }
      active.push(m);
    }
    return [
      { key: "newThisWeek" as GroupKey, label: tRoot("staff.members.groupNewThisWeek"), rows: newThisWeek },
      { key: "active" as GroupKey, label: tRoot("staff.members.groupActive"), rows: active },
      { key: "expired" as GroupKey, label: tRoot("staff.members.groupExpired"), rows: expired },
    ];
  }, [members, opsEnabled, tRoot]);

  function toggleGroup(key: GroupKey) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const renderMember = (m: MembersSearchMember) => {
    const age = computeAge(m.dateOfBirth);
    const detail = memberDetailById.get(m.id);
    const isExpanded = expandedId === m.id;
    return (
      <div
        key={m.id}
        ref={(el) => {
          if (el) rowRefs.current.set(m.id, el);
          else rowRefs.current.delete(m.id);
        }}
      >
        <div className="flex items-stretch">
          <div className="flex-1 min-w-0">
            <StaffMemberRow
              member={{
                id: m.id,
                memberCode: m.memberCode,
                fullName: m.fullName,
                firstName: m.firstName,
                lastName: m.lastName,
                spinBalance: m.spinBalance,
                roleId: m.roleId,
                roleName: m.roleName,
                validTill: m.validTill,
                photoSignedUrl: m.photoSignedUrl,
                idPhotoSignedUrl: m.idPhotoSignedUrl,
              }}
              roles={roles}
              clubSlug={clubSlug}
            />
          </div>
          {detail && (
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : m.id)}
              aria-label={
                isExpanded
                  ? tRoot("admin.memberDetail.collapse")
                  : tRoot("admin.memberDetail.expand")
              }
              title={
                isExpanded
                  ? tRoot("admin.memberDetail.collapse")
                  : tRoot("admin.memberDetail.expand")
              }
              className="self-center mr-3 ml-2 w-10 h-10 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-200 hover:text-gray-900 flex items-center justify-center transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                strokeWidth={2.5}
              />
            </button>
          )}
        </div>
        {opsEnabled && !isExpanded && (
          <VerifyRow
            memberId={m.id}
            clubSlug={clubSlug}
            dateOfBirth={m.dateOfBirth}
            idVerifiedAt={m.idVerifiedAt}
            age={age}
          />
        )}
        {deepLinks && (deepLinks.entry || deepLinks.sell || deepLinks.topup) && (
          <OpsActionsRow
            clubId={clubId}
            clubSlug={clubSlug}
            memberId={m.id}
            memberCode={m.memberCode}
            deepLinks={deepLinks}
          />
        )}
        {detail && isExpanded && (
          <MemberDetail
            member={detail}
            clubId={clubId}
            clubSlug={clubSlug}
            actions={staffMemberDetailActions}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-4 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or code"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          />
        </div>
      </div>

      {searching ? (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {searchFiltered.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {searchFiltered.map(renderMember)}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">No members match.</div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const isOpen = openGroups.has(g.key);
            const countClass =
              g.key === "pendingActivation" && g.rows.length > 0
                ? "bg-amber-100 text-amber-800"
                : "bg-gray-100 text-gray-600";
            return (
              <div
                key={g.key}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(g.key)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-800 flex-1 text-left">
                    {g.label}
                  </span>
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${countClass}`}>
                    {g.rows.length}
                  </span>
                </button>
                {isOpen && (
                  g.rows.length > 0 ? (
                    <div className="divide-y divide-gray-100 border-t border-gray-100">
                      {g.rows.map(renderMember)}
                    </div>
                  ) : (
                    <div className="px-5 pb-4 pt-2 text-xs text-gray-400 text-center">—</div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
