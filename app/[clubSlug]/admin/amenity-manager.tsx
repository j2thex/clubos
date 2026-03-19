"use client";

import { useState, useTransition } from "react";
import { toggleAmenity, updateAmenityOptions, addCustomAmenity } from "./actions";
import { DynamicIcon } from "@/components/dynamic-icon";

const SUBTYPES = ["activity", "experience", "service", "product"] as const;
type Subtype = (typeof SUBTYPES)[number];

const SUBTYPE_LABELS: Record<Subtype, string> = {
  activity: "Activity",
  experience: "Experience",
  service: "Service",
  product: "Product",
};

interface CatalogAmenity {
  id: string;
  name: string;
  name_es: string | null;
  subtype: string;
  icon: string | null;
}

interface ClubAmenity {
  id: string;
  amenity_id: string;
  orderable: boolean;
  price: number | null;
}

export function AmenityManager({
  catalog,
  clubAmenities,
  clubId,
  clubSlug,
}: {
  catalog: CatalogAmenity[];
  clubAmenities: ClubAmenity[];
  clubId: string;
  clubSlug: string;
}) {
  const [activeTab, setActiveTab] = useState<Subtype>("activity");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Custom amenity form state
  const [customName, setCustomName] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Build a lookup of enabled amenities
  const enabledMap = new Map<string, ClubAmenity>();
  for (const ca of clubAmenities) {
    enabledMap.set(ca.amenity_id, ca);
  }

  const enabledCount = clubAmenities.length;

  const filteredCatalog = catalog.filter((a) => a.subtype === activeTab);

  function handleToggle(amenityId: string, enabled: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleAmenity(clubId, amenityId, enabled, clubSlug);
      if ("error" in result) setError(result.error);
    });
  }

  function handleUpdateOptions(
    clubAmenityId: string,
    orderable: boolean,
    price: string,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await updateAmenityOptions(clubAmenityId, orderable, price, clubSlug);
      if ("error" in result) setError(result.error);
    });
  }

  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addCustomAmenity(clubId, customName, activeTab, clubSlug);
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
          Amenities ({enabledCount})
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
          </div>
        </div>

        {/* Amenity list */}
        <div className="divide-y divide-gray-100">
          {filteredCatalog.length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-gray-400">
              No {SUBTYPE_LABELS[activeTab].toLowerCase()} amenities in the catalog yet.
            </div>
          )}
          {filteredCatalog.map((amenity) => {
            const clubAmenity = enabledMap.get(amenity.id);
            const isEnabled = !!clubAmenity;

            return (
              <AmenityRow
                key={amenity.id}
                amenity={amenity}
                clubAmenity={clubAmenity ?? null}
                isEnabled={isEnabled}
                isPending={isPending}
                onToggle={handleToggle}
                onUpdateOptions={handleUpdateOptions}
              />
            );
          })}
        </div>

        {/* Add Other button / form */}
        <div className="border-t border-gray-100">
          {showCustomForm ? (
            <form onSubmit={handleAddCustom} className="px-5 py-3 flex items-center gap-2 bg-gray-50">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`Custom ${SUBTYPE_LABELS[activeTab].toLowerCase()} name`}
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
/* Individual amenity row                                             */
/* ------------------------------------------------------------------ */

function AmenityRow({
  amenity,
  clubAmenity,
  isEnabled,
  isPending,
  onToggle,
  onUpdateOptions,
}: {
  amenity: CatalogAmenity;
  clubAmenity: ClubAmenity | null;
  isEnabled: boolean;
  isPending: boolean;
  onToggle: (amenityId: string, enabled: boolean) => void;
  onUpdateOptions: (clubAmenityId: string, orderable: boolean, price: string) => void;
}) {
  const [localOrderable, setLocalOrderable] = useState(clubAmenity?.orderable ?? false);
  const [localPrice, setLocalPrice] = useState(
    clubAmenity?.price != null ? String(clubAmenity.price) : "",
  );

  // Track whether options have been changed from server values
  const serverOrderable = clubAmenity?.orderable ?? false;
  const serverPrice = clubAmenity?.price != null ? String(clubAmenity.price) : "";
  const optionsDirty = isEnabled && (localOrderable !== serverOrderable || localPrice !== serverPrice);

  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          {amenity.icon ? (
            <DynamicIcon name={amenity.icon} className="w-4 h-4 text-gray-500" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gray-300" />
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{amenity.name}</p>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          disabled={isPending}
          onClick={() => onToggle(amenity.id, !isEnabled)}
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

      {/* Expanded options when enabled */}
      {isEnabled && clubAmenity && (
        <div className="mt-2 ml-11 flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={localOrderable}
              onChange={(e) => setLocalOrderable(e.target.checked)}
              className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <span className="text-xs text-gray-600">Orderable</span>
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

          {optionsDirty && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onUpdateOptions(clubAmenity.id, localOrderable, localPrice)}
              className="rounded-lg bg-gray-800 text-white px-3 py-1 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          )}
        </div>
      )}
    </div>
  );
}
