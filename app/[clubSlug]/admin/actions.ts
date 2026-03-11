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

  revalidatePath(`/${clubSlug}/admin`, "layout");
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

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function toggleMemberStatus(
  memberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true; newStatus: string }> {
  const supabase = createAdminClient();

  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", memberId)
    .single();

  if (!member) return { error: "Member not found" };

  const newStatus = member.status === "active" ? "inactive" : "active";

  const { error } = await supabase
    .from("members")
    .update({ status: newStatus })
    .eq("id", memberId);

  if (error) return { error: "Failed to update status" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true, newStatus };
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

  revalidatePath(`/${clubSlug}/admin`, "layout");
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

  revalidatePath(`/${clubSlug}/admin`, "layout");
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

  revalidatePath(`/${clubSlug}/admin`, "layout");
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

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function deleteSegment(segmentId: string, clubSlug: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("wheel_configs")
    .delete()
    .eq("id", segmentId);

  if (error) return { error: "Failed to delete segment" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

// --- Quest actions ---

export async function addQuest(
  clubId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const link = (formData.get("link") as string)?.trim() || null;
  const rawSpins = formData.get("reward_spins");
  const rewardSpins = rawSpins !== null && rawSpins !== "" ? Number(rawSpins) : 1;
  const multiUse = formData.get("multi_use") === "1";
  const questType = (formData.get("quest_type") as string) || "default";
  const proofMode = (formData.get("proof_mode") as string) || "none";
  const proofPlaceholder = (formData.get("proof_placeholder") as string)?.trim() || null;
  const imageFile = formData.get("image") as File | null;

  if (!title) return { error: "Title is required" };
  if (rewardSpins < 0) return { error: "Reward cannot be negative" };

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("quests")
    .select("display_order")
    .eq("club_id", clubId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const { uploadClubImage } = await import("@/lib/supabase/storage");
    const result = await uploadClubImage(clubId, imageFile);
    if ("error" in result) return { error: result.error };
    imageUrl = result.url;
  }

  const { error } = await supabase.from("quests").insert({
    club_id: clubId,
    title,
    description,
    link,
    reward_spins: rewardSpins,
    multi_use: multiUse,
    quest_type: questType,
    proof_mode: proofMode,
    proof_placeholder: proofPlaceholder,
    image_url: imageUrl,
    display_order: nextOrder,
  });

  if (error) return { error: "Failed to add quest" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function updateQuest(
  questId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const link = (formData.get("link") as string)?.trim() || null;
  const rawSpins = formData.get("reward_spins");
  const rewardSpins = rawSpins !== null && rawSpins !== "" ? Number(rawSpins) : 1;
  const multiUse = formData.get("multi_use") === "1";
  const questType = (formData.get("quest_type") as string) || "default";
  const proofMode = (formData.get("proof_mode") as string) || "none";
  const proofPlaceholder = (formData.get("proof_placeholder") as string)?.trim() || null;
  const imageFile = formData.get("image") as File | null;

  if (!title) return { error: "Title is required" };
  if (rewardSpins < 0) return { error: "Reward cannot be negative" };

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    title,
    description,
    link,
    reward_spins: rewardSpins,
    multi_use: multiUse,
    quest_type: questType,
    proof_mode: proofMode,
    proof_placeholder: proofPlaceholder,
  };

  if (imageFile && imageFile.size > 0) {
    const { data: quest } = await supabase
      .from("quests")
      .select("image_url, club_id")
      .eq("id", questId)
      .single();

    if (quest?.image_url) {
      const { deleteClubImage } = await import("@/lib/supabase/storage");
      await deleteClubImage(quest.image_url);
    }

    const { uploadClubImage } = await import("@/lib/supabase/storage");
    const result = await uploadClubImage(quest?.club_id ?? "", imageFile);
    if ("error" in result) return { error: result.error };
    updates.image_url = result.url;
  }

  const { error } = await supabase
    .from("quests")
    .update(updates)
    .eq("id", questId);

  if (error) return { error: "Failed to update quest" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function deleteQuest(
  questId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { data: quest } = await supabase
    .from("quests")
    .select("image_url")
    .eq("id", questId)
    .single();

  if (quest?.image_url) {
    const { deleteClubImage } = await import("@/lib/supabase/storage");
    await deleteClubImage(quest.image_url);
  }

  const { error } = await supabase
    .from("quests")
    .delete()
    .eq("id", questId);

  if (error) return { error: "Failed to delete quest" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
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
  const rawSpins = formData.get("reward_spins");
  const rewardSpins = rawSpins !== null && rawSpins !== "" ? Number(rawSpins) : 1;
  const imageFile = formData.get("image") as File | null;

  if (!title) return { error: "Title is required" };
  if (!date) return { error: "Date is required" };
  if (rewardSpins < 0) return { error: "Reward cannot be negative" };

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

  revalidatePath(`/${clubSlug}/admin`, "layout");
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
  const rawSpins = formData.get("reward_spins");
  const rewardSpins = rawSpins !== null && rawSpins !== "" ? Number(rawSpins) : 1;
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

  revalidatePath(`/${clubSlug}/admin`, "layout");
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

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

// --- Service actions ---

export async function addService(
  clubId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const link = (formData.get("link") as string)?.trim() || null;
  const priceStr = (formData.get("price") as string)?.trim();
  const imageFile = formData.get("image") as File | null;

  if (!title) return { error: "Title is required" };

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("services")
    .select("display_order")
    .eq("club_id", clubId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const { uploadClubImage } = await import("@/lib/supabase/storage");
    const result = await uploadClubImage(clubId, imageFile);
    if ("error" in result) return { error: result.error };
    imageUrl = result.url;
  }

  const { error } = await supabase.from("services").insert({
    club_id: clubId,
    title,
    description,
    link,
    price: priceStr ? Number(priceStr) : null,
    image_url: imageUrl,
    display_order: nextOrder,
  });

  if (error) return { error: "Failed to add service" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function updateService(
  serviceId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const link = (formData.get("link") as string)?.trim() || null;
  const priceStr = (formData.get("price") as string)?.trim();
  const imageFile = formData.get("image") as File | null;

  if (!title) return { error: "Title is required" };

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    title,
    description,
    link,
    price: priceStr ? Number(priceStr) : null,
  };

  if (imageFile && imageFile.size > 0) {
    const { data: svc } = await supabase
      .from("services")
      .select("image_url, club_id")
      .eq("id", serviceId)
      .single();

    if (svc?.image_url) {
      const { deleteClubImage } = await import("@/lib/supabase/storage");
      await deleteClubImage(svc.image_url);
    }

    const { uploadClubImage } = await import("@/lib/supabase/storage");
    const result = await uploadClubImage(svc?.club_id ?? "", imageFile);
    if ("error" in result) return { error: result.error };
    updates.image_url = result.url;
  }

  const { error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", serviceId);

  if (error) return { error: "Failed to update service" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function deleteService(
  serviceId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { data: svc } = await supabase
    .from("services")
    .select("image_url")
    .eq("id", serviceId)
    .single();

  if (svc?.image_url) {
    const { deleteClubImage } = await import("@/lib/supabase/storage");
    await deleteClubImage(svc.image_url);
  }

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);

  if (error) return { error: "Failed to delete service" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

// --- Membership period actions ---

export async function addMembershipPeriod(
  clubId: string,
  name: string,
  durationMonths: number,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  if (!name.trim()) return { error: "Name is required" };
  if (durationMonths < 1) return { error: "Duration must be at least 1 month" };

  const supabase = createAdminClient();

  // Auto display_order
  const { data: existing } = await supabase
    .from("membership_periods")
    .select("display_order")
    .eq("club_id", clubId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const { error } = await supabase.from("membership_periods").insert({
    club_id: clubId,
    name: name.trim(),
    duration_months: durationMonths,
    display_order: nextOrder,
  });

  if (error) return { error: "Failed to add membership period" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function deleteMembershipPeriod(
  periodId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("membership_periods")
    .delete()
    .eq("id", periodId);

  if (error) return { error: "Failed to delete membership period" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}
