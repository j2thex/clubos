"use client";

import { useState } from "react";
import { MemberPhotosLightbox } from "./member-photos-lightbox";

function getInitials(
  firstName: string | null,
  lastName: string | null,
  fullName: string | null,
  memberCode: string,
): string {
  const first = firstName?.trim()?.[0];
  const last = lastName?.trim()?.[0];
  if (first && last) return (first + last).toUpperCase();
  if (first) return first.toUpperCase();
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    const a = parts[0]?.[0];
    const b = parts.length > 1 ? parts[parts.length - 1][0] : undefined;
    if (a && b) return (a + b).toUpperCase();
    if (a) return a.toUpperCase();
  }
  return memberCode.slice(0, 1).toUpperCase();
}

export function MemberAvatar({
  photoSignedUrl,
  idPhotoSignedUrl,
  firstName,
  lastName,
  fullName,
  memberCode,
}: {
  photoSignedUrl: string | null;
  idPhotoSignedUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  memberCode: string;
}) {
  const [open, setOpen] = useState(false);
  const hasAnyPhoto = Boolean(photoSignedUrl || idPhotoSignedUrl);
  const initials = getInitials(firstName, lastName, fullName, memberCode);
  const label = fullName?.trim() || memberCode;

  const baseClasses =
    "w-10 h-10 rounded-full overflow-hidden ring-1 ring-gray-200 flex items-center justify-center bg-gray-200 text-xs font-semibold text-gray-600 shrink-0";

  const inner = photoSignedUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photoSignedUrl}
      alt={label}
      className="w-full h-full object-cover"
    />
  ) : (
    <span aria-hidden="true">{initials}</span>
  );

  if (!hasAnyPhoto) {
    return (
      <span className={baseClasses} aria-label={label}>
        {inner}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View photos for ${label}`}
        className={`${baseClasses} hover:ring-gray-400 transition cursor-pointer`}
      >
        {inner}
      </button>
      <MemberPhotosLightbox
        open={open}
        onClose={() => setOpen(false)}
        portraitUrl={photoSignedUrl}
        idPhotoUrl={idPhotoSignedUrl}
        memberName={fullName}
        memberCode={memberCode}
      />
    </>
  );
}
