"use client";

import { useState, useRef, useTransition } from "react";
import SpinWheel, { type SpinWheelHandle } from "@/components/club/spin-wheel";
import { performSpinForMember } from "./actions";

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
  const [isPending, startTransition] = useTransition();
  const [memberBalance, setMemberBalance] = useState<number>(0);
  const [activeMemberCode, setActiveMemberCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wheelRef = useRef<SpinWheelHandle>(null);

  function handleSpin(e: React.FormEvent) {
    e.preventDefault();
    const code = memberCode.trim().toUpperCase();
    if (!code) return;
    if (wheelRef.current?.isSpinning()) return;

    setError(null);
    startTransition(async () => {
      const res = await performSpinForMember(code, clubId);
      if ("error" in res) {
        setError(res.error);
        if (res.error === "Member not found" || res.error === "Invalid member code") {
          setActiveMemberCode(null);
          setMemberBalance(0);
        }
        return;
      }

      setActiveMemberCode(code);
      setMemberBalance(res.newBalance);
      wheelRef.current?.spin(res);
    });
  }

  return (
    <div className="space-y-4">
      {/* Member code + spin button */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <form onSubmit={handleSpin} className="px-5 py-4 flex gap-3 items-end">
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
            disabled={isPending || !memberCode.trim()}
            className="rounded-lg bg-gray-800 text-white px-6 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isPending ? "..." : "Spin"}
          </button>
        </form>

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {error}
          </div>
        )}

        {activeMemberCode && (
          <div className="px-5 py-2 border-t border-gray-100">
            <p className="text-sm text-gray-900">
              <span className="font-mono font-bold">{activeMemberCode}</span>
              <span className="text-gray-400 ml-2">{memberBalance} {memberBalance === 1 ? "spin" : "spins"} remaining</span>
            </p>
          </div>
        )}
      </div>

      {/* Wheel — always visible, button hidden */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <SpinWheel
          ref={wheelRef}
          segments={segments}
          balance={activeMemberCode ? memberBalance : 0}
          hideButton
        />
      </div>
    </div>
  );
}
