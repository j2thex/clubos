"use client";

import { useTransition } from "react";
import { updateMemberRole, prolongateMembership, assignMembershipPeriod } from "./actions";

interface MemberInfo {
  id: string;
  memberCode: string;
  fullName: string | null;
  spinBalance: number;
  roleId: string | null;
  roleName: string | null;
  validTill: string | null;
  membershipPeriodId: string | null;
  periodDurationMonths: number | null;
}

interface Role {
  id: string;
  name: string;
}

interface Period {
  id: string;
  name: string;
  duration_months: number;
}

export function StaffMemberRow({
  member,
  roles,
  periods,
  clubSlug,
}: {
  member: MemberInfo;
  roles: Role[];
  periods: Period[];
  clubSlug: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRoleId = e.target.value || null;
    startTransition(async () => {
      await updateMemberRole(member.id, newRoleId, clubSlug);
    });
  }

  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-mono font-semibold text-gray-900 text-sm tracking-wide">
          {member.memberCode}
        </p>
        {member.fullName && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{member.fullName}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {member.spinBalance} {member.spinBalance === 1 ? "spin" : "spins"}
        </p>
        {member.validTill && (() => {
          const validDate = new Date(member.validTill + "T00:00:00");
          const now = new Date();
          const daysLeft = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = daysLeft < 0;
          const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;
          const formatted = validDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

          return (
            <div className="flex items-center gap-2 mt-0.5">
              <p className={`text-xs ${isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-green-600"}`}>
                {isExpired ? `Expired ${formatted}` : `Valid till ${formatted}`}
              </p>
              {member.periodDurationMonths && (
                <button
                  onClick={() => {
                    startTransition(async () => {
                      await prolongateMembership(member.id, clubSlug);
                    });
                  }}
                  disabled={isPending}
                  className="text-[10px] font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                >
                  +{member.periodDurationMonths}mo
                </button>
              )}
            </div>
          );
        })()}
        {!member.validTill && periods.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const pid = e.target.value || null;
              startTransition(async () => {
                await assignMembershipPeriod(member.id, pid, clubSlug);
              });
            }}
            disabled={isPending}
            className="mt-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-500 bg-white transition disabled:opacity-50"
          >
            <option value="">Assign period...</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.duration_months}mo)
              </option>
            ))}
          </select>
        )}
      </div>

      <select
        value={member.roleId ?? ""}
        onChange={handleRoleChange}
        disabled={isPending}
        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 bg-white transition disabled:opacity-50"
      >
        <option value="">No role</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    </div>
  );
}
