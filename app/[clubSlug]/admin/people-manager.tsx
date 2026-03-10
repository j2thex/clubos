"use client";

import { useState, useTransition } from "react";
import { createMember, createStaffMember, toggleMemberStatus } from "./actions";

interface Member {
  id: string;
  member_code: string;
  full_name: string | null;
  spin_balance: number;
  is_staff: boolean;
  status: string;
  roleName: string | null;
}

export function PeopleManager({
  clubId,
  clubSlug,
  members,
  staff,
}: {
  clubId: string;
  clubSlug: string;
  members: Member[];
  staff: Member[];
}) {
  const [tab, setTab] = useState<"members" | "staff">("members");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = tab === "staff"
        ? await createStaffMember(clubId, code, pin, clubSlug)
        : await createMember(clubId, code, clubSlug);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`${tab === "staff" ? "Staff" : "Member"} ${code.toUpperCase()} created`);
        setCode("");
        setPin("");
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  const list = tab === "members" ? members : staff;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        People
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Tab toggle */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setTab("members"); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              tab === "members"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Members ({members.length})
          </button>
          <button
            onClick={() => { setTab("staff"); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              tab === "staff"
                ? "text-gray-900 border-b-2 border-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Staff ({staff.length})
          </button>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="px-5 py-4 border-b border-gray-100">
          <div className={`flex gap-3 items-end ${tab === "staff" ? "" : ""}`}>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {tab === "staff" ? "Staff Code" : "Member Code"}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC12"
                maxLength={6}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
              />
            </div>

            {tab === "staff" && (
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-widest text-center text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !code.trim() || (tab === "staff" && !pin.trim())}
              className="rounded-lg bg-gray-800 text-white px-5 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {isPending ? "..." : "Add"}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}
          {success && (
            <p className="mt-2 text-xs text-green-700">{success}</p>
          )}
        </form>

        {/* List */}
        {list.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {list.map((person) => (
              <div key={person.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-gray-900 text-sm tracking-wide">
                      {person.member_code}
                    </span>
                    {person.roleName && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {person.roleName}
                      </span>
                    )}
                  </div>
                  {person.full_name && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{person.full_name}</p>
                  )}
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  {tab === "members" && (
                    <p className="text-sm font-semibold text-gray-900">
                      {person.spin_balance} <span className="text-xs font-normal text-gray-400">spins</span>
                    </p>
                  )}
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        await toggleMemberStatus(person.id, clubSlug);
                      });
                    }}
                    disabled={isPending}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
                      person.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                        : "bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-700"
                    }`}
                  >
                    {person.status === "active" ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            No {tab} yet
          </div>
        )}
      </div>
    </div>
  );
}
