import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { requireOpsAccess } from "@/lib/auth";
import { CheckoutButton } from "@/app/[clubSlug]/staff/(console)/operations/capacity/checkout-button";
import { CheckoutAllButton } from "@/app/[clubSlug]/staff/(console)/operations/capacity/checkout-all-button";

export const dynamic = "force-dynamic";

function formatDuration(fromIso: string): string {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(fromIso).getTime()) / 60000),
  );
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default async function AdminOperationsCapacityPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  await requireOpsAccess(club.id, "entry");

  const { data: openEntries } = await supabase
    .from("club_entries")
    .select(
      "id, checked_in_at, members!club_entries_member_id_fkey(id, member_code, full_name, date_of_birth)",
    )
    .eq("club_id", club.id)
    .is("checked_out_at", null)
    .order("checked_in_at", { ascending: false });

  const locale = await getServerLocale();
  const count = openEntries?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t(locale, "ops.capacityTitle")}
        </h1>
        <a
          href={`/${clubSlug}/admin/operations/entry`}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          ← {t(locale, "ops.entryLink")}
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-3">
        <div>
          <p className="text-4xl font-bold text-gray-900">{count}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
            {t(locale, "ops.inside")}
          </p>
        </div>
        {count > 0 && (
          <CheckoutAllButton clubId={club.id} clubSlug={clubSlug} count={count} />
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {count === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {t(locale, "ops.noOneInside")}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(openEntries ?? []).map((entry) => {
              const member = Array.isArray(entry.members)
                ? entry.members[0]
                : entry.members;
              if (!member) return null;
              return (
                <div
                  key={entry.id}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-sm text-gray-900">
                      {member.member_code}
                    </p>
                    {member.full_name && (
                      <p className="text-xs text-gray-500 truncate">
                        {member.full_name}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDuration(entry.checked_in_at)}{" "}
                      {t(locale, "ops.since")}
                    </p>
                  </div>
                  <CheckoutButton
                    entryId={entry.id}
                    memberCode={member.member_code}
                    clubSlug={clubSlug}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
