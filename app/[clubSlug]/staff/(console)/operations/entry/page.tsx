import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { requireOpsAccess } from "@/lib/auth";
import { NoAccessCard } from "@/components/club/no-access-card";
import { EntryClient } from "./entry-client";

export default async function StaffOperationsEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ memberCode?: string }>;
}) {
  const { clubSlug } = await params;
  const { memberCode: initialMemberCode } = await searchParams;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const locale = await getServerLocale();

  try {
    await requireOpsAccess(club.id, "entry");
  } catch {
    return <NoAccessCard permission="entry" clubSlug={clubSlug} locale={locale} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <a
            href={`/${clubSlug}/staff/operations`}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
            aria-label={t(locale, "common.back")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t(locale, "common.back")}</span>
          </a>
          <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {t(locale, "ops.entryTitle")}
          </h1>
        </div>
        <a
          href={`/${clubSlug}/staff/operations/capacity`}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          {t(locale, "ops.capacityLink")} →
        </a>
      </div>
      <EntryClient
        clubId={club.id}
        clubSlug={clubSlug}
        initialMemberCode={initialMemberCode ?? null}
      />
    </div>
  );
}
