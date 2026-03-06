"use client";

import { useState, useTransition } from "react";
import { updateRole } from "./actions";

interface Role {
  id: string;
  name: string;
}

export function RoleSelector({
  roles,
  currentRoleId,
}: {
  roles: Role[];
  currentRoleId: string | null;
}) {
  const [selectedId, setSelectedId] = useState(currentRoleId ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRoleId = e.target.value;
    setSelectedId(newRoleId);
    setSaved(false);

    startTransition(async () => {
      const result = await updateRole(newRoleId || null);
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={selectedId}
        onChange={handleChange}
        disabled={isPending}
        className="club-ring flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white transition disabled:opacity-50"
      >
        <option value="">No role selected</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="text-xs text-gray-400">Saving...</span>
      )}
      {saved && !isPending && (
        <span className="text-xs club-primary">Saved</span>
      )}
    </div>
  );
}
