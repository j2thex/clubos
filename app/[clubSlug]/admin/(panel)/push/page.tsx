import { createAdminClient } from "@/lib/supabase/admin";
import { PushForm } from "./push-form";

export default async function PushPage({
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

  const today = new Date().toISOString().slice(0, 10);
  const { data: eventRows } = club
    ? await supabase
        .from("events")
        .select("id, title, date")
        .eq("club_id", club.id)
        .eq("active", true)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(20)
    : { data: [] as { id: string; title: string; date: string }[] };

  const events = (eventRows ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
  }));

  return (
    <div className="p-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Push notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Send a test notification to all members who have subscribed on this club.
        </p>
      </div>
      <PushForm clubSlug={clubSlug} events={events} />
    </div>
  );
}
