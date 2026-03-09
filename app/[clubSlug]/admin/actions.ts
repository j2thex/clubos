"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin, clearOwnerCookie } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logoutOwner(clubSlug: string) {
  await clearOwnerCookie();
  redirect(`/${clubSlug}/admin/login`);
}

export async function createMember(
  clubId: string,
  memberCode: string,
  clubSlug: string,
) {
  const code = memberCode.trim().toUpperCase();

  if (!code || code.length < 3 || code.length > 6) {
    return { error: "Member code must be 3-6 characters" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "Member code must be alphanumeric" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("members").insert({
    club_id: clubId,
    member_code: code,
    spin_balance: 0,
  });

  if (error) {
    if (error.code === "23505") return { error: "Member code already exists" };
    return { error: "Failed to create member" };
  }

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

export async function createStaffMember(
  clubId: string,
  memberCode: string,
  pin: string,
  clubSlug: string,
) {
  const code = memberCode.trim().toUpperCase();
  const trimmedPin = pin.trim();

  if (!code || code.length < 3 || code.length > 6) {
    return { error: "Staff code must be 3-6 characters" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "Staff code must be alphanumeric" };
  }
  if (!trimmedPin || trimmedPin.length !== 4 || !/^\d{4}$/.test(trimmedPin)) {
    return { error: "PIN must be exactly 4 digits" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("members").insert({
    club_id: clubId,
    member_code: code,
    pin_hash: hashPin(trimmedPin),
    spin_balance: 0,
    is_staff: true,
  });

  if (error) {
    if (error.code === "23505") return { error: "Code already exists" };
    return { error: "Failed to create staff member" };
  }

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

export async function addRole(clubId: string, name: string, clubSlug: string) {
  if (!name.trim()) return { error: "Role name is required" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("member_roles")
    .insert({ club_id: clubId, name: name.trim() });

  if (error) {
    if (error.code === "23505") return { error: "Role already exists" };
    return { error: "Failed to add role" };
  }

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

export async function deleteRole(roleId: string, clubSlug: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("member_roles")
    .delete()
    .eq("id", roleId);

  if (error) {
    return { error: "Failed to delete role" };
  }

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

// --- Wheel segment actions ---

export async function addSegment(
  clubId: string,
  label: string,
  color: string,
  labelColor: string,
  probability: number,
  clubSlug: string,
) {
  if (!label.trim()) return { error: "Label is required" };
  if (probability <= 0 || probability > 1) return { error: "Probability must be between 0 and 1" };

  const supabase = createAdminClient();

  // Get next display_order
  const { data: existing } = await supabase
    .from("wheel_configs")
    .select("display_order")
    .eq("club_id", clubId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const { error } = await supabase.from("wheel_configs").insert({
    club_id: clubId,
    label: label.trim(),
    reward_type: "prize",
    reward_value: 1,
    probability,
    color,
    label_color: labelColor,
    display_order: nextOrder,
  });

  if (error) return { error: "Failed to add segment" };

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

export async function updateSegment(
  segmentId: string,
  label: string,
  color: string,
  labelColor: string,
  probability: number,
  clubSlug: string,
) {
  if (!label.trim()) return { error: "Label is required" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("wheel_configs")
    .update({
      label: label.trim(),
      color,
      label_color: labelColor,
      probability,
    })
    .eq("id", segmentId);

  if (error) return { error: "Failed to update segment" };

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

export async function deleteSegment(segmentId: string, clubSlug: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("wheel_configs")
    .delete()
    .eq("id", segmentId);

  if (error) return { error: "Failed to delete segment" };

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

// --- Quest actions ---

export async function addQuest(
  clubId: string,
  title: string,
  description: string,
  link: string,
  rewardSpins: number,
  multiUse: boolean,
  clubSlug: string,
) {
  if (!title.trim()) return { error: "Title is required" };
  if (rewardSpins < 1) return { error: "Reward must be at least 1 spin" };

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("quests")
    .select("display_order")
    .eq("club_id", clubId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const { error } = await supabase.from("quests").insert({
    club_id: clubId,
    title: title.trim(),
    description: description.trim() || null,
    link: link.trim() || null,
    reward_spins: rewardSpins,
    multi_use: multiUse,
    display_order: nextOrder,
  });

  if (error) return { error: "Failed to add quest" };

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

export async function updateQuest(
  questId: string,
  title: string,
  description: string,
  link: string,
  rewardSpins: number,
  multiUse: boolean,
  clubSlug: string,
) {
  if (!title.trim()) return { error: "Title is required" };
  if (rewardSpins < 1) return { error: "Reward must be at least 1 spin" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("quests")
    .update({
      title: title.trim(),
      description: description.trim() || null,
      link: link.trim() || null,
      reward_spins: rewardSpins,
      multi_use: multiUse,
    })
    .eq("id", questId);

  if (error) return { error: "Failed to update quest" };

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

export async function deleteQuest(questId: string, clubSlug: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("quests")
    .delete()
    .eq("id", questId);

  if (error) return { error: "Failed to delete quest" };

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

// --- Event actions ---

export async function addEvent(
  clubId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const date = formData.get("date") as string;
  const time = (formData.get("time") as string) || null;
  const priceStr = (formData.get("price") as string)?.trim();
  const link = (formData.get("link") as string)?.trim() || null;
  const rewardSpins = Number(formData.get("reward_spins")) || 1;
  const imageFile = formData.get("image") as File | null;

  if (!title) return { error: "Title is required" };
  if (!date) return { error: "Date is required" };
  if (rewardSpins < 1) return { error: "Reward must be at least 1 spin" };

  const supabase = createAdminClient();

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const { uploadEventImage } = await import("@/lib/supabase/storage");
    const result = await uploadEventImage(clubId, imageFile);
    if ("error" in result) return { error: result.error };
    imageUrl = result.url;
  }

  const { error } = await supabase.from("events").insert({
    club_id: clubId,
    title,
    description,
    date,
    time: time || null,
    price: priceStr ? Number(priceStr) : null,
    image_url: imageUrl,
    link,
    reward_spins: rewardSpins,
  });

  if (error) return { error: "Failed to add event" };

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

export async function updateEvent(
  eventId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const date = formData.get("date") as string;
  const time = (formData.get("time") as string) || null;
  const priceStr = (formData.get("price") as string)?.trim();
  const link = (formData.get("link") as string)?.trim() || null;
  const rewardSpins = Number(formData.get("reward_spins")) || 1;
  const imageFile = formData.get("image") as File | null;

  if (!title) return { error: "Title is required" };
  if (!date) return { error: "Date is required" };

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    title,
    description,
    date,
    time: time || null,
    price: priceStr ? Number(priceStr) : null,
    link,
    reward_spins: rewardSpins,
  };

  if (imageFile && imageFile.size > 0) {
    // Delete old image if exists
    const { data: existing } = await supabase
      .from("events")
      .select("image_url, club_id")
      .eq("id", eventId)
      .single();

    if (existing?.image_url) {
      const { deleteEventImage } = await import("@/lib/supabase/storage");
      await deleteEventImage(existing.image_url);
    }

    const { uploadEventImage } = await import("@/lib/supabase/storage");
    const result = await uploadEventImage(existing?.club_id ?? "", imageFile);
    if ("error" in result) return { error: result.error };
    updates.image_url = result.url;
  }

  const { error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId);

  if (error) return { error: "Failed to update event" };

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}

export async function deleteEvent(
  eventId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Delete image from storage if exists
  const { data: event } = await supabase
    .from("events")
    .select("image_url")
    .eq("id", eventId)
    .single();

  if (event?.image_url) {
    const { deleteEventImage } = await import("@/lib/supabase/storage");
    await deleteEventImage(event.image_url);
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) return { error: "Failed to delete event" };

  revalidatePath(`/${clubSlug}/admin`);
  return { ok: true };
}
