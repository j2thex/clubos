import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ServiceManager } from "../../service-manager";

export default async function ServicesPage({
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

  const [{ data: services }, { data: serviceOrders }] = await Promise.all([
    supabase
      .from("services")
      .select("id, title, description, image_url, link, price, display_order")
      .eq("club_id", club.id)
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase.from("service_orders").select("service_id, status"),
  ]);

  // Count pending/fulfilled orders per service
  const servicePendingCounts = new Map<string, number>();
  const serviceFulfilledCounts = new Map<string, number>();
  for (const o of serviceOrders ?? []) {
    if (o.status === "pending") {
      servicePendingCounts.set(
        o.service_id,
        (servicePendingCounts.get(o.service_id) ?? 0) + 1
      );
    } else if (o.status === "fulfilled") {
      serviceFulfilledCounts.set(
        o.service_id,
        (serviceFulfilledCounts.get(o.service_id) ?? 0) + 1
      );
    }
  }

  const serviceList = (services ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    image_url: s.image_url,
    link: s.link,
    price: s.price != null ? Number(s.price) : null,
    pending_orders: servicePendingCounts.get(s.id) ?? 0,
    fulfilled_orders: serviceFulfilledCounts.get(s.id) ?? 0,
  }));

  return (
    <div className="space-y-4">
      <Link
        href={`/${clubSlug}/admin/content`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Content
      </Link>
      <ServiceManager
        services={serviceList}
        clubId={club.id}
        clubSlug={clubSlug}
      />
    </div>
  );
}
