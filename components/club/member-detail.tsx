"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { PhotoCapture } from "@/components/club/photo-capture";
import { SignaturePanel } from "@/components/club/signature-panel";
import { RfidCapture } from "@/components/club/rfid-capture";

export type MemberDetailRecord = {
  id: string;
  member_code: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  residency_status: "local" | "tourist" | null;
  id_number: string | null;
  phone: string | null;
  email: string | null;
  marketing_channel: string | null;
  rfid_uid: string | null;
  id_verified_at: string | null;
  id_photo_url: string | null;
  photo_url: string | null;
  signature_url: string | null;
};

export type UpdateMemberIdentityInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  residencyStatus: "local" | "tourist" | null;
  idNumber: string | null;
  phone: string | null;
  email: string | null;
  marketingChannel?: string | null;
};

export type MemberDetailActions = {
  updateIdentity: (
    memberId: string,
    clubSlug: string,
    input: UpdateMemberIdentityInput,
  ) => Promise<{ error: string } | { ok: true }>;
  replaceIdPhoto: (
    fd: FormData,
  ) => Promise<{ error: string } | { ok: true; path: string }>;
  replacePortrait: (
    fd: FormData,
  ) => Promise<{ error: string } | { ok: true; path: string }>;
  replaceSignature: (
    fd: FormData,
  ) => Promise<{ error: string } | { ok: true; path: string }>;
  rebindRfid: (
    memberId: string,
    clubSlug: string,
    newUid: string | null,
  ) => Promise<{ error: string } | { ok: true }>;
  markVerified: (
    memberId: string,
    clubSlug: string,
  ) => Promise<{ error: string } | { ok: true }>;
  revokeVerification: (
    memberId: string,
    clubSlug: string,
  ) => Promise<{ error: string } | { ok: true }>;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function MemberDetail({
  member,
  clubId,
  clubSlug,
  actions,
  allowMarketingChannel = false,
  knownMarketingChannels = [],
}: {
  member: MemberDetailRecord;
  clubId: string;
  clubSlug: string;
  actions: MemberDetailActions;
  allowMarketingChannel?: boolean;
  knownMarketingChannels?: string[];
}) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(member.first_name ?? "");
  const [lastName, setLastName] = useState(member.last_name ?? "");
  const [dob, setDob] = useState(member.date_of_birth ?? "");
  const [residency, setResidency] = useState<"local" | "tourist" | null>(
    member.residency_status,
  );
  const [idNumber, setIdNumber] = useState(member.id_number ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [email, setEmail] = useState(member.email ?? "");
  const [marketingChannel, setMarketingChannel] = useState(member.marketing_channel ?? "");

  const [replaceTarget, setReplaceTarget] = useState<
    null | "portrait" | "idphoto" | "signature"
  >(null);
  const [portraitFile, setPortraitFile] = useState<File | null>(null);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const [rebindOpen, setRebindOpen] = useState(false);
  const [rfidDraft, setRfidDraft] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const todayIso = new Date().toISOString().split("T")[0];

  function handleSaveIdentity() {
    startTransition(async () => {
      const r = await actions.updateIdentity(member.id, clubSlug, {
        firstName,
        lastName,
        dateOfBirth: dob || null,
        residencyStatus: residency,
        idNumber: idNumber || null,
        phone: phone || null,
        email: email || null,
        ...(allowMarketingChannel
          ? { marketingChannel: marketingChannel || null }
          : {}),
      });
      if ("error" in r) toast.error(r.error);
      else toast.success(t("admin.memberDetail.identitySaved"));
    });
  }

  function handleReplacePortrait() {
    if (!portraitFile) return;
    const fd = new FormData();
    fd.set("clubId", clubId);
    fd.set("memberId", member.id);
    fd.set("file", portraitFile);
    startTransition(async () => {
      const r = await actions.replacePortrait(fd);
      if ("error" in r) toast.error(r.error);
      else {
        toast.success(t("admin.memberDetail.portraitReplaced"));
        setPortraitFile(null);
        setReplaceTarget(null);
      }
    });
  }

  function handleReplaceIdPhoto() {
    if (!idPhotoFile) return;
    const fd = new FormData();
    fd.set("clubId", clubId);
    fd.set("memberId", member.id);
    fd.set("file", idPhotoFile);
    startTransition(async () => {
      const r = await actions.replaceIdPhoto(fd);
      if ("error" in r) toast.error(r.error);
      else {
        toast.success(t("admin.memberDetail.idPhotoReplaced"));
        setIdPhotoFile(null);
        setReplaceTarget(null);
      }
    });
  }

  function handleReplaceSignature() {
    if (!signatureFile) return;
    const fd = new FormData();
    fd.set("clubId", clubId);
    fd.set("memberId", member.id);
    fd.set("file", signatureFile);
    startTransition(async () => {
      const r = await actions.replaceSignature(fd);
      if ("error" in r) toast.error(r.error);
      else {
        toast.success(t("admin.memberDetail.signatureReplaced"));
        setSignatureFile(null);
        setReplaceTarget(null);
      }
    });
  }

  function handleRebindRfid() {
    startTransition(async () => {
      const r = await actions.rebindRfid(member.id, clubSlug, rfidDraft);
      if ("error" in r) toast.error(r.error);
      else {
        toast.success(t("admin.memberDetail.rfidRebound"));
        setRebindOpen(false);
        setRfidDraft(null);
      }
    });
  }

  function handleUnbindRfid() {
    if (!window.confirm(t("admin.memberDetail.rfidUnbindConfirm"))) return;
    startTransition(async () => {
      const r = await actions.rebindRfid(member.id, clubSlug, null);
      if ("error" in r) toast.error(r.error);
      else toast.success(t("admin.memberDetail.rfidUnbound"));
    });
  }

  function handleVerify() {
    startTransition(async () => {
      const r = await actions.markVerified(member.id, clubSlug);
      if ("error" in r) toast.error(r.error);
      else toast.success(t("admin.memberDetail.verified"));
    });
  }

  function handleRevoke() {
    if (!window.confirm(t("admin.memberDetail.revokeConfirm"))) return;
    startTransition(async () => {
      const r = await actions.revokeVerification(member.id, clubSlug);
      if ("error" in r) toast.error(r.error);
      else toast.success(t("admin.memberDetail.revoked"));
    });
  }

  return (
    <div className="px-4 py-4 bg-gray-50 space-y-5">
      {/* Identity */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {t("admin.memberDetail.identitySection")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              {t("ops.memberForm.firstNameLabel")}
            </span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              {t("ops.memberForm.lastNameLabel")}
            </span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              {t("ops.memberForm.dobLabel")}
            </span>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={todayIso}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </label>
          <div>
            <span className="text-xs font-medium text-gray-500 block mb-1">
              {t("ops.memberForm.residencyLabel")}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResidency("local")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                  residency === "local"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                {t("ops.memberForm.residencyLocal")}
              </button>
              <button
                type="button"
                onClick={() => setResidency("tourist")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                  residency === "tourist"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                {t("ops.memberForm.residencyTourist")}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              {residency === "tourist"
                ? t("ops.memberForm.idNumberLabelTourist")
                : t("ops.memberForm.idNumberLabelLocal")}
            </span>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              {t("ops.memberForm.phoneLabel")}
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
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
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </label>

        {allowMarketingChannel && (
          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              {t("admin.memberDetail.marketingChannelLabel")}
            </span>
            <input
              type="text"
              value={marketingChannel}
              onChange={(e) => setMarketingChannel(e.target.value)}
              placeholder={t("admin.memberDetail.marketingChannelPlaceholder")}
              list={`mc-${member.id}`}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
            <datalist id={`mc-${member.id}`}>
              {knownMarketingChannels.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <p className="mt-1 text-[10px] text-gray-400">
              {t("admin.memberDetail.marketingChannelHint")}
            </p>
          </label>
        )}

        <button
          type="button"
          onClick={handleSaveIdentity}
          disabled={isPending || !firstName.trim() || !lastName.trim()}
          className="rounded-lg bg-gray-800 text-white text-xs font-semibold px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
        >
          {t("admin.memberDetail.saveIdentity")}
        </button>
      </section>

      {/* Photos + signature */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {t("admin.memberDetail.mediaSection")}
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <ThumbnailCard
            label={t("ops.memberForm.portraitLabel")}
            url={member.photo_url}
            onReplace={() => setReplaceTarget("portrait")}
            replaceLabel={t("admin.memberDetail.replace")}
            t={t}
          />
          <ThumbnailCard
            label={t("ops.memberForm.idPhotoRequiredLabel")}
            url={member.id_photo_url}
            onReplace={() => setReplaceTarget("idphoto")}
            replaceLabel={t("admin.memberDetail.replace")}
            t={t}
          />
          <ThumbnailCard
            label={t("ops.memberForm.signatureLabel")}
            url={member.signature_url}
            onReplace={() => setReplaceTarget("signature")}
            replaceLabel={t("admin.memberDetail.replace")}
            t={t}
            aspectClass="aspect-[4/3]"
          />
        </div>

        {replaceTarget === "portrait" && (
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
            <PhotoCapture
              label={t("ops.memberForm.portraitLabel")}
              facingMode="user"
              value={portraitFile}
              onChange={setPortraitFile}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReplacePortrait}
                disabled={isPending || !portraitFile}
                className="flex-1 rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 disabled:opacity-50"
              >
                {t("admin.memberDetail.uploadReplacement")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortraitFile(null);
                  setReplaceTarget(null);
                }}
                className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 px-4 py-2"
              >
                {t("admin.memberDetail.cancel")}
              </button>
            </div>
          </div>
        )}

        {replaceTarget === "idphoto" && (
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
            <PhotoCapture
              label={t("ops.memberForm.idPhotoRequiredLabel")}
              facingMode="environment"
              value={idPhotoFile}
              onChange={setIdPhotoFile}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReplaceIdPhoto}
                disabled={isPending || !idPhotoFile}
                className="flex-1 rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 disabled:opacity-50"
              >
                {t("admin.memberDetail.uploadReplacement")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdPhotoFile(null);
                  setReplaceTarget(null);
                }}
                className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 px-4 py-2"
              >
                {t("admin.memberDetail.cancel")}
              </button>
            </div>
          </div>
        )}

        {replaceTarget === "signature" && (
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
            <SignaturePanel
              label={t("ops.memberForm.signatureLabel")}
              value={signatureFile}
              onChange={setSignatureFile}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReplaceSignature}
                disabled={isPending || !signatureFile}
                className="flex-1 rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 disabled:opacity-50"
              >
                {t("admin.memberDetail.uploadReplacement")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSignatureFile(null);
                  setReplaceTarget(null);
                }}
                className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 px-4 py-2"
              >
                {t("admin.memberDetail.cancel")}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* RFID */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {t("admin.memberDetail.rfidSection")}
        </h3>
        {rebindOpen ? (
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
            <RfidCapture
              label={t("ops.memberForm.rfidLabel")}
              value={rfidDraft}
              onChange={setRfidDraft}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRebindRfid}
                disabled={isPending || !rfidDraft}
                className="flex-1 rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 disabled:opacity-50"
              >
                {t("admin.memberDetail.saveRfid")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRebindOpen(false);
                  setRfidDraft(null);
                }}
                className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 px-4 py-2"
              >
                {t("admin.memberDetail.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <span
              className={`font-mono text-sm flex-1 ${
                member.rfid_uid ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {member.rfid_uid ?? t("admin.memberDetail.rfidNone")}
            </span>
            <button
              type="button"
              onClick={() => setRebindOpen(true)}
              disabled={isPending}
              className="text-xs text-blue-600 hover:underline"
            >
              {member.rfid_uid
                ? t("admin.memberDetail.rebind")
                : t("admin.memberDetail.bindNew")}
            </button>
            {member.rfid_uid && (
              <button
                type="button"
                onClick={handleUnbindRfid}
                disabled={isPending}
                className="text-xs text-red-600 hover:underline"
              >
                {t("admin.memberDetail.unbind")}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Verification */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {t("admin.memberDetail.verificationSection")}
        </h3>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
          {member.id_verified_at ? (
            <>
              <span className="text-xs rounded-full px-2 py-0.5 bg-green-100 text-green-700 font-semibold">
                {t("ops.entry.verified")}
              </span>
              <span className="text-xs text-gray-500 flex-1">
                {formatDate(member.id_verified_at)}
              </span>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={isPending}
                className="text-xs text-red-600 hover:underline"
              >
                {t("admin.memberDetail.revoke")}
              </button>
            </>
          ) : (
            <>
              <span className="text-xs rounded-full px-2 py-0.5 bg-amber-100 text-amber-800">
                {t("ops.entry.notVerified")}
              </span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={handleVerify}
                disabled={isPending || !member.date_of_birth}
                title={
                  !member.date_of_birth
                    ? t("ops.memberForm.dobRequired")
                    : undefined
                }
                className="text-xs rounded-lg bg-gray-800 text-white px-3 py-1 font-semibold disabled:opacity-50"
              >
                {t("admin.memberDetail.markVerified")}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ThumbnailCard({
  label,
  url,
  onReplace,
  replaceLabel,
  t,
  aspectClass = "aspect-[4/3]",
}: {
  label: string;
  url: string | null;
  onReplace: () => void;
  replaceLabel: string;
  t: (key: string) => string;
  aspectClass?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col">
      <div className="p-2 text-[11px] font-medium text-gray-500">{label}</div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`block ${aspectClass} bg-gray-100 overflow-hidden`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full h-full object-cover" />
        </a>
      ) : (
        <div
          className={`${aspectClass} bg-gray-100 flex items-center justify-center text-[11px] text-gray-400`}
        >
          {t("admin.memberDetail.noFile")}
        </div>
      )}
      <button
        type="button"
        onClick={onReplace}
        className="py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 border-t border-gray-100"
      >
        {replaceLabel}
      </button>
    </div>
  );
}
