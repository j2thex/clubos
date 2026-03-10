"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";

export async function getServiceOrders(
  serviceId: string,
  clubId: string,
): Promise<
  | { error: string }
  | {
      ok: true;
      orders: {
        id: string;
        status: string;
        created_at: string;
        fulfilled_at: string | null;
        member_code: string;
        member_name: string;
        fulfilled_by_name: string | null;
      }[];
    }
> {
  const supabase = createAdminClient();

  // Verify service belongs to club
  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("club_id", clubId)
    .single();

  if (!service) return { error: "Service not found" };

  const { data: orders, error } = await supabase
    .from("service_orders")
    .select("id, status, created_at, fulfilled_at, member_id, fulfilled_by")
    .eq("service_id", serviceId)
    .order("created_at", { ascending: false });

  if (error) return { error: "Failed to load orders" };

  // Fetch member info for all orders
  const memberIds = [
    ...new Set([
      ...(orders ?? []).map((o) => o.member_id),
      ...(orders ?? []).filter((o) => o.fulfilled_by).map((o) => o.fulfilled_by!),
    ]),
  ];

  const { data: members } = await supabase
    .from("members")
    .select("id, member_code, full_name")
    .in("id", memberIds.length > 0 ? memberIds : ["__none__"]);

  const memberMap = new Map(
    (members ?? []).map((m) => [m.id, { code: m.member_code, name: m.full_name }]),
  );

  return {
    ok: true,
    orders: (orders ?? []).map((o) => ({
      id: o.id,
      status: o.status,
      created_at: o.created_at,
      fulfilled_at: o.fulfilled_at,
      member_code: memberMap.get(o.member_id)?.code ?? "???",
      member_name: memberMap.get(o.member_id)?.name ?? "Unknown",
      fulfilled_by_name: o.fulfilled_by
        ? memberMap.get(o.fulfilled_by)?.name ?? "Unknown"
        : null,
    })),
  };
}

export async function fulfillOrder(
  orderId: string,
  staffMemberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Get order details for logging before updating
  const { data: order } = await supabase
    .from("service_orders")
    .select("member_id, service_id")
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("service_orders")
    .update({
      status: "fulfilled",
      fulfilled_by: staffMemberId,
      fulfilled_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending");

  if (error) return { error: "Failed to fulfill order" };

  if (order) {
    const [{ data: memberForLog }, { data: service }] = await Promise.all([
      supabase.from("members").select("member_code, club_id").eq("id", order.member_id).single(),
      supabase.from("services").select("title").eq("id", order.service_id).single(),
    ]);

    await logActivity({
      clubId: memberForLog?.club_id ?? "",
      staffMemberId,
      action: "order_fulfilled",
      targetMemberCode: memberForLog?.member_code,
      details: service?.title,
    });
  }

  revalidatePath(`/${clubSlug}/staff/services`);
  return { ok: true };
}

export async function addWalkinOrder(
  memberCode: string,
  serviceId: string,
  clubId: string,
  staffMemberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const code = memberCode.trim().toUpperCase();
  if (!code || code.length < 3 || code.length > 6) return { error: "Invalid member code" };
  if (!/^[A-Z0-9]+$/.test(code)) return { error: "Invalid member code" };

  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("club_id", clubId)
    .eq("member_code", code)
    .eq("status", "active")
    .single();

  if (!member) return { error: "Member not found" };

  const { error } = await supabase.from("service_orders").insert({
    service_id: serviceId,
    member_id: member.id,
    status: "fulfilled",
    fulfilled_by: staffMemberId,
    fulfilled_at: new Date().toISOString(),
  });

  if (error) return { error: "Failed to add order" };

  const { data: service } = await supabase
    .from("services")
    .select("title")
    .eq("id", serviceId)
    .single();

  await logActivity({
    clubId,
    staffMemberId,
    action: "walkin_order",
    targetMemberCode: code,
    details: service?.title,
  });

  revalidatePath(`/${clubSlug}/staff/services`);
  return { ok: true };
}
