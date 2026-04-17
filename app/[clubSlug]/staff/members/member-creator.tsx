"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/lib/i18n/provider";
import {
  createMember,
  uploadMemberIdPhotoAction,
  uploadMemberPhotoAction,
  uploadMemberSignatureAction,
} from "./actions";
import { PhotoCapture } from "@/components/club/photo-capture";
import { SignaturePad } from "@/components/club/signature-pad";

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [residencyStatus, setResidencyStatus] = useState<"local" | "tourist">("local");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const todayIso = new Date().toISOString().split("T")[0];
  const disabled =
    isPending ||
    !firstName.trim() ||
    !lastName.trim() ||
    !dateOfBirth ||
    !idNumber.trim() ||
    !phone.trim() ||
    (opsEnabled && (!portraitFile || !idPhotoFile || !signatureFile));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      let idPhotoPath: string | null = null;
      let photoPath: string | null = null;
      let signaturePath: string | null = null;

      if (idPhotoFile) {
        const fd = new FormData();
        fd.set("clubId", clubId);
        fd.set("file", idPhotoFile);
        const r = await uploadMemberIdPhotoAction(fd);
        if ("error" in r) {
          setError(r.error);
          return;
        }
        idPhotoPath = r.path;
      }

      if (portraitFile) {
        const fd = new FormData();
        fd.set("clubId", clubId);
        fd.set("file", portraitFile);
        const r = await uploadMemberPhotoAction(fd);
        if ("error" in r) {
          setError(r.error);
          return;
        }
        photoPath = r.path;
      }

      if (signatureFile) {
        const fd = new FormData();
        fd.set("clubId", clubId);
        fd.set("file", signatureFile);
        const r = await uploadMemberSignatureAction(fd);
        if ("error" in r) {
          setError(r.error);
          return;
        }
        signaturePath = r.path;
      }

      const result = await createMember(clubId, clubSlug, {
        firstName,
        lastName,
        dateOfBirth,
        residencyStatus,
        idNumber,
        phone,
        email: email.trim() || null,
        periodId: selectedPeriodId || null,
        referredBy: referredBy || null,
        idPhotoPath,
        photoPath,
        signaturePath,
      });

      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(t("ops.memberForm.created", { code: result.memberCode }));
        setFirstName("");
        setLastName("");
        setDateOfBirth("");
        setResidencyStatus("local");
        setIdNumber("");
        setPhone("");
        setEmail("");
        setSelectedPeriodId("");
        setReferredBy("");
        setPortraitFile(null);
        setIdPhotoFile(null);
        setSignatureFile(null);
        setTimeout(() => setSuccess(null), 5000);
      }
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t("ops.memberForm.sectionTitle")}
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                {t("ops.memberForm.firstNameLabel")} <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t("ops.memberForm.firstNamePlaceholder")}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                {t("ops.memberForm.lastNameLabel")} <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t("ops.memberForm.lastNamePlaceholder")}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                {t("ops.memberForm.dobLabel")} <span className="text-red-500">*</span>
              </span>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={todayIso}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </label>
            <div>
              <span className="text-xs font-medium text-gray-500 block mb-1">
                {t("ops.memberForm.residencyLabel")} <span className="text-red-500">*</span>
              </span>
              <div className="flex gap-2">
                <label className="flex-1 flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 cursor-pointer text-sm has-[:checked]:bg-gray-800 has-[:checked]:text-white has-[:checked]:border-gray-800 transition">
                  <input
                    type="radio"
                    name="residency"
                    value="local"
                    checked={residencyStatus === "local"}
                    onChange={() => setResidencyStatus("local")}
                    className="sr-only"
                  />
                  {t("ops.memberForm.residencyLocal")}
                </label>
                <label className="flex-1 flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 cursor-pointer text-sm has-[:checked]:bg-gray-800 has-[:checked]:text-white has-[:checked]:border-gray-800 transition">
                  <input
                    type="radio"
                    name="residency"
                    value="tourist"
                    checked={residencyStatus === "tourist"}
                    onChange={() => setResidencyStatus("tourist")}
                    className="sr-only"
                  />
                  {t("ops.memberForm.residencyTourist")}
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                {residencyStatus === "local"
                  ? t("ops.memberForm.idNumberLabelLocal")
                  : t("ops.memberForm.idNumberLabelTourist")}{" "}
                <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder={
                  residencyStatus === "local"
                    ? t("ops.memberForm.idNumberPlaceholderLocal")
                    : t("ops.memberForm.idNumberPlaceholderTourist")
                }
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                {t("ops.memberForm.phoneLabel")} <span className="text-red-500">*</span>
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("ops.memberForm.phonePlaceholder")}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              {t("ops.memberForm.emailLabel")}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("ops.memberForm.emailPlaceholder")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                {t("ops.memberForm.referredByLabel")}
              </span>
              <input
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value.toUpperCase())}
                placeholder={t("ops.memberForm.referredByPlaceholder")}
                maxLength={8}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </label>
            {periods.length > 0 && (
              <label className="block">
                <span className="text-xs font-medium text-gray-500">
                  {t("ops.memberForm.periodLabel")}
                </span>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                >
                  <option value="">{t("ops.memberForm.noPeriod")}</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.duration_months}{" "}
                      {t(p.duration_months === 1 ? "ops.memberForm.month" : "ops.memberForm.months")})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {opsEnabled && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PhotoCapture
                  label={t("ops.memberForm.portraitLabel")}
                  required
                  facingMode="user"
                  value={portraitFile}
                  onChange={setPortraitFile}
                />
                <PhotoCapture
                  label={t("ops.memberForm.idPhotoRequiredLabel")}
                  required
                  facingMode="environment"
                  value={idPhotoFile}
                  onChange={setIdPhotoFile}
                />
              </div>
              <SignaturePad
                label={t("ops.memberForm.signatureLabel")}
                required
                value={signatureFile}
                onChange={setSignatureFile}
              />
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={disabled}
              className="w-full rounded-lg bg-gray-800 text-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "…" : t("ops.memberForm.create")}
            </button>
          </div>
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
