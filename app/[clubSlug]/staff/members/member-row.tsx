"use client";

import { useTransition } from "react";
import { updateMemberRole } from "./actions";

interface MemberInfo {
  id: string;
  memberCode: string;
  fullName: string | null;
  spinBalance: number;
  roleId: string | null;
  roleName: string | null;
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
