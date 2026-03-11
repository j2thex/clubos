import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffFromCookie } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StaffEventClient } from "../../events/staff-event-client";

export default async function StaffEventsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();
  const session = await getStaffFromCookie();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, reward_spins")
    .eq("club_id", club.id)
    .eq("active", true)
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true });

  return events && events.length > 0 ? (
    <StaffEventClient
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        reward_spins: e.reward_spins,
      }))}
      clubId={club.id}
      clubSlug={clubSlug}
      staffMemberId={session?.member_id ?? ""}
    />
  ) : (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-900">No events yet</p>
      <p className="text-xs text-gray-400 mt-1">Events will appear here once created by admin.</p>
    </div>
  );
}
