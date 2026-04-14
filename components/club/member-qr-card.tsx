"use client";

import { QRCodeSVG } from "qrcode.react";

export function MemberQrCard({ memberCode }: { memberCode: string }) {
  return (
    <QRCodeSVG
      value={memberCode}
      size={200}
      level="M"
      bgColor="transparent"
      fgColor="#0a0a0a"
    />
  );
}
