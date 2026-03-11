"use client";

import { QRCodeSVG } from "qrcode.react";

export function MemberQrCard({ memberCode }: { memberCode: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <QRCodeSVG
          value={memberCode}
          size={200}
          level="M"
          bgColor="transparent"
        />
      </div>
      <p className="text-5xl font-extrabold font-mono tracking-[0.25em] club-tint-text">
        {memberCode}
      </p>
    </div>
  );
}
