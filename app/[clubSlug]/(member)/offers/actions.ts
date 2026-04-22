"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyStaff } from "@/lib/staff-notify";

export async function requestOffer(
  clubOfferId: string,
  memberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Check if already has pending order
  const { data: existing } = await supabase
    .from("offer_orders")
    .select("id")
    .eq("club_offer_id", clubOfferId)
    .eq("member_id", memberId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return { error: "Already requested" };

  const { error } = await supabase.from("offer_orders").insert({
    club_offer_id: clubOfferId,
    member_id: memberId,
  });

  if (error) return { error: "Failed to submit request" };

  // Get offer name and member code for notification
  const { data: info } = await supabase
    .from("club_offers")
    .select("offer_catalog(name), clubs(id, name)")
    .eq("id", clubOfferId)
    .single();

  const { data: member } = await supabase
    .from("members")
    .select("member_code, club_id")
    .eq("id", memberId)
    .single();

  if (member && info) {
    const catalogInfo = Array.isArray(info.offer_catalog) ? info.offer_catalog[0] : info.offer_catalog;
    await notifyStaff(
      member.club_id,
      `\u{1F6CE} Offer request\n<b>${catalogInfo?.name ?? "Unknown"}</b>\nMember: ${member.member_code}`,
    );
  }

  revalidatePath(`/${clubSlug}/offers`);
  revalidatePath(`/${clubSlug}/staff`, "layout");
  return { ok: true };
}

export async function cancelOfferRequest(
  orderId: string,
  memberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("offer_orders")
    .delete()
    .eq("id", orderId)
    .eq("member_id", memberId)
    .eq("status", "pending");

  if (error) return { error: "Failed to cancel request" };

  revalidatePath(`/${clubSlug}/offers`);
  revalidatePath(`/${clubSlug}/staff`, "layout");
  return { ok: true };
}
