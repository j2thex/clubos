"use client";

import { useState } from "react";

interface ReferrerSummary {
  code: string;
  name: string | null;
  referrals: { code: string; name: string | null; date: string }[];
}

export function ReferralTree({ referrers }: { referrers: ReferrerSummary[] }) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  if (referrers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-gray-400 text-sm">No referrals yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
      {referrers.map((referrer, index) => {
        const isExpanded = expandedCode === referrer.code;

        return (
          <div key={referrer.code}>
            <button
              onClick={() => setExpandedCode(isExpanded ? null : referrer.code)}
              className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-sm font-medium text-gray-400 w-6">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-gray-900 text-sm">{referrer.code}</p>
                {referrer.name && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{referrer.name}</p>
                )}
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                {referrer.referrals.length} {referrer.referrals.length === 1 ? "referral" : "referrals"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="bg-gray-50 px-5 pb-3 pt-1">
                <div className="space-y-2 ml-9">
                  {referrer.referrals.map((ref) => (
                    <div key={ref.code + ref.date} className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-semibold text-gray-700">{ref.code}</span>
                        {ref.name && (
                          <span className="text-xs text-gray-400 ml-2">{ref.name}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(ref.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
