"use client";

import { useEffect, useState } from "react";
import { X, BadgeCheck, Mail, Phone, Filter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  getMemberProfileByCode,
  type MemberProfile,
} from "@/lib/actions/member-profile";

interface MemberProfileSheetProps {
  open: boolean;
  onClose: () => void;
  clubSlug: string;
  memberCode: string;
  /** Optional: when set, renders a "Filter sales by this member" action linking to this URL. */
  filterTransactionsHref?: string;
  /** Optional: shown as the "Edit details" CTA. Defaults to /staff/members?q=<code>. */
  editHref?: string;
}

export function MemberProfileSheet({
  open,
  onClose,
  clubSlug,
  memberCode,
  filterTransactionsHref,
  editHref,
}: MemberProfileSheetProps) {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMember(null);
    getMemberProfileByCode(clubSlug, memberCode).then((res) => {
      if (cancelled) return;
      if ("error" in res) setError(res.error);
      else setMember(res.member);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, clubSlug, memberCode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const editFallback = editHref ?? `/${clubSlug}/staff/members?q=${memberCode}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Member ${memberCode}`}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <h2 className="flex-1 text-sm font-semibold text-gray-900 truncate">
            {memberCode}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <p className="text-sm text-gray-500 text-center py-6">Loading…</p>
          )}
          {error && (
            <p className="text-sm text-red-600 text-center py-6">
              {error === "not_found" ? "Member not found." : "Could not load member."}
            </p>
          )}
          {member && (
            <>
              <div className="flex items-center gap-3">
                {member.photoSignedUrl ? (
                  <Image
                    src={member.photoSignedUrl}
                    alt={member.fullName ?? member.memberCode}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="h-16 w-16 rounded-xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500">
                    {(member.fullName ?? member.memberCode).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">
                    {member.fullName ?? "—"}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{member.memberCode}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge tone={member.status === "active" ? "green" : "gray"}>
                  {member.status}
                </Badge>
                {member.idVerifiedAt && (
                  <Badge tone="blue">
                    <BadgeCheck className="h-3 w-3" /> ID verified
                  </Badge>
                )}
                {member.validTill && (
                  <Badge tone={member.validExpired ? "red" : "green"}>
                    {member.validExpired ? "Expired" : "Valid"} · {member.validTill}
                  </Badge>
                )}
              </div>

              {member.staffNote && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 mb-1">
                    Staff note
                  </p>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">
                    {member.staffNote}
                  </p>
                </div>
              )}

              {(member.email || member.phone) && (
                <div className="space-y-1.5 text-sm text-gray-700">
                  {member.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </p>
                  )}
                  {member.phone && (
                    <p className="flex items-center gap-2 truncate">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">{member.phone}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                {filterTransactionsHref && (
                  <Link
                    href={filterTransactionsHref}
                    onClick={onClose}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 text-white px-3 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    <Filter className="h-3.5 w-3.5" /> Filter sales by this member
                  </Link>
                )}
                <Link
                  href={editFallback}
                  onClick={onClose}
                  className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Open in members
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "green" | "gray" | "red" | "blue";
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    green: "bg-green-50 text-green-700 border-green-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

interface MemberCodeLinkProps {
  code: string;
  clubSlug: string;
  fullName?: string | null;
  filterTransactionsHref?: string;
  className?: string;
}

export function MemberCodeLink({
  code,
  clubSlug,
  fullName,
  filterTransactionsHref,
  className,
}: MemberCodeLinkProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "hover:underline"}
      >
        {code}
        {fullName ? ` · ${fullName}` : ""}
      </button>
      <MemberProfileSheet
        open={open}
        onClose={() => setOpen(false)}
        clubSlug={clubSlug}
        memberCode={code}
        filterTransactionsHref={filterTransactionsHref}
      />
    </>
  );
}
