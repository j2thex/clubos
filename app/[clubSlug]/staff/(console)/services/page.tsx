import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffFromCookie } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StaffServiceClient } from "../../services/staff-service-client";

export default async function StaffServicesPage({
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

  const { data: services } = await supabase
    .from("services")
    .select("id, title")
    .eq("club_id", club.id)
    .eq("active", true)
    .order("display_order", { ascending: true });

  const serviceList = services ?? [];

  const { data: pendingOrders } = await supabase
    .from("service_orders")
    .select("service_id")
    .in("service_id", serviceList.length > 0 ? serviceList.map((s) => s.id) : ["__none__"])
    .eq("status", "pending");

  const pendingCounts = new Map<string, number>();
  for (const o of pendingOrders ?? []) {
    pendingCounts.set(o.service_id, (pendingCounts.get(o.service_id) ?? 0) + 1);
  }

  return serviceList.length > 0 ? (
    <StaffServiceClient
      services={serviceList.map((s) => ({
        id: s.id,
        title: s.title,
        pending_count: pendingCounts.get(s.id) ?? 0,
      }))}
      clubId={club.id}
      clubSlug={clubSlug}
      staffMemberId={session?.member_id ?? ""}
    />
  ) : (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-900">No services yet</p>
      <p className="text-xs text-gray-400 mt-1">Services will appear here once created by admin.</p>
    </div>
  );
}
