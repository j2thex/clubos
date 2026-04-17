import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { requireStaffPermission } from "@/lib/auth";
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
    await requireStaffPermission(club.id, "entry");
  } catch {
    return <NoAccessCard permission="entry" clubSlug={clubSlug} locale={locale} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t(locale, "ops.entryTitle")}
        </h1>
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
