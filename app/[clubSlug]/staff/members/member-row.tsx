"use client";

import { useTransition } from "react";
import { updateMemberRole, prolongateMembership } from "./actions";

interface MemberInfo {
  id: string;
  memberCode: string;
  fullName: string | null;
  spinBalance: number;
  roleId: string | null;
  roleName: string | null;
  validTill: string | null;
  periodDurationMonths: number | null;
}

interface Role {
  id: string;
  name: string;
}

export function StaffMemberRow({
  member,
  roles,
  clubSlug,
}: {
  member: MemberInfo;
  roles: Role[];
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
