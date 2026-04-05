import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffFromCookie } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StaffPreregClient } from "../../preregistrations/staff-prereg-client";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function StaffPreregistrationsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const session = await getStaffFromCookie();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, preregistration_enabled")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const locale = await getServerLocale();

  if (!club.preregistration_enabled) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900">{t(locale, "staff.noPreregs")}</p>
        <p className="text-xs text-gray-400 mt-1">{t(locale, "staff.preregsDesc")}</p>
      </div>
    );
  }

  const { data: preregistrations } = await supabase
    .from("preregistrations")
    .select("id, email, visit_date, num_visitors, status, created_at")
    .eq("club_id", club.id)
    .order("visit_date", { ascending: true })
    .limit(100);

  return (
    <StaffPreregClient
      initialPreregistrations={(preregistrations ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        visit_date: p.visit_date,
        num_visitors: p.num_visitors,
        status: p.status,
        created_at: p.created_at,
      }))}
      clubSlug={clubSlug}
      staffMemberId={session?.member_id ?? ""}
    />
  );
}
