"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/provider";

type Status = "idle" | "requesting" | "streaming" | "captured" | "denied";

export function PhotoCapture({
  label,
  required,
  facingMode,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  facingMode: "user" | "environment";
  value: File | null;
  onChange: (file: File | null) => void;
}) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Derive the preview URL from the file via useMemo (avoids set-state-in-effect).
  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  // Stop any active stream on unmount.
  useEffect(() => {
    return () => stopStream();
  }, []);

  async function startCamera() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("denied");
      setError(t("ops.memberForm.photoCapture.cameraUnsupported"));
      return;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });
      streamRef.current = stream;
      // The <video> element doesn't exist until status flips to "streaming"
      // and the streaming branch renders. The ref callback on that <video>
      // below attaches the stream once it mounts.
      setStatus("streaming");
    } catch {
      stopStream();
      setStatus("denied");
      setError(t("ops.memberForm.photoCapture.cameraDenied"));
    }
  }

  function attachStreamToVideo(el: HTMLVideoElement | null) {
    videoRef.current = el;
    if (!el) return;
    const stream = streamRef.current;
    if (stream && el.srcObject !== stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onChange(file);
        stopStream();
        setStatus("captured");
      },
      "image/jpeg",
      0.9,
    );
  }

  function retake() {
    onChange(null);
    setStatus("idle");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    onChange(f);
    stopStream();
    setStatus("captured");
    setError(null);
  }

  const hasFile = Boolean(value && previewUrl);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
        {hasFile && (
          <button
            type="button"
            onClick={retake}
            className="text-[11px] text-blue-600 hover:underline"
          >
            {t("ops.memberForm.photoCapture.retake")}
          </button>
        )}
      </div>

      {hasFile ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl!}
          alt=""
          className="w-full rounded-lg border border-gray-200 object-cover aspect-[4/3] bg-gray-100"
        />
      ) : status === "streaming" ? (
        <div className="space-y-2">
          <video
            ref={attachStreamToVideo}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg bg-black aspect-[4/3] object-cover"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={capture}
              className="flex-1 rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 hover:bg-gray-700 transition"
            >
              {t("ops.memberForm.photoCapture.capture")}
            </button>
            <button
              type="button"
              onClick={() => {
                stopStream();
                setStatus("idle");
              }}
              className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 px-4 py-2"
            >
              {t("ops.memberForm.photoCapture.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={startCamera}
              disabled={status === "requesting"}
              className="rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {status === "requesting"
                ? t("ops.memberForm.photoCapture.requesting")
                : t("ops.memberForm.photoCapture.useCamera")}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 py-2 hover:bg-gray-50 transition"
            >
              {t("ops.memberForm.photoCapture.uploadFile")}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            capture={facingMode}
            onChange={onFilePick}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
