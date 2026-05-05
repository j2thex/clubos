"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useLanguage } from "@/lib/i18n/provider";
import {
  createMember,
  uploadMemberIdPhotoAction,
  uploadMemberPhotoAction,
  uploadMemberSignatureAction,
} from "./actions";
import { CollapsibleSection } from "@/components/collapsible-section";
import { PhotoCapture } from "@/components/club/photo-capture";
import { SignaturePanel } from "@/components/club/signature-panel";
import { RfidCapture } from "@/components/club/rfid-capture";

function ageFromDobIso(dob: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const [, y, mm, dd] = m;
  const today = new Date();
  let age = today.getUTCFullYear() - Number(y);
  const before =
    today.getUTCMonth() + 1 < Number(mm) ||
    (today.getUTCMonth() + 1 === Number(mm) && today.getUTCDate() < Number(dd));
  if (before) age -= 1;
  return age;
}

function FilePreview({ file, alt, className }: { file: File; alt: string; className?: string }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}

export function StaffMemberCreator({
  clubId,
  clubSlug,
  periods,
  roles = [],
  opsEnabled = false,
  requireReferralCode = false,
}: {
  clubId: string;
  clubSlug: string;
  periods: { id: string; name: string; duration_months: number; is_default: boolean }[];
  roles?: { id: string; name: string }[];
  opsEnabled?: boolean;
  requireReferralCode?: boolean;
}) {
  const { t } = useLanguage();
  const [memberCode, setMemberCode] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [residencyStatus, setResidencyStatus] = useState<"local" | "tourist" | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const defaultPeriodId =
    periods.find((p) => p.is_default)?.id ?? periods[0]?.id ?? "";
  const [selectedPeriodId, setSelectedPeriodId] = useState(defaultPeriodId);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [rfidUid, setRfidUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Cache of already-uploaded storage paths, keyed by the File reference that
  // produced them. If the user retries (e.g. server returns ops_required_missing
  // after first attempt), we skip re-upload and reuse the path — preventing
  // orphaned blobs in the bucket.
  const [uploadedPaths, setUploadedPaths] = useState<{
    portrait: { file: File; path: string } | null;
    idPhoto: { file: File; path: string } | null;
    signature: { file: File; path: string } | null;
  }>({ portrait: null, idPhoto: null, signature: null });
  const [isPending, startTransition] = useTransition();

  const todayIso = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!confirmOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) setConfirmOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, isPending]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "N") return;
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (target.isContentEditable) return;
      }
      e.preventDefault();
      setSectionOpen(true);
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        const firstInput = formRef.current?.querySelector<HTMLInputElement>(
          'input:not([type="hidden"])'
        );
        firstInput?.focus();
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const missingRequired = useMemo<string[]>(() => {
    if (!opsEnabled) return [];
    const missing: string[] = [];
    if (!firstName.trim()) missing.push("firstName");
    if (!lastName.trim()) missing.push("lastName");
    if (!dateOfBirth) missing.push("dateOfBirth");
    if (!residencyStatus) missing.push("residencyStatus");
    if (!idNumber.trim()) missing.push("idNumber");
    if (!phone.trim()) missing.push("phone");
    if (!idPhotoFile) missing.push("idPhotoPath");
    if (!portraitFile) missing.push("photoPath");
    if (!signatureFile) missing.push("signaturePath");
    return missing;
  }, [
    opsEnabled,
    firstName,
    lastName,
    dateOfBirth,
    residencyStatus,
    idNumber,
    phone,
    idPhotoFile,
    portraitFile,
    signatureFile,
  ]);
  const disabled = isPending || (opsEnabled && missingRequired.length > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors([]);

    if (opsEnabled && missingRequired.length > 0) {
      setFieldErrors(missingRequired);
      setError(t("ops.memberForm.missingSummary"));
      return;
    }

    if (requireReferralCode && !referredBy.trim()) {
      setFieldErrors(["referredBy"]);
      setError("Referral code is required");
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^\+?[\d\s().-]{6,}$/.test(trimmedPhone)) {
      setError(t("ops.memberForm.phoneInvalid"));
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t("ops.memberForm.emailInvalid"));
      return;
    }

    if (opsEnabled) {
      setConfirmOpen(true);
      return;
    }

    runCreate();
  }

  function runCreate() {
    startTransition(async () => {
      let idPhotoPath: string | null = null;
      let photoPath: string | null = null;
      let signaturePath: string | null = null;

      if (idPhotoFile) {
        if (uploadedPaths.idPhoto && uploadedPaths.idPhoto.file === idPhotoFile) {
          idPhotoPath = uploadedPaths.idPhoto.path;
        } else {
          const fd = new FormData();
          fd.set("clubId", clubId);
          fd.set("file", idPhotoFile);
          const r = await uploadMemberIdPhotoAction(fd);
          if ("error" in r) {
            setError(r.error);
            return;
          }
          idPhotoPath = r.path;
          setUploadedPaths((p) => ({ ...p, idPhoto: { file: idPhotoFile, path: r.path } }));
        }
      }

      if (portraitFile) {
        if (uploadedPaths.portrait && uploadedPaths.portrait.file === portraitFile) {
          photoPath = uploadedPaths.portrait.path;
        } else {
          const fd = new FormData();
          fd.set("clubId", clubId);
          fd.set("file", portraitFile);
          const r = await uploadMemberPhotoAction(fd);
          if ("error" in r) {
            setError(r.error);
            return;
          }
          photoPath = r.path;
          setUploadedPaths((p) => ({ ...p, portrait: { file: portraitFile, path: r.path } }));
        }
      }

      if (signatureFile) {
        if (uploadedPaths.signature && uploadedPaths.signature.file === signatureFile) {
          signaturePath = uploadedPaths.signature.path;
        } else {
          const fd = new FormData();
          fd.set("clubId", clubId);
          fd.set("file", signatureFile);
          const r = await uploadMemberSignatureAction(fd);
          if ("error" in r) {
            setError(r.error);
            return;
          }
          signaturePath = r.path;
          setUploadedPaths((p) => ({ ...p, signature: { file: signatureFile, path: r.path } }));
        }
      }

      const result = await createMember(clubId, clubSlug, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        dateOfBirth: dateOfBirth || null,
        residencyStatus,
        idNumber,
        phone: phone.trim() || null,
        email: email.trim() || null,
        periodId: selectedPeriodId || null,
        roleId: selectedRoleId || null,
        referredBy: referredBy || null,
        memberCode: memberCode.trim() || null,
        idPhotoPath,
        photoPath,
        signaturePath,
        rfidUid,
      });

      if ("error" in result) {
        setConfirmOpen(false);
        if (result.error.startsWith("ops_required_missing:")) {
          const fields = result.error.slice("ops_required_missing:".length).split(",").filter(Boolean);
          setFieldErrors(fields);
          setError(t("ops.memberForm.missingSummary"));
        } else if (result.error.startsWith("This club requires members to be 18")) {
          setError(t("ops.memberForm.under18Error"));
        } else {
          setError(result.error);
        }
      } else {
        setConfirmOpen(false);
        setSuccess(t("ops.memberForm.created", { code: result.memberCode }));
        setMemberCode("");
        setIdNumber("");
        setReferredBy("");
        setFirstName("");
        setLastName("");
        setDateOfBirth("");
        setResidencyStatus(null);
        setPhone("");
        setEmail("");
        setSelectedPeriodId(defaultPeriodId);
        setSelectedRoleId("");
        setPortraitFile(null);
        setIdPhotoFile(null);
        setSignatureFile(null);
        setRfidUid(null);
        setFieldErrors([]);
        setUploadedPaths({ portrait: null, idPhoto: null, signature: null });
        setTimeout(() => setSuccess(null), 5000);
      }
    });
  }

  return (
    <CollapsibleSection
      title={t("ops.memberForm.sectionTitle")}
      open={sectionOpen}
      onOpenChange={setSectionOpen}
      titleAdornment={
        <span className="hidden md:inline ml-2 text-[11px] font-normal normal-case text-gray-400 tracking-normal">
          (Shift + N)
        </span>
      }
    >
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <form ref={formRef} onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                {t("ops.memberForm.memberCodeLabel")}
              </span>
              <input
                type="text"
                value={memberCode}
                onChange={(e) =>
                  setMemberCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                }
                placeholder={t("ops.memberForm.memberCodePlaceholder")}
                maxLength={16}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">
                {t("ops.memberForm.referredByLabel")}
                {requireReferralCode && <span className="text-red-600 ml-0.5">*</span>}
              </span>
              <input
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value.toUpperCase())}
                placeholder={t("ops.memberForm.referredByPlaceholder")}
                maxLength={8}
                required={requireReferralCode}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition ${
                  fieldErrors.includes("referredBy") ? "border-red-400" : "border-gray-300"
                }`}
              />
            </label>
          </div>

          {opsEnabled && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
              {t("ops.memberForm.identityRequiredBanner")}
            </div>
          )}

          <div className="pt-1 border-t border-gray-100">
            <CollapsibleSection
              title={t("ops.memberForm.moreDetailsLabel")}
              defaultOpen={opsEnabled}
            >
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-gray-500">
                    {residencyStatus === "tourist"
                      ? t("ops.memberForm.idNumberLabelTourist")
                      : t("ops.memberForm.idNumberLabelLocal")}
                    {opsEnabled && <span className="text-red-600 ml-0.5">*</span>}
                  </span>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder={
                      residencyStatus === "tourist"
                        ? t("ops.memberForm.idNumberPlaceholderTourist")
                        : t("ops.memberForm.idNumberPlaceholderLocal")
                    }
                    required={opsEnabled}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition ${fieldErrors.includes("idNumber") ? "border-red-400" : "border-gray-300"}`}
                  />
                  {fieldErrors.includes("idNumber") && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {t("ops.memberForm.requiredField.idNumber")}
                    </p>
                  )}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      {t("ops.memberForm.firstNameLabel")}
                      {opsEnabled && <span className="text-red-600 ml-0.5">*</span>}
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t("ops.memberForm.firstNamePlaceholder")}
                      required={opsEnabled}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition ${fieldErrors.includes("firstName") ? "border-red-400" : "border-gray-300"}`}
                    />
                    {fieldErrors.includes("firstName") && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {t("ops.memberForm.requiredField.firstName")}
                      </p>
                    )}
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      {t("ops.memberForm.lastNameLabel")}
                      {opsEnabled && <span className="text-red-600 ml-0.5">*</span>}
                    </span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t("ops.memberForm.lastNamePlaceholder")}
                      required={opsEnabled}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition ${fieldErrors.includes("lastName") ? "border-red-400" : "border-gray-300"}`}
                    />
                    {fieldErrors.includes("lastName") && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {t("ops.memberForm.requiredField.lastName")}
                      </p>
                    )}
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      {t("ops.memberForm.dobLabel")}
                      {opsEnabled && <span className="text-red-600 ml-0.5">*</span>}
                    </span>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      max={todayIso}
                      required={opsEnabled}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition ${fieldErrors.includes("dateOfBirth") ? "border-red-400" : "border-gray-300"}`}
                    />
                    {fieldErrors.includes("dateOfBirth") && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {t("ops.memberForm.requiredField.dateOfBirth")}
                      </p>
                    )}
                  </label>
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">
                      {t("ops.memberForm.residencyLabel")}
                      {opsEnabled && <span className="text-red-600 ml-0.5">*</span>}
                    </span>
                    <div className={`flex gap-2 ${fieldErrors.includes("residencyStatus") ? "rounded-lg ring-1 ring-red-400" : ""}`}>
                      <label className="flex-1 flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 cursor-pointer text-sm has-[:checked]:bg-gray-800 has-[:checked]:text-white has-[:checked]:border-gray-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gray-400 has-[:focus-visible]:ring-offset-1 transition">
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
                      <label className="flex-1 flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 cursor-pointer text-sm has-[:checked]:bg-gray-800 has-[:checked]:text-white has-[:checked]:border-gray-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gray-400 has-[:focus-visible]:ring-offset-1 transition">
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
                    {fieldErrors.includes("residencyStatus") && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {t("ops.memberForm.requiredField.residencyStatus")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-500">
                      {t("ops.memberForm.phoneLabel")}
                      {opsEnabled && <span className="text-red-600 ml-0.5">*</span>}
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("ops.memberForm.phonePlaceholder")}
                      required={opsEnabled}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition ${fieldErrors.includes("phone") ? "border-red-400" : "border-gray-300"}`}
                    />
                    {fieldErrors.includes("phone") && (
                      <p className="mt-1 text-[11px] text-red-600">
                        {t("ops.memberForm.requiredField.phone")}
                      </p>
                    )}
                  </label>
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
                </div>

                {(periods.length > 0 || roles.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <span className="mt-1 block text-[11px] text-gray-400">
                          {t("ops.memberForm.periodHelp")}
                        </span>
                      </label>
                    )}
                    {roles.length > 0 && (
                      <label className="block">
                        <span className="text-xs font-medium text-gray-500">
                          {t("ops.memberForm.roleLabel")}
                        </span>
                        <select
                          value={selectedRoleId}
                          onChange={(e) => setSelectedRoleId(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        >
                          <option value="">{t("ops.memberForm.noRole")}</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}

                {opsEnabled && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <PhotoCapture
                          label={`${t("ops.memberForm.portraitLabel")} *`}
                          facingMode="user"
                          value={portraitFile}
                          onChange={setPortraitFile}
                        />
                        {fieldErrors.includes("photoPath") && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {t("ops.memberForm.requiredField.photoPath")}
                          </p>
                        )}
                      </div>
                      <div>
                        <PhotoCapture
                          label={`${t("ops.memberForm.idPhotoRequiredLabel")} *`}
                          facingMode="environment"
                          value={idPhotoFile}
                          onChange={setIdPhotoFile}
                        />
                        {fieldErrors.includes("idPhotoPath") && (
                          <p className="mt-1 text-[11px] text-red-600">
                            {t("ops.memberForm.requiredField.idPhotoPath")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <SignaturePanel
                        label={`${t("ops.memberForm.signatureLabel")} *`}
                        value={signatureFile}
                        onChange={setSignatureFile}
                      />
                      {fieldErrors.includes("signaturePath") && (
                        <p className="mt-1 text-[11px] text-red-600">
                          {t("ops.memberForm.requiredField.signaturePath")}
                        </p>
                      )}
                    </div>
                    <RfidCapture
                      label={t("ops.memberForm.rfidLabel")}
                      value={rfidUid}
                      onChange={setRfidUid}
                    />
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={disabled}
              title={
                opsEnabled && missingRequired.length > 0
                  ? t("ops.memberForm.missingSummary")
                  : undefined
              }
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

      {confirmOpen && opsEnabled && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!isPending) setConfirmOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-member-title"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 id="confirm-member-title" className="text-base font-semibold text-gray-900">
                {t("ops.memberForm.confirmTitle")}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {t("ops.memberForm.confirmIntro")}
              </p>
            </div>

            <div className="px-5 py-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <ReviewRow label={t("ops.memberForm.firstNameLabel")} value={firstName.trim()} />
                <ReviewRow label={t("ops.memberForm.lastNameLabel")} value={lastName.trim()} />
                <ReviewRow
                  label={t("ops.memberForm.dobLabel")}
                  value={dateOfBirth}
                  hint={
                    dateOfBirth
                      ? t("ops.memberForm.review.ageLabel", { age: String(ageFromDobIso(dateOfBirth) ?? "") })
                      : undefined
                  }
                />
                <ReviewRow
                  label={t("ops.memberForm.residencyLabel")}
                  value={
                    residencyStatus === "local"
                      ? t("ops.memberForm.residencyLocal")
                      : residencyStatus === "tourist"
                        ? t("ops.memberForm.residencyTourist")
                        : ""
                  }
                />
                <ReviewRow
                  label={
                    residencyStatus === "tourist"
                      ? t("ops.memberForm.idNumberLabelTourist")
                      : t("ops.memberForm.idNumberLabelLocal")
                  }
                  value={idNumber.trim()}
                />
                <ReviewRow label={t("ops.memberForm.phoneLabel")} value={phone.trim()} />
                <ReviewRow label={t("ops.memberForm.emailLabel")} value={email.trim()} />
                <ReviewRow
                  label={t("ops.memberForm.periodLabel")}
                  value={periods.find((p) => p.id === selectedPeriodId)?.name ?? ""}
                />
                <ReviewRow
                  label={t("ops.memberForm.roleLabel")}
                  value={roles.find((r) => r.id === selectedRoleId)?.name ?? ""}
                />
                <ReviewRow label={t("ops.memberForm.rfidLabel")} value={rfidUid ?? ""} />
                <ReviewRow
                  label={t("ops.memberForm.memberCodeLabel")}
                  value={memberCode.trim()}
                  hint={memberCode.trim() ? undefined : t("ops.memberForm.review.autoGenerated")}
                />
                <ReviewRow label={t("ops.memberForm.referredByLabel")} value={referredBy.trim()} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {t("ops.memberForm.portraitLabel")}
                  </p>
                  {portraitFile ? (
                    <FilePreview
                      file={portraitFile}
                      alt="portrait"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                      —
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {t("ops.memberForm.idPhotoRequiredLabel")}
                  </p>
                  {idPhotoFile ? (
                    <FilePreview
                      file={idPhotoFile}
                      alt="id document"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                      —
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {t("ops.memberForm.signatureLabel")}
                  </p>
                  {signatureFile ? (
                    <FilePreview
                      file={signatureFile}
                      alt="signature"
                      className="w-full h-32 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                      —
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                {t("ops.memberForm.confirmEdit")}
              </button>
              <button
                type="button"
                onClick={runCreate}
                disabled={isPending}
                className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "…" : t("ops.memberForm.confirmCreate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

function ReviewRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 break-words">{value || <span className="text-gray-400">—</span>}</p>
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}
