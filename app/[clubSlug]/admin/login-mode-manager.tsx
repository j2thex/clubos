"use client";

import { useTransition } from "react";
import { updateLoginMode } from "./actions";

export function LoginModeManager({
  loginMode,
  clubId,
  clubSlug,
}: {
  loginMode: string;
  clubId: string;
  clubSlug: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(mode: string) {
    startTransition(async () => {
      await updateLoginMode(clubId, mode, clubSlug);
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
      </div>
    </div>
  );
}
