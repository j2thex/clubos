"use client";

import { useRef, useState, useTransition } from "react";
import { useLanguage } from "@/lib/i18n/provider";
import { createMember, uploadMemberIdPhotoAction } from "./actions";

export function StaffMemberCreator({
  clubId,
  clubSlug,
  periods,
  opsEnabled = false,
}: {
  clubId: string;
  clubSlug: string;
  periods: { id: string; name: string; duration_months: number }[];
  opsEnabled?: boolean;
}) {
  const { t } = useLanguage();
  const [memberCode, setMemberCode] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (opsEnabled && !dateOfBirth) {
      setError(t("ops.memberForm.dobRequired"));
      return;
    }

    startTransition(async () => {
      let photoPath: string | null = null;
      if (photoFile) {
        const fd = new FormData();
        fd.set("clubId", clubId);
        fd.set("file", photoFile);
        const uploadResult = await uploadMemberIdPhotoAction(fd);
        if ("error" in uploadResult) {
          setError(uploadResult.error);
          return;
        }
        photoPath = uploadResult.path;
      }

      const result = await createMember(
        clubId,
        memberCode,
        clubSlug,
        selectedPeriodId || null,
        referredBy || null,
        dateOfBirth || null,
        photoPath,
      );
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(t("ops.memberForm.created", { code: memberCode.toUpperCase() }));
        setMemberCode("");
        setSelectedPeriodId("");
        setReferredBy("");
        setDateOfBirth("");
        setPhotoFile(null);
        if (photoInputRef.current) photoInputRef.current.value = "";
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t("ops.memberForm.sectionTitle")}
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="staffMemberCode" className="block text-xs font-medium text-gray-500 mb-1">
                {t("ops.memberForm.codeLabel")}
              </label>
              <input
                id="staffMemberCode"
                type="text"
                value={memberCode}
                onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
                placeholder={t("ops.memberForm.codePlaceholder")}
                maxLength={8}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !memberCode.trim()}
              className="rounded-lg bg-gray-800 text-white px-5 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {isPending ? "..." : t("ops.memberForm.create")}
            </button>
          </div>
          <div className="px-5 pb-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t("ops.memberForm.referredByLabel")}
            </label>
            <input
              type="text"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value.toUpperCase())}
              placeholder={t("ops.memberForm.referredByPlaceholder")}
              maxLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
            />
          </div>
          {periods.length > 0 && (
            <div className="px-5 pb-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t("ops.memberForm.periodLabel")}
              </label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-white"
              >
                <option value="">{t("ops.memberForm.noPeriod")}</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.duration_months} {t(p.duration_months === 1 ? "ops.memberForm.month" : "ops.memberForm.months")})
                  </option>
                ))}
              </select>
            </div>
          )}
          {opsEnabled && (
            <>
              <div className="px-5 pb-2">
                <label htmlFor="dob" className="block text-xs font-medium text-gray-500 mb-1">
                  {t("ops.memberForm.dobLabel")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
              <div className="px-5 pb-4">
                <label htmlFor="idPhoto" className="block text-xs font-medium text-gray-500 mb-1">
                  {t("ops.memberForm.photoLabel")}
                </label>
                <input
                  id="idPhoto"
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {t("ops.memberForm.photoHelp")}
                </p>
              </div>
            </>
          )}
        </form>

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="px-5 py-2 text-xs text-green-700 bg-green-50 border-t border-green-100">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
