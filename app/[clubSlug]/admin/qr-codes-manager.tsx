"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef, useCallback } from "react";
import { Download } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://osocios.club";

function downloadQrAsPng(svgElement: SVGSVGElement, filename: string) {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement("canvas");
  const size = 1024;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = "data:image/svg+xml;base64," + btoa(svgData);
}

function QrCard({
  label,
  url,
  filename,
}: {
  label: string;
  url: string;
  filename: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownload = useCallback(() => {
    if (svgRef.current) {
      downloadQrAsPng(svgRef.current, filename);
    }
  }, [filename]);

  return (
    <div className="flex flex-col items-center gap-3 bg-white rounded-xl p-6 shadow-sm border">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="bg-white p-3 rounded-lg">
        <QRCodeSVG
          ref={svgRef}
          value={url}
          size={180}
          level="M"
          bgColor="#ffffff"
        />
      </div>
      <p className="text-xs text-gray-400 break-all text-center max-w-[220px]">
        {url}
      </p>
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        Download PNG
      </button>
    </div>
  );
}

export function QrCodesManager({ clubSlug }: { clubSlug: string }) {
  const memberPortalUrl = `${SITE_URL}/${clubSlug}`;
  const publicPageUrl = `${SITE_URL}/${clubSlug}/public`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <QrCard
        label="Member Portal"
        url={memberPortalUrl}
        filename={`${clubSlug}-member-portal-qr`}
      />
      <QrCard
        label="Public Page"
        url={publicPageUrl}
        filename={`${clubSlug}-public-page-qr`}
      />
    </div>
  );
}
