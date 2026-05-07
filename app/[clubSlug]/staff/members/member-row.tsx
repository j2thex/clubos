"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
  verifyChip,
  age,
}: {
  member: MemberInfo;
  roles: Role[];
  clubSlug: string;
  verifyChip?: React.ReactNode;
  age?: number | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [manualDate, setManualDate] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [editingRole, setEditingRole] = useState(false);

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRoleId = e.target.value || null;
    startTransition(async () => {
      await updateMemberRole(member.id, newRoleId, clubSlug);
      setEditingRole(false);
    });
  }

  // Pre-compute valid-till state once for the chip + the inline editor
  let validTillChip: {
    label: string;
    classes: string;
  } | null = null;
  if (member.validTill) {
    const validDate = new Date(member.validTill + "T00:00:00");
    const now = new Date();
    const daysLeft = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft < 0;
    const isExpiringSoon = daysLeft >= 0 && daysLeft <= 30;
    const formatted = validDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    validTillChip = {
      label: isExpired ? `Membership expired ${formatted}` : `Paid until ${formatted}`,
      classes: isExpired
        ? "bg-red-50 text-red-600 hover:bg-red-100"
        : isExpiringSoon
          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "bg-green-50 text-green-700 hover:bg-green-100",
    };
  }

  const showRoleChip = !!member.roleName && !editingRole;

  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <MemberAvatar
        photoSignedUrl={member.photoSignedUrl}
        idPhotoSignedUrl={member.idPhotoSignedUrl}
        firstName={member.firstName}
        lastName={member.lastName}
        fullName={member.fullName}
        memberCode={member.memberCode}
      />
      <div className="flex-1 min-w-0">
        {/* Line 1: code + role chip + valid-till chip */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-mono font-semibold text-gray-900 text-sm tracking-wide">
            {member.memberCode}
          </p>
          {showRoleChip && (
            <button
              type="button"
              onClick={() => setEditingRole(true)}
              className="text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 px-2 py-0.5 rounded-full transition-colors"
              title="Change role"
            >
              {member.roleName}
            </button>
          )}
          {validTillChip && !editingDate && (
            <button
              type="button"
              onClick={() => setEditingDate(true)}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors ${validTillChip.classes}`}
              title="Edit expiration"
            >
              {validTillChip.label}
            </button>
          )}
          {verifyChip}
        </div>

        {/* Line 2: name · spins · age (single muted line) */}
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {member.fullName ? <>{member.fullName} <span className="text-gray-300">·</span> </> : null}
          {member.spinBalance} {member.spinBalance === 1 ? "spin" : "spins"}
          {typeof age === "number" ? <> <span className="text-gray-300">·</span> age {age}</> : null}
        </p>

        {/* Inline date editor (existing flow, just relocated below the meta lines) */}
        {member.validTill && editingDate && (
          <div className="mt-2 space-y-2">
            <input
              type="date"
              defaultValue={member.validTill}
              onChange={(e) => setManualDate(e.target.value)}
              disabled={isPending}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white transition disabled:opacity-50"
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

        {/* Set-validity form when no valid_till is set yet */}
        {!member.validTill && (
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

      <RoleEditor
        roles={roles}
        roleId={member.roleId}
        editing={editingRole}
        onStartEdit={() => setEditingRole(true)}
        onCancel={() => setEditingRole(false)}
        onChange={handleRoleChange}
        isPending={isPending}
      />
    </div>
  );
}

function RoleEditor({
  roles,
  roleId,
  editing,
  onStartEdit,
  onCancel,
  onChange,
  isPending,
}: {
  roles: Role[];
  roleId: string | null;
  editing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isPending: boolean;
}) {
  // No UI when the club hasn't defined any roles
  if (roles.length === 0) return null;

  // Role set + not editing: chip on line 1 owns the display, nothing on the right
  if (roleId !== null && !editing) return null;

  // Editing OR no role yet: show the select
  if (editing) {
    return (
      <select
        value={roleId ?? ""}
        onChange={onChange}
        onBlur={onCancel}
        autoFocus
        disabled={isPending}
        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 bg-white transition disabled:opacity-50 shrink-0"
      >
        <option value="">No role</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    );
  }

  // No role + not editing: discreet ghost button to open the editor
  return (
    <button
      type="button"
      onClick={onStartEdit}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full px-2.5 py-1.5 transition-colors shrink-0"
      title="Assign role"
    >
      <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
      Role
    </button>
  );
}
