"use client";

import { useTransition } from "react";
import { updateLoginMode, updateInviteOnly } from "./actions";

export function LoginModeManager({
  loginMode,
  inviteOnly,
  clubId,
  clubSlug,
}: {
  loginMode: string;
  inviteOnly: boolean;
  clubId: string;
  clubSlug: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(mode: string) {
    startTransition(async () => {
      await updateLoginMode(clubId, mode, clubSlug);
    });
  }

  function handleInviteToggle(checked: boolean) {
    startTransition(async () => {
      await updateInviteOnly(clubId, checked, clubSlug);
    });
  }

  const options = [
    {
      value: "code_only",
      label: "Member code only",
      description: "Members log in with just their unique code",
    },
    {
      value: "code_and_expiry",
      label: "Code + expiry date",
      description: "Members also enter their 4-digit expiry date (MMDD) for extra security",
    },
  ];

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        Member Login
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              type="radio"
              name="loginMode"
              value={opt.value}
              checked={loginMode === opt.value}
              onChange={() => handleChange(opt.value)}
              className="mt-0.5 rounded-full border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
            </div>
          </label>
        ))}
        <label
          className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            type="checkbox"
            checked={inviteOnly}
            onChange={(e) => handleInviteToggle(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Invite only</p>
            <p className="text-xs text-gray-400 mt-0.5">Public page shows &ldquo;Request an Invite&rdquo; form instead of member login</p>
          </div>
        </label>
      </div>
    </div>
  );
}
