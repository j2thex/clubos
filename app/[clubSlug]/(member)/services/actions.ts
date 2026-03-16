"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyStaff } from "@/lib/staff-notify";

export async function requestService(
  serviceId: string,
  memberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Check for existing pending order
  const { data: existing } = await supabase
    .from("service_orders")
    .select("id")
    .eq("service_id", serviceId)
    .eq("member_id", memberId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return { error: "Already requested" };

  const { error } = await supabase.from("service_orders").insert({
    service_id: serviceId,
    member_id: memberId,
  });

  if (error) return { error: "Failed to request service" };

  // Notify staff via Telegram
  const [{ data: service }, { data: member }] = await Promise.all([
    supabase.from("services").select("title, club_id").eq("id", serviceId).single(),
    supabase.from("members").select("member_code").eq("id", memberId).single(),
  ]);

  if (service) {
    notifyStaff(
      service.club_id,
      `🛎 Service request\n<b>${service.title}</b>\nMember: ${member?.member_code ?? "Unknown"}`,
    );
  }

  revalidatePath(`/${clubSlug}/services`);
  return { ok: true };
}

export async function cancelServiceRequest(
  orderId: string,
  memberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("service_orders")
    .delete()
    .eq("id", orderId)
    .eq("member_id", memberId)
    .eq("status", "pending");

  if (error) return { error: "Failed to cancel request" };

  revalidatePath(`/${clubSlug}/services`);
  return { ok: true };
}
