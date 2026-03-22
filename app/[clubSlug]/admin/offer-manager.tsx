"use client";

import { useState, useTransition } from "react";
import { toggleOffer, updateOfferOptions, addCustomOffer, archiveOffer, restoreOffer } from "./actions";
import { DynamicIcon } from "@/components/dynamic-icon";
import { IconPicker } from "@/components/icon-picker";
import { LanguageTabs } from "@/components/language-tabs";
import { useLanguage } from "@/lib/i18n/provider";

const SUBTYPES = ["activity", "experience", "service", "product"] as const;
type Subtype = (typeof SUBTYPES)[number];

const SUBTYPE_LABELS: Record<Subtype, string> = {
  activity: "Activity",
  experience: "Experience",
  service: "Service",
  product: "Product",
};

interface CatalogOffer {
  id: string;
  name: string;
  name_es: string | null;
  subtype: string;
  icon: string | null;
}

interface ClubOffer {
  id: string;
  offer_id: string;
  orderable: boolean;
  price: number | null;
  description: string | null;
  description_es: string | null;
  image_url: string | null;
  icon: string | null;
  is_public: boolean;
  archived: boolean;
}

export function OfferManager({
  catalog,
  clubOffers,
  clubId,
  clubSlug,
}: {
  catalog: CatalogOffer[];
  clubOffers: ClubOffer[];
  clubId: string;
  clubSlug: string;
}) {
  const [activeTab, setActiveTab] = useState<Subtype | "archived">("activity");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const { t } = useLanguage();

  // Custom offer form state
  const [customName, setCustomName] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Build a lookup of enabled offers (excluding archived)
  const activeEnabledMap = new Map<string, ClubOffer>();
  for (const ca of clubOffers) {
    if (!ca.archived) {
      activeEnabledMap.set(ca.offer_id, ca);
    }
  }

  const enabledCount = clubOffers.filter(co => !co.archived).length;
  const archivedOffers = clubOffers.filter(co => co.archived);
  const isArchivedTab = activeTab === "archived";

  const filteredCatalog = isArchivedTab ? [] : catalog.filter((a) => a.subtype === activeTab);

  function handleToggle(offerId: string, enabled: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleOffer(clubId, offerId, enabled, clubSlug);
      if ("error" in result) setError(result.error);
    });
  }

  function handleUpdateOptions(clubOfferId: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateOfferOptions(clubOfferId, formData, clubSlug);
      if ("error" in result) setError(result.error);
    });
  }

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addCustomOffer(clubId, customName, activeTab as Subtype, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        setCustomName("");
        setShowCustomForm(false);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Offers ({enabledCount})
        </h2>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Subtype tabs */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
            {SUBTYPES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setActiveTab(st);
                  setShowCustomForm(false);
                  setError(null);
                  setExpandedOfferId(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === st
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {SUBTYPE_LABELS[st]}
              </button>
            ))}
            {archivedOffers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("archived");
                  setShowCustomForm(false);
                  setError(null);
                  setExpandedOfferId(null);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  isArchivedTab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("admin.archivedTab")} ({archivedOffers.length})
              </button>
            )}
          </div>
        </div>

        {/* Offer list */}
        <div className="divide-y divide-gray-100">
          {isArchivedTab ? (
            archivedOffers.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-gray-400">
                {t("admin.noArchivedOffers")}
              </div>
            ) : (
              archivedOffers.map((co) => {
                const catalogOffer = catalog.find((c) => c.id === co.offer_id);
                return (
                  <div key={co.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      {(co.icon || catalogOffer?.icon) ? (
                        <DynamicIcon name={(co.icon || catalogOffer?.icon)!} className="w-4 h-4 text-gray-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        {catalogOffer?.name ?? "Unknown offer"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {catalogOffer?.subtype ? SUBTYPE_LABELS[catalogOffer.subtype as Subtype] ?? catalogOffer.subtype : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await restoreOffer(co.id, clubSlug);
                          if ("error" in result) setError(result.error);
                        });
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                );
              })
            )
          ) : (
            <>
              {filteredCatalog.length === 0 && (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                  No {SUBTYPE_LABELS[activeTab as Subtype].toLowerCase()} offers in the catalog yet.
                </div>
              )}
              {filteredCatalog.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  clubOffer={activeEnabledMap.get(offer.id) ?? null}
                  isEnabled={!!activeEnabledMap.get(offer.id)}
                  isExpanded={expandedOfferId === offer.id}
                  isPending={isPending}
                  onToggle={handleToggle}
                  onUpdateOptions={handleUpdateOptions}
                  onToggleExpand={(id) => setExpandedOfferId(id === expandedOfferId ? null : id)}
                  onArchive={(clubOfferId) => {
                    startTransition(async () => {
                      const result = await archiveOffer(clubOfferId, clubSlug);
                      if ("error" in result) setError(result.error);
                      setExpandedOfferId(null);
                    });
                  }}
                  t={t}
                />
              ))}
            </>
          )}
        </div>

        {/* Add Other button / form — hidden on archived tab */}
        {!isArchivedTab && (
          <div className="border-t border-gray-100">
            {showCustomForm ? (
              <form onSubmit={handleAddCustom} className="px-5 py-3 flex items-center gap-2 bg-gray-50">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={`Custom ${SUBTYPE_LABELS[activeTab as Subtype].toLowerCase()} name`}
                  required
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
                <button
                  type="submit"
                  disabled={isPending || !customName.trim()}
                  className="rounded-lg bg-gray-800 text-white px-4 py-1.5 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomForm(false);
                    setCustomName("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="w-full px-5 py-3 flex items-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Other
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Individual offer row                                             */
/* ------------------------------------------------------------------ */

function OfferRow({
  offer,
  clubOffer,
  isEnabled,
  isExpanded,
  isPending,
  onToggle,
  onUpdateOptions,
  onToggleExpand,
  onArchive,
  t,
}: {
  offer: CatalogOffer;
  clubOffer: ClubOffer | null;
  isEnabled: boolean;
  isExpanded: boolean;
  isPending: boolean;
  onToggle: (offerId: string, enabled: boolean) => void;
  onUpdateOptions: (clubOfferId: string, formData: FormData) => void;
  onToggleExpand: (offerId: string) => void;
  onArchive: (clubOfferId: string) => void;
  t: (key: string) => string;
}) {
  const [localOrderable, setLocalOrderable] = useState(clubOffer?.orderable ?? false);
  const [localPrice, setLocalPrice] = useState(
    clubOffer?.price != null ? String(clubOffer.price) : "",
  );
  const [localDescription, setLocalDescription] = useState(clubOffer?.description ?? "");
  const [localDescriptionEs, setLocalDescriptionEs] = useState(clubOffer?.description_es ?? "");
  const [localIcon, setLocalIcon] = useState<string | null>(clubOffer?.icon ?? null);
  const [localImage, setLocalImage] = useState<File | null>(null);
  const [localIsPublic, setLocalIsPublic] = useState(clubOffer?.is_public ?? false);
  const [descLang, setDescLang] = useState<"en" | "es">("en");

  // Track whether options have been changed from server values
  const serverOrderable = clubOffer?.orderable ?? false;
  const serverPrice = clubOffer?.price != null ? String(clubOffer.price) : "";
  const serverDescription = clubOffer?.description ?? "";
  const serverDescriptionEs = clubOffer?.description_es ?? "";
  const serverIcon = clubOffer?.icon ?? null;
  const serverIsPublic = clubOffer?.is_public ?? false;
  const optionsDirty =
    isEnabled &&
    (localOrderable !== serverOrderable ||
      localPrice !== serverPrice ||
      localDescription !== serverDescription ||
      localDescriptionEs !== serverDescriptionEs ||
      localIcon !== serverIcon ||
      localIsPublic !== serverIsPublic ||
      localImage !== null);

  function handleSave() {
    if (!clubOffer) return;
    const fd = new FormData();
    fd.set("orderable", localOrderable ? "1" : "0");
    fd.set("price", localPrice);
    fd.set("description", localDescription);
    fd.set("description_es", localDescriptionEs);
    fd.set("icon", localIcon ?? "");
    fd.set("is_public", localIsPublic ? "1" : "0");
    if (localImage) fd.set("image", localImage);
    onUpdateOptions(clubOffer.id, fd);
    setLocalImage(null);
    onToggleExpand(offer.id); // collapse after save
  }

  return (
    <div className="px-5 py-3">
      {/* Icon + Name + Toggle row */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          {(localIcon || offer.icon) ? (
            <DynamicIcon name={localIcon || offer.icon!} className="w-4 h-4 text-gray-500" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-300" />
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{offer.name}</p>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          disabled={isPending}
          onClick={() => onToggle(offer.id, !isEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 ${
            isEnabled ? "bg-gray-800" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Collapsed state: status badges + Edit button */}
      {isEnabled && clubOffer && !isExpanded && (
        <div className="mt-2 ml-11 flex items-center gap-1.5 flex-wrap">
          {clubOffer.orderable && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
              {t("offers.orderable")}
            </span>
          )}
          {clubOffer.is_public && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-600">
              {t("offers.public")}
            </span>
          )}
          {clubOffer.price != null && clubOffer.price > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              ${clubOffer.price}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => onArchive(clubOffer!.id)}
              disabled={isPending}
              className="text-[10px] font-medium text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors"
            >
              {t("admin.archiveOffer")}
            </button>
            <button
              type="button"
              onClick={() => onToggleExpand(offer.id)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t("admin.editOffer")}
            </button>
          </div>
        </div>
      )}

      {/* Expanded state: full config form */}
      {isEnabled && clubOffer && isExpanded && (
        <div className="mt-2 ml-11 space-y-3">
          {/* Orderable + Public row */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={localOrderable}
                onChange={(e) => setLocalOrderable(e.target.checked)}
                className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
              />
              <span className="text-xs text-gray-600">Orderable</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={localIsPublic}
                onChange={(e) => setLocalIsPublic(e.target.checked)}
                className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
              />
              <span className="text-xs text-gray-600">Show on public profile</span>
            </label>

            {localOrderable && (
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={localPrice}
                  onChange={(e) => setLocalPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-900 text-center placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
            )}
          </div>

          {/* Description with language tabs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Description</label>
              <LanguageTabs value={descLang} onChange={setDescLang} />
            </div>
            {descLang === "en" ? (
              <textarea
                rows={2}
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                placeholder="Short description (optional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
              />
            ) : (
              <textarea
                rows={2}
                value={localDescriptionEs}
                onChange={(e) => setLocalDescriptionEs(e.target.value)}
                placeholder="Descripción breve (opcional)"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
              />
            )}
          </div>

          {/* Icon picker */}
          <IconPicker value={localIcon} onChange={setLocalIcon} />

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Image</label>
            <div className="flex items-center gap-2">
              {(localImage || clubOffer.image_url) && (
                <img
                  src={localImage ? URL.createObjectURL(localImage) : clubOffer.image_url!}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLocalImage(e.target.files?.[0] ?? null)}
                className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {optionsDirty && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="rounded-lg bg-gray-800 text-white px-3 py-1 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            )}
            <button
              type="button"
              onClick={() => onToggleExpand(offer.id)}
              className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onArchive(clubOffer.id)}
              disabled={isPending}
              className="ml-auto rounded-lg border border-red-200 text-red-500 px-3 py-1 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Archive
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
