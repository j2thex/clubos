"use client";

import { useState, useTransition } from "react";
import { addRole, deleteRole } from "./actions";

interface Role {
  id: string;
  name: string;
  display_order: number;
}

export function RoleManager({
  roles,
  clubId,
  clubSlug,
}: {
  roles: Role[];
  clubId: string;
  clubSlug: string;
}) {
  const [newRoleName, setNewRoleName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!newRoleName.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await addRole(clubId, newRoleName, clubSlug);
      if (result.error) {
        setError(result.error);
      } else {
        setNewRoleName("");
      }
    });
  }

  function handleDelete(roleId: string) {
    startTransition(async () => {
      await deleteRole(roleId, clubSlug);
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        Roles
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Existing roles */}
        {roles.length > 0 && (
          <div className="divide-y divide-gray-100">
            {roles.map((role) => (
              <div key={role.id} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{role.name}</span>
                <button
                  onClick={() => handleDelete(role.id)}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new role */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="New role name..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !newRoleName.trim()}
            className="rounded-lg bg-gray-800 text-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
