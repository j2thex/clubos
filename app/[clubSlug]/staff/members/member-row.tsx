"use client";

import { useState, useTransition } from "react";
import { MemberAvatar } from "@/components/club/member-avatar";
import { updateMemberRole, setManualValidTill } from "./actions";

interface MemberInfo {
  id: string;
  memberCode: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  spinBalance: number;
  roleId: string | null;
  roleName: string | null;
  validTill: string | null;
  photoSignedUrl: string | null;
  idPhotoSignedUrl: string | null;
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
  const [manualDate, setManualDate] = useState("");
  const [editingDate, setEditingDate] = useState(false);

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRoleId = e.target.value || null;
    startTransition(async () => {
      await updateMemberRole(member.id, newRoleId, clubSlug);
    });
  }

  return (
    <div className="px-5 py-4 flex items-center gap-3">
      <MemberAvatar
        photoSignedUrl={member.photoSignedUrl}
        idPhotoSignedUrl={member.idPhotoSignedUrl}
        firstName={member.firstName}
        lastName={member.lastName}
        fullName={member.fullName}
        memberCode={member.memberCode}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-mono font-semibold text-gray-900 text-sm tracking-wide">
            {member.memberCode}
          </p>
          {member.roleName && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {member.roleName}
            </span>
          )}
        </div>
        {member.fullName && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{member.fullName}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {member.spinBalance} {member.spinBalance === 1 ? "spin" : "spins"}
        </p>
        {member.validTill ? (() => {
          const validDate = new Date(member.validTill + "T00:00:00");
          const now = new Date();
          const daysLeft = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = daysLeft < 0;
          const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;
          const formatted = validDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

          return (
            <>
              <button
                onClick={() => setEditingDate(!editingDate)}
                className={`text-xs mt-0.5 ${isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-green-600"}`}
              >
                {isExpired ? `Expired ${formatted}` : `Valid till ${formatted}`}
              </button>
              {editingDate && (
                <div className="mt-2 space-y-2">
                  <input
                    type="date"
                    defaultValue={member.validTill}
                    onChange={(e) => setManualDate(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white transition disabled:opacity-50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!manualDate) return;
                        startTransition(async () => {
                          await setManualValidTill(member.id, manualDate, clubSlug);
                          setManualDate("");
                          setEditingDate(false);
                        });
                      }}
                      disabled={isPending || !manualDate}
                      className="flex-1 rounded-lg bg-blue-600 text-white text-xs font-semibold py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isPending ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => { setEditingDate(false); setManualDate(""); }}
                      className="flex-1 rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 py-2 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })() : (
          <div className="mt-2 space-y-2">
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              disabled={isPending}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white transition disabled:opacity-50"
            />
            {manualDate && (
              <button
                onClick={() => {
                  startTransition(async () => {
                    await setManualValidTill(member.id, manualDate, clubSlug);
                    setManualDate("");
                  });
                }}
                disabled={isPending}
                className="w-full rounded-lg bg-blue-600 text-white text-xs font-semibold py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Setting..." : "Set Expiration"}
              </button>
            )}
          </div>
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
