"use client";

import { useState, useTransition } from "react";
import { TagPicker } from "@/components/tag-picker";
import { updateClubTags } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

export function TagManager({
  tags,
  clubId,
  clubSlug,
}: {
  tags: string[];
  clubId: string;
  clubSlug: string;
}) {
  const [localTags, setLocalTags] = useState(tags);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const { t, locale } = useLanguage();

  const isDirty = JSON.stringify(localTags) !== JSON.stringify(tags);

  function handleSave() {
    setSaveStatus(null);
    startTransition(async () => {
      const result = await updateClubTags(clubId, localTags, clubSlug);
      if ("error" in result) {
        setSaveStatus(result.error);
      } else {
        setSaveStatus("Saved!");
        setTimeout(() => setSaveStatus(null), 2000);
      }
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t("admin.clubTags")}
      </h2>
      <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
        <p className="text-xs text-gray-400">{t("admin.clubTagsDesc")}</p>
        <TagPicker value={localTags} onChange={setLocalTags} locale={locale} />
        {isDirty && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isPending ? t("common.loading") : t("common.save")}
            </button>
            {saveStatus && (
              <span className={`text-xs ${saveStatus === "Saved!" ? "text-green-600" : "text-red-600"}`}>
                {saveStatus}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
