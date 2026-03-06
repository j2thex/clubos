"use client";

import { useState, useTransition } from "react";
import SpinWheel from "@/components/club/spin-wheel";
import { lookupMember, performSpinForMember } from "./actions";

interface Segment {
  label: string;
  color: string;
  labelColor?: string;
  probability: number;
}

export function StaffSpinClient({
  clubId,
  segments,
}: {
  clubId: string;
  segments: Segment[];
}) {
  const [memberCode, setMemberCode] = useState("");
  const [isLooking, startLookup] = useTransition();
  const [memberBalance, setMemberBalance] = useState<number>(0);
  const [activeMemberCode, setActiveMemberCode] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const code = memberCode.trim().toUpperCase();
    if (!code) return;

    setLookupError(null);
    startLookup(async () => {
      const res = await lookupMember(code, clubId);
      if ("error" in res) {
        setLookupError(res.error);
        setActiveMemberCode(null);
        setMemberBalance(0);
      } else {
        setActiveMemberCode(res.memberCode);
        setMemberBalance(res.balance);
        setMemberCode("");
        setLookupError(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Member code input — always visible */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <form onSubmit={handleLookup} className="px-5 py-4 flex gap-3 items-end">
          <div className="flex-1">
            <label htmlFor="memberCode" className="block text-xs font-medium text-gray-500 mb-1">
              Member Code
            </label>
            <input
              id="memberCode"
              type="text"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
              placeholder="ABC12"
              maxLength={6}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition text-center"
            />
          </div>
          <button
            type="submit"
            disabled={isLooking || !memberCode.trim()}
            className="rounded-lg bg-gray-800 text-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isLooking ? "..." : "Load"}
          </button>
        </form>

        {lookupError && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {lookupError}
          </div>
        )}

        {activeMemberCode && (
          <div className="px-5 py-2 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-900">
              <span className="font-mono font-bold">{activeMemberCode}</span>
              <span className="text-gray-400 ml-2">{memberBalance} {memberBalance === 1 ? "spin" : "spins"}</span>
            </p>
          </div>
        )}
      </div>

      {/* Wheel — always visible */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <SpinWheel
          segments={segments}
          balance={activeMemberCode ? memberBalance : 0}
          onSpin={async () => {
            if (!activeMemberCode) {
              return { error: "Enter a member code first" };
            }
            const res = await performSpinForMember(activeMemberCode, clubId);
            if (!("error" in res)) {
              setMemberBalance(res.newBalance);
            }
            return res;
          }}
        />
      </div>
    </div>
  );
}
