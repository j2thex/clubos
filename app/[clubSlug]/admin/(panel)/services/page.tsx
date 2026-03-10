import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
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
    <ServiceManager
      services={serviceList}
      clubId={club.id}
      clubSlug={clubSlug}
    />
  );
}
