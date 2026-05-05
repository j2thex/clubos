export function MemberStaffNote({ note }: { note: string | null | undefined }) {
  if (!note || !note.trim()) return null;
  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
      <span className="text-amber-600 text-base leading-none mt-0.5" aria-hidden>
        📌
      </span>
      <p className="text-xs text-amber-900 whitespace-pre-wrap break-words flex-1">
        {note}
      </p>
    </div>
  );
}
