"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin, clearOwnerCookie } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logoutOwner(clubSlug: string) {
  await clearOwnerCookie();
  redirect(`/${clubSlug}/admin/login`);
}

export async function updateLoginMode(
  clubId: string,
  mode: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  if (mode !== "code_only" && mode !== "code_and_expiry") {
    return { error: "Invalid login mode" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({ login_mode: mode })
    .eq("id", clubId);

  if (error) return { error: "Failed to update login mode" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/login`);
  return { ok: true };
}

export async function updateInviteOnly(
  clubId: string,
  inviteOnly: boolean,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({ invite_only: inviteOnly })
    .eq("id", clubId);

  if (error) return { error: "Failed to update invite setting" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  return { ok: true };
}

export async function updateHideMemberLogin(
  clubId: string,
  hide: boolean,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({ hide_member_login: hide })
    .eq("id", clubId);

  if (error) return { error: "Failed to update setting" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  return { ok: true };
}

export async function updateClubTags(
  clubId: string,
  tags: string[],
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  // Normalize tags: lowercase, trim, remove duplicates
  const normalized = [...new Set(tags.map(t => t.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean))];

  const { error } = await supabase
    .from("clubs")
    .update({ tags: normalized })
    .eq("id", clubId);

  if (error) return { error: "Failed to update tags" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  return { ok: true };
}

export async function updateTelegramConfig(
  clubId: string,
  botToken: string,
  chatId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({
      telegram_bot_token: botToken || null,
      telegram_chat_id: chatId || null,
    })
    .eq("id", clubId);

  if (error) return { error: "Failed to save Telegram config" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function testTelegramNotification(
  clubId: string,
  _clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("telegram_bot_token, telegram_chat_id, name")
    .eq("id", clubId)
    .single();

  if (!club?.telegram_bot_token || !club?.telegram_chat_id) {
    return { error: "Save bot token and chat ID first" };
  }

  try {
    const { sendTelegramMessage } = await import("@/lib/telegram");
    await sendTelegramMessage(
      club.telegram_bot_token,
      club.telegram_chat_id,
      `✅ <b>${club.name}</b> — Telegram notifications connected!`,
    );
    return { ok: true };
  } catch {
    return { error: "Failed to send test message. Check your bot token and chat ID." };
  }
}

export async function setPremiumReferrer(
  memberId: string,
  isPremium: boolean,
  rewardSpins: number,
  clubSlug: string,
) {
  const supabase = createAdminClient();

  if (rewardSpins < 0) return { error: "Reward spins must be 0 or more" };

  const { error } = await supabase
    .from("members")
    .update({
      is_premium_referrer: isPremium,
      referral_reward_spins: isPremium ? rewardSpins : 0,
    })
    .eq("id", memberId);

  if (error) return { error: "Failed to update referrer status" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function createMember(
  clubId: string,
  memberCode: string,
  clubSlug: string,
) {
  const code = memberCode.trim().toUpperCase();

  if (!code || code.length < 3 || code.length > 8) {
    return { error: "Member code must be 3-8 characters" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "Member code must be alphanumeric" };
  }

  const supabase = createAdminClient();

  // Find default membership period for this club
  const { data: period } = await supabase
    .from("membership_periods")
    .select("id, duration_months")
    .eq("club_id", clubId)
    .eq("active", true)
    .order("display_order", { ascending: true })
    .limit(1)
    .single();

  const insertData: Record<string, unknown> = {
    club_id: clubId,
    member_code: code,
    spin_balance: 0,
  };

  if (period) {
    const validTill = new Date();
    validTill.setMonth(validTill.getMonth() + period.duration_months);
    insertData.membership_period_id = period.id;
    insertData.valid_till = validTill.toISOString().split("T")[0];
  }

  const { error } = await supabase.from("members").insert(insertData);

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

  if (!code || code.length < 3 || code.length > 8) {
    return { error: "Staff code must be 3-8 characters" };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { error: "Staff code must be alphanumeric" };
  }
  if (!trimmedPin || trimmedPin.length !== 4 || !/^\d{4}$/.test(trimmedPin)) {
    return { error: "PIN must be exactly 4 digits" };
  }

  const supabase = createAdminClient();

  // Find default membership period for this club
  const { data: period } = await supabase
    .from("membership_periods")
    .select("id, duration_months")
    .eq("club_id", clubId)
    .eq("active", true)
    .order("display_order", { ascending: true })
    .limit(1)
    .single();

  const insertData: Record<string, unknown> = {
    club_id: clubId,
    member_code: code,
    pin_hash: hashPin(trimmedPin),
    spin_balance: 0,
    is_staff: true,
  };

  if (period) {
    const validTill = new Date();
    validTill.setMonth(validTill.getMonth() + period.duration_months);
    insertData.membership_period_id = period.id;
    insertData.valid_till = validTill.toISOString().split("T")[0];
  }

  const { error } = await supabase.from("members").insert(insertData);

  if (error) {
    if (error.code === "23505") return { error: "Code already exists" };
    return { error: "Failed to create staff member" };
  }

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function deleteMember(
  memberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId);

  if (error) return { error: "Failed to delete member" };

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
  labelEs?: string,
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
    label_es: labelEs?.trim() || null,
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
  labelEs?: string,
) {
  if (!label.trim()) return { error: "Label is required" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("wheel_configs")
    .update({
      label: label.trim(),
      label_es: labelEs?.trim() || null,
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
  const isPublic = formData.get("is_public") === "1";
  const questType = (formData.get("quest_type") as string) || "default";
  const proofMode = (formData.get("proof_mode") as string) || "none";
  const proofPlaceholder = (formData.get("proof_placeholder") as string)?.trim() || null;
  const tutorialStepsRaw = formData.get("tutorial_steps") as string | null;
  const icon = (formData.get("icon") as string)?.trim() || null;
  const badgeId = (formData.get("badge_id") as string)?.trim() || null;
  const imageFile = formData.get("image") as File | null;
  const titleEs = (formData.get("title_es") as string)?.trim() || null;
  const descriptionEs = (formData.get("description_es") as string)?.trim() || null;

  // Enforce type-specific defaults
  const effectiveMultiUse = questType === "feedback" ? true : questType === "tutorial" ? false : multiUse;
  const effectiveProofMode = questType === "feedback" ? "required" : questType === "tutorial" ? "none" : proofMode;
  const tutorialSteps = questType === "tutorial" && tutorialStepsRaw ? JSON.parse(tutorialStepsRaw) : null;

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
    icon,
    badge_id: badgeId,
    reward_spins: rewardSpins,
    multi_use: effectiveMultiUse,
    is_public: isPublic,
    quest_type: questType,
    proof_mode: effectiveProofMode,
    proof_placeholder: proofPlaceholder,
    image_url: imageUrl,
    display_order: nextOrder,
    tutorial_steps: tutorialSteps,
    title_es: titleEs,
    description_es: descriptionEs,
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
  const isPublic = formData.get("is_public") === "1";
  const questType = (formData.get("quest_type") as string) || "default";
  const proofMode = (formData.get("proof_mode") as string) || "none";
  const proofPlaceholder = (formData.get("proof_placeholder") as string)?.trim() || null;
  const tutorialStepsRaw = formData.get("tutorial_steps") as string | null;
  const icon = (formData.get("icon") as string)?.trim() || null;
  const badgeId = (formData.get("badge_id") as string)?.trim() || null;
  const imageFile = formData.get("image") as File | null;
  const titleEs = (formData.get("title_es") as string)?.trim() || null;
  const descriptionEs = (formData.get("description_es") as string)?.trim() || null;

  // Enforce type-specific defaults
  const effectiveMultiUse = questType === "feedback" ? true : questType === "tutorial" ? false : multiUse;
  const effectiveProofMode = questType === "feedback" ? "required" : questType === "tutorial" ? "none" : proofMode;
  const tutorialSteps = questType === "tutorial" && tutorialStepsRaw ? JSON.parse(tutorialStepsRaw) : null;

  if (!title) return { error: "Title is required" };
  if (rewardSpins < 0) return { error: "Reward cannot be negative" };

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    title,
    description,
    link,
    icon,
    badge_id: badgeId,
    reward_spins: rewardSpins,
    multi_use: effectiveMultiUse,
    is_public: isPublic,
    quest_type: questType,
    proof_mode: effectiveProofMode,
    proof_placeholder: proofPlaceholder,
    tutorial_steps: tutorialSteps,
    title_es: titleEs,
    description_es: descriptionEs,
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
  const isPublic = formData.get("is_public") === "1";
  const icon = (formData.get("icon") as string)?.trim() || null;
  const imageFile = formData.get("image") as File | null;
  const titleEs = (formData.get("title_es") as string)?.trim() || null;
  const descriptionEs = (formData.get("description_es") as string)?.trim() || null;

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
    icon,
    link,
    reward_spins: rewardSpins,
    is_public: isPublic,
    title_es: titleEs,
    description_es: descriptionEs,
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
  const isPublic = formData.get("is_public") === "1";
  const icon = (formData.get("icon") as string)?.trim() || null;
  const imageFile = formData.get("image") as File | null;
  const titleEs = (formData.get("title_es") as string)?.trim() || null;
  const descriptionEs = (formData.get("description_es") as string)?.trim() || null;

  if (!title) return { error: "Title is required" };
  if (!date) return { error: "Date is required" };

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    title,
    description,
    date,
    time: time || null,
    price: priceStr ? Number(priceStr) : null,
    icon,
    link,
    reward_spins: rewardSpins,
    is_public: isPublic,
    title_es: titleEs,
    description_es: descriptionEs,
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

// --- Badge actions ---

export async function addBadge(
  clubId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const icon = (formData.get("icon") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || "#6b7280";
  const imageFile = formData.get("image") as File | null;

  if (!name) return { error: "Name is required" };

  const supabase = createAdminClient();

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const { uploadClubImage } = await import("@/lib/supabase/storage");
    const result = await uploadClubImage(clubId, imageFile);
    if ("error" in result) return { error: result.error };
    imageUrl = result.url;
  }

  const { data: existing } = await supabase
    .from("badges")
    .select("display_order")
    .eq("club_id", clubId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const { error } = await supabase.from("badges").insert({
    club_id: clubId,
    name,
    description,
    icon,
    image_url: imageUrl,
    color,
    display_order: nextOrder,
  });

  if (error) return { error: "Failed to add badge" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function updateBadge(
  badgeId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const icon = (formData.get("icon") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || "#6b7280";
  const imageFile = formData.get("image") as File | null;

  if (!name) return { error: "Name is required" };

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = { name, description, icon, color };

  if (imageFile && imageFile.size > 0) {
    const { data: badge } = await supabase
      .from("badges")
      .select("image_url, club_id")
      .eq("id", badgeId)
      .single();

    if (badge?.image_url) {
      const { deleteClubImage } = await import("@/lib/supabase/storage");
      await deleteClubImage(badge.image_url);
    }

    const { uploadClubImage } = await import("@/lib/supabase/storage");
    const result = await uploadClubImage(badge?.club_id ?? "", imageFile);
    if ("error" in result) return { error: result.error };
    updates.image_url = result.url;
  }

  const { error } = await supabase
    .from("badges")
    .update(updates)
    .eq("id", badgeId);

  if (error) return { error: "Failed to update badge" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function deleteBadge(
  badgeId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("badges")
    .delete()
    .eq("id", badgeId);

  if (error) return { error: "Failed to delete badge" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

// --- Gallery actions ---

export async function addGalleryImage(
  clubId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const imageFile = formData.get("image") as File | null;
  if (!imageFile || imageFile.size === 0) return { error: "No image provided" };

  const { uploadClubImage } = await import("@/lib/supabase/storage");
  const result = await uploadClubImage(clubId, imageFile);
  if ("error" in result) return { error: result.error };

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("club_gallery")
    .select("display_order")
    .eq("club_id", clubId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const { error } = await supabase.from("club_gallery").insert({
    club_id: clubId,
    image_url: result.url,
    display_order: nextOrder,
  });

  if (error) return { error: "Failed to add image" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function deleteGalleryImage(
  imageId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { data: image } = await supabase
    .from("club_gallery")
    .select("image_url")
    .eq("id", imageId)
    .single();

  if (image?.image_url) {
    const { deleteClubImage } = await import("@/lib/supabase/storage");
    await deleteClubImage(image.image_url);
  }

  const { error } = await supabase
    .from("club_gallery")
    .delete()
    .eq("id", imageId);

  if (error) return { error: "Failed to delete image" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

// --- Notification light actions ---

export async function updateNotificationSecret(
  clubId: string,
  secret: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({ notification_secret: secret })
    .eq("id", clubId);

  if (error) return { error: "Failed to update notification secret" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

// --- Offer actions ---

export async function toggleOffer(
  clubId: string,
  offerId: string,
  enabled: boolean,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  if (enabled) {
    // Get next display_order
    const { data: existing } = await supabase
      .from("club_offers")
      .select("display_order")
      .eq("club_id", clubId)
      .order("display_order", { ascending: false })
      .limit(1);
    const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

    const { error } = await supabase.from("club_offers").insert({
      club_id: clubId,
      offer_id: offerId,
      display_order: nextOrder,
    });
    if (error) {
      if (error.code === "23505") return { ok: true }; // Already exists
      return { error: "Failed to enable offer" };
    }
  } else {
    const { error } = await supabase
      .from("club_offers")
      .delete()
      .eq("club_id", clubId)
      .eq("offer_id", offerId);
    if (error) return { error: "Failed to disable offer" };
  }

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function updateOfferOptions(
  clubOfferId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const orderable = formData.get("orderable") === "1";
  const price = (formData.get("price") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const descriptionEs = (formData.get("description_es") as string)?.trim() || null;
  const icon = (formData.get("icon") as string)?.trim() || null;
  const isPublic = formData.get("is_public") === "1";
  const imageFile = formData.get("image") as File | null;

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    orderable,
    price: orderable && price ? Number(price) : null,
    description,
    description_es: descriptionEs,
    icon,
    is_public: isPublic,
  };

  if (imageFile && imageFile.size > 0) {
    const { data: co } = await supabase
      .from("club_offers")
      .select("club_id")
      .eq("id", clubOfferId)
      .single();
    if (co) {
      const { uploadClubImage } = await import("@/lib/supabase/storage");
      const result = await uploadClubImage(co.club_id, imageFile);
      if ("error" in result) return { error: result.error };
      updates.image_url = result.url;
    }
  }

  const { error } = await supabase
    .from("club_offers")
    .update(updates)
    .eq("id", clubOfferId);

  if (error) return { error: "Failed to update offer options" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function archiveOffer(
  clubOfferId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("club_offers")
    .update({ archived: true })
    .eq("id", clubOfferId);
  if (error) return { error: "Failed to archive offer" };
  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  revalidatePath(`/${clubSlug}/offers`);
  revalidatePath(`/${clubSlug}/staff`, "layout");
  return { ok: true };
}

export async function restoreOffer(
  clubOfferId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("club_offers")
    .update({ archived: false })
    .eq("id", clubOfferId);
  if (error) return { error: "Failed to restore offer" };
  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  revalidatePath(`/${clubSlug}/offers`);
  revalidatePath(`/${clubSlug}/staff`, "layout");
  return { ok: true };
}

export async function updateInviteMode(
  clubId: string,
  mode: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  if (mode !== "form" && mode !== "social") return { error: "Invalid mode" };
  const supabase = createAdminClient();
  const { error } = await supabase.from("clubs").update({ invite_mode: mode }).eq("id", clubId);
  if (error) return { error: "Failed to update invite mode" };
  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  return { ok: true };
}

export async function saveInviteButtons(
  clubId: string,
  buttons: { type: string; label: string | null; url: string }[],
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();
  // Delete all existing buttons for this club
  await supabase.from("club_invite_buttons").delete().eq("club_id", clubId);
  // Insert new ones
  if (buttons.length > 0) {
    const rows = buttons.map((b, i) => ({
      club_id: clubId,
      type: b.type,
      label: b.label || null,
      url: b.url,
      display_order: i,
    }));
    const { error } = await supabase.from("club_invite_buttons").insert(rows);
    if (error) return { error: "Failed to save buttons" };
  }
  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  return { ok: true };
}

export async function addCustomOffer(
  clubId: string,
  name: string,
  subtype: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  if (!name.trim()) return { error: "Name is required" };

  const supabase = createAdminClient();

  // Insert into catalog as unapproved custom entry
  const { data: newOffer, error: catalogError } = await supabase
    .from("offer_catalog")
    .insert({
      name: name.trim(),
      subtype,
      is_approved: false,
      created_by_club_id: clubId,
    })
    .select("id")
    .single();

  if (catalogError) return { error: "Failed to add custom offer" };

  // Auto-enable it for this club
  const { data: existing } = await supabase
    .from("club_offers")
    .select("display_order")
    .eq("club_id", clubId)
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  await supabase.from("club_offers").insert({
    club_id: clubId,
    offer_id: newOffer.id,
    display_order: nextOrder,
  });

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}
