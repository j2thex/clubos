import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { LogViewer } from "../../log-viewer";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function AdminLogsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const locale = await getServerLocale();

  const { data: logs } = await supabase
    .from("activity_log")
    .select("id, action, target_member_code, details, created_at, staff_member_id")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false })
    .limit(200);

  // Get staff member codes/names for display
  const staffIds = [...new Set((logs ?? []).map((l) => l.staff_member_id).filter(Boolean))] as string[];
  const { data: staffMembers } = await supabase
    .from("members")
    .select("id, member_code, full_name")
    .in("id", staffIds.length > 0 ? staffIds : ["__none__"]);

  const staffMap = new Map(
    (staffMembers ?? []).map((m) => [m.id, { code: m.member_code, name: m.full_name }]),
  );

  const enrichedLogs = (logs ?? []).map((log) => {
    const staff = log.staff_member_id ? staffMap.get(log.staff_member_id) : null;
    return {
      id: log.id,
      action: log.action,
      target_member_code: log.target_member_code,
      details: log.details,
      created_at: log.created_at,
      staff_code: staff?.code ?? null,
      staff_name: staff?.name ?? null,
    };
  });

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t(locale, "admin.activityLog")}
      </h2>
      <LogViewer logs={enrichedLogs} />
    </div>
  );
}
