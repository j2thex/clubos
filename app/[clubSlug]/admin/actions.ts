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

export async function toggleSpinEnabled(
  clubId: string,
  enabled: boolean,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({ spin_enabled: enabled })
    .eq("id", clubId);

  if (error) return { error: "Failed to update spin setting" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export type ClubVisibility = "public" | "unlisted" | "private";

const VISIBILITY_RANK: Record<ClubVisibility, number> = {
  public: 0,
  unlisted: 1,
  private: 2,
};

export async function updateClubVisibility(
  clubId: string,
  next: ClubVisibility,
  clubSlug: string,
): Promise<{ error: string } | { ok: true; applied: ClubVisibility; pending: boolean }> {
  if (next !== "public" && next !== "unlisted" && next !== "private") {
    return { error: "Invalid visibility" };
  }

  const supabase = createAdminClient();

  const { data: current, error: loadError } = await supabase
    .from("clubs")
    .select("visibility")
    .eq("id", clubId)
    .single();

  if (loadError || !current) return { error: "Club not found" };

  const currentVis = (current.visibility ?? "public") as ClubVisibility;

  // Same-or-more-private: auto-apply. More public: request pending tower admin approval.
  const isMoreOrEqualPrivate = VISIBILITY_RANK[next] >= VISIBILITY_RANK[currentVis];

  const update = isMoreOrEqualPrivate
    ? { visibility: next, requested_visibility: next }
    : { requested_visibility: next };

  const { error } = await supabase.from("clubs").update(update).eq("id", clubId);
  if (error) return { error: "Failed to update visibility" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  revalidatePath("/");
  revalidatePath("/discover");
  return {
    ok: true,
    applied: isMoreOrEqualPrivate ? next : currentVis,
    pending: !isMoreOrEqualPrivate,
  };
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

export async function updatePreregistrationEnabled(
  clubId: string,
  enabled: boolean,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({ preregistration_enabled: enabled })
    .eq("id", clubId);

  if (error) return { error: "Failed to update pre-registration setting" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  return { ok: true };
}

export async function updateAutoRegistration(
  clubId: string,
  enabled: boolean,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({ auto_registration: enabled })
    .eq("id", clubId);

  if (error) return { error: "Failed to update auto-registration setting" };

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

export async function updateTelegramBotConfig(
  clubId: string,
  config: {
    telegram_bot_enabled: boolean;
    telegram_bot_referral_name: string | null;
    telegram_bot_registration_price: number | null;
    telegram_bot_welcome_message: string | null;
    telegram_bot_keywords: string[];
    telegram_bot_age_restricted: boolean;
  },
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clubs")
    .update({
      telegram_bot_enabled: config.telegram_bot_enabled,
      telegram_bot_referral_name: config.telegram_bot_referral_name || null,
      telegram_bot_registration_price: config.telegram_bot_registration_price,
      telegram_bot_welcome_message: config.telegram_bot_welcome_message || null,
      telegram_bot_keywords: config.telegram_bot_keywords,
      telegram_bot_age_restricted: config.telegram_bot_age_restricted,
    })
    .eq("id", clubId);

  if (error) return { error: "Failed to save Telegram bot config" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
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

  if (!code || code.length < 3 || code.length > 20) {
    return { error: "Member code must be 3-20 characters" };
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

  if (!code || code.length < 3 || code.length > 20) {
    return { error: "Staff code must be 3-20 characters" };
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
  const rewardSpins = rawSpins !== null && rawSpins !== "" ? Number(rawSpins) : 0;
  const multiUse = formData.get("multi_use") === "1";
  const isPublic = formData.get("is_public") === "1";
  const questType = (formData.get("quest_type") as string) || "default";
  const proofMode = (formData.get("proof_mode") as string) || "none";
  const proofPlaceholder = (formData.get("proof_placeholder") as string)?.trim() || null;
  const tutorialStepsRaw = formData.get("tutorial_steps") as string | null;
  const icon = (formData.get("icon") as string)?.trim() || null;
  const awardBadge = formData.get("award_badge") === "1";
  const imageFile = formData.get("image") as File | null;
  const imageUrlInput = (formData.get("image_url") as string)?.trim() || null;
  const titleEs = (formData.get("title_es") as string)?.trim() || null;
  const descriptionEs = (formData.get("description_es") as string)?.trim() || null;
  const deadlineRaw = (formData.get("deadline") as string)?.trim() || null;
  const deadline = deadlineRaw ? new Date(deadlineRaw).toISOString() : null;
  const category = (formData.get("category") as string) || "social";

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
  } else if (imageUrlInput) {
    imageUrl = imageUrlInput;
  }

  const { data: quest, error } = await supabase.from("quests").insert({
    club_id: clubId,
    title,
    description,
    link,
    icon,
    badge_id: null,
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
    deadline,
    category,
  }).select("id").single();

  if (error) return { error: "Failed to add quest" };

  // Auto-create badge if requested. The badge inherits the quest's
  // image_url so the badge visible on member profiles matches the quest
  // thumbnail — this is the canonical way to ship badge artwork now
  // that there's no standalone badge admin UI.
  if (awardBadge && quest) {
    const { data: badge } = await supabase
      .from("badges")
      .insert({
        club_id: clubId,
        name: title,
        icon: icon || null,
        color: "#6b7280",
        image_url: imageUrl,
      })
      .select("id")
      .single();

    if (badge) {
      await supabase.from("quests").update({ badge_id: badge.id }).eq("id", quest.id);
    }
  }

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
  const rewardSpins = rawSpins !== null && rawSpins !== "" ? Number(rawSpins) : 0;
  const multiUse = formData.get("multi_use") === "1";
  const isPublic = formData.get("is_public") === "1";
  const questType = (formData.get("quest_type") as string) || "default";
  const proofMode = (formData.get("proof_mode") as string) || "none";
  const proofPlaceholder = (formData.get("proof_placeholder") as string)?.trim() || null;
  const tutorialStepsRaw = formData.get("tutorial_steps") as string | null;
  const icon = (formData.get("icon") as string)?.trim() || null;
  const awardBadge = formData.get("award_badge") === "1";
  const imageFile = formData.get("image") as File | null;
  const imageUrlInput = (formData.get("image_url") as string)?.trim() || null;
  const titleEs = (formData.get("title_es") as string)?.trim() || null;
  const descriptionEs = (formData.get("description_es") as string)?.trim() || null;
  const deadlineRaw = (formData.get("deadline") as string)?.trim() || null;
  const deadline = deadlineRaw ? new Date(deadlineRaw).toISOString() : null;
  const category = (formData.get("category") as string) || "social";

  // Enforce type-specific defaults
  const effectiveMultiUse = questType === "feedback" ? true : questType === "tutorial" ? false : multiUse;
  const effectiveProofMode = questType === "feedback" ? "required" : questType === "tutorial" ? "none" : proofMode;
  const tutorialSteps = questType === "tutorial" && tutorialStepsRaw ? JSON.parse(tutorialStepsRaw) : null;

  if (!title) return { error: "Title is required" };
  if (rewardSpins < 0) return { error: "Reward cannot be negative" };

  const supabase = createAdminClient();

  // Get current quest to check existing badge_id and club_id
  const { data: currentQuest } = await supabase
    .from("quests")
    .select("badge_id, club_id, image_url")
    .eq("id", questId)
    .single();

  // Determine badge_id based on toggle. When creating a new badge, seed
  // image_url from the quest's effective image (existing or being set in
  // this update). When an existing badge is kept and the quest image is
  // changing, we also sync the badge row below so the badge stays in
  // lockstep with the quest's visual.
  let badgeId: string | null = currentQuest?.badge_id ?? null;
  const previousQuestImage = currentQuest?.image_url ?? null;
  if (awardBadge && !badgeId) {
    // Create a new badge seeded with whatever image the quest will end
    // up with — computed below after we decide on updates.image_url.
    // For now we capture the incoming URL; if no image change, use the
    // quest's current image.
    const seedImageUrl = imageUrlInput ?? previousQuestImage;
    const { data: badge } = await supabase
      .from("badges")
      .insert({
        club_id: currentQuest?.club_id ?? "",
        name: title,
        icon: icon || null,
        color: "#6b7280",
        image_url: seedImageUrl,
      })
      .select("id")
      .single();
    if (badge) badgeId = badge.id;
  } else if (!awardBadge) {
    badgeId = null;
  }

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
    deadline,
    category,
  };

  if (imageFile && imageFile.size > 0) {
    if (currentQuest?.image_url) {
      const { deleteClubImage } = await import("@/lib/supabase/storage");
      await deleteClubImage(currentQuest.image_url);
    }

    const { uploadClubImage } = await import("@/lib/supabase/storage");
    const result = await uploadClubImage(currentQuest?.club_id ?? "", imageFile);
    if ("error" in result) return { error: result.error };
    updates.image_url = result.url;
  } else if (imageUrlInput && imageUrlInput !== currentQuest?.image_url) {
    if (currentQuest?.image_url) {
      const { deleteClubImage } = await import("@/lib/supabase/storage");
      await deleteClubImage(currentQuest.image_url);
    }
    updates.image_url = imageUrlInput;
  }

  const { error } = await supabase
    .from("quests")
    .update(updates)
    .eq("id", questId);

  if (error) return { error: "Failed to update quest" };

  // Sync the linked badge's image_url when the quest image changed.
  // Covers three cases:
  //   1. Existing badge, quest image just changed → push new URL into badge
  //   2. New badge we just created above → also sync name/icon in case
  //      the admin edited them in the same save
  //   3. Badge kept, no image change, name/icon unchanged → noop
  if (badgeId && "image_url" in updates) {
    await supabase
      .from("badges")
      .update({
        name: title,
        icon: icon || null,
        image_url: updates.image_url ?? null,
      })
      .eq("id", badgeId);
  } else if (badgeId && !("image_url" in updates)) {
    // Keep name/icon in sync even if image didn't change.
    await supabase
      .from("badges")
      .update({ name: title, icon: icon || null })
      .eq("id", badgeId);
  }

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function toggleQuestActive(
  questId: string,
  active: boolean,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("quests")
    .update({ active })
    .eq("id", questId);

  if (error) return { error: "Failed to update quest" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/quests`);
  revalidatePath(`/${clubSlug}/bonuses`);
  revalidatePath(`/${clubSlug}/public`);
  revalidatePath(`/${clubSlug}/staff`, "layout");
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

function generateOccurrenceDates(startDate: string, rule: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  let current = new Date(start);

  // Skip the first occurrence (that's the parent)
  while (dates.length < 52) {
    if (rule === "daily") {
      current.setDate(current.getDate() + 1);
    } else if (rule === "weekly") {
      current.setDate(current.getDate() + 7);
    } else if (rule === "biweekly") {
      current.setDate(current.getDate() + 14);
    } else if (rule === "monthly") {
      const day = start.getDate();
      current.setMonth(current.getMonth() + 1);
      // Clamp to last day of month (handles Jan 31 → Feb 28)
      const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      current.setDate(Math.min(day, lastDay));
    } else {
      break;
    }
    if (current > end) break;
    dates.push(current.toISOString().split("T")[0]);
  }
  return dates;
}

export async function addEvent(
  clubId: string,
  formData: FormData,
  clubSlug: string,
): Promise<{ error: string } | { ok: true; count?: number }> {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const date = formData.get("date") as string;
  const time = (formData.get("time") as string) || null;
  const endTime = (formData.get("end_time") as string) || null;
  const priceStr = (formData.get("price") as string)?.trim();
  const link = (formData.get("link") as string)?.trim() || null;
  const rawSpins = formData.get("reward_spins");
  const rewardSpins = rawSpins !== null && rawSpins !== "" ? Number(rawSpins) : 0;
  const isPublic = formData.get("is_public") === "1";
  const icon = (formData.get("icon") as string)?.trim() || null;
  const imageFile = formData.get("image") as File | null;
  const titleEs = (formData.get("title_es") as string)?.trim() || null;
  const descriptionEs = (formData.get("description_es") as string)?.trim() || null;
  const recurrenceRule = (formData.get("recurrence_rule") as string) || null;
  const recurrenceEndDate = (formData.get("recurrence_end_date") as string) || null;
  const locationName = (formData.get("location_name") as string)?.trim() || null;
  const latStr = formData.get("latitude") as string;
  const lngStr = formData.get("longitude") as string;
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;

  if (!title) return { error: "Title is required" };
  if (!date) return { error: "Date is required" };
  if (rewardSpins < 0) return { error: "Reward cannot be negative" };

  const supabase = createAdminClient();

  const price = priceStr ? Number(priceStr) : null;

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const { uploadEventImage } = await import("@/lib/supabase/storage");
    const result = await uploadEventImage(clubId, imageFile);
    if ("error" in result) return { error: result.error };
    imageUrl = result.url;
  }

  if (recurrenceRule && recurrenceEndDate) {
    const { data: parentEvent, error } = await supabase
      .from("events")
      .insert({
        club_id: clubId,
        title, description, date, time: time || null, end_time: endTime || null,
        price: price || null, image_url: imageUrl,
        link: link || null, reward_spins: rewardSpins,
        is_public: isPublic, icon: icon || null,
        title_es: titleEs || null, description_es: descriptionEs || null,
        recurrence_rule: recurrenceRule,
        recurrence_end_date: recurrenceEndDate,
        location_name: locationName, latitude, longitude,
      })
      .select("id")
      .single();

    if (error || !parentEvent) {
      return { error: "Failed to create event" };
    }

    const occurrenceDates = generateOccurrenceDates(date, recurrenceRule, recurrenceEndDate);

    if (occurrenceDates.length > 0) {
      const children = occurrenceDates.map(d => ({
        club_id: clubId,
        title, description, date: d, time: time || null, end_time: endTime || null,
        price: price || null, image_url: imageUrl,
        link: link || null, reward_spins: rewardSpins,
        is_public: isPublic, icon: icon || null,
        title_es: titleEs || null, description_es: descriptionEs || null,
        recurrence_parent_id: parentEvent.id,
        location_name: locationName, latitude, longitude,
      }));

      await supabase.from("events").insert(children);
    }

    revalidatePath(`/${clubSlug}/admin`, "layout");
    return { ok: true, count: occurrenceDates.length + 1 };
  } else {
    // Existing non-recurring insert
    const { error } = await supabase.from("events").insert({
      club_id: clubId,
      title,
      description,
      date,
      time: time || null,
      end_time: endTime || null,
      price: price || null,
      image_url: imageUrl,
      link: link || null,
      reward_spins: rewardSpins,
      is_public: isPublic,
      icon: icon || null,
      title_es: titleEs || null,
      description_es: descriptionEs || null,
      location_name: locationName,
      latitude,
      longitude,
    });

    if (error) return { error: "Failed to add event" };

    revalidatePath(`/${clubSlug}/admin`, "layout");
    return { ok: true };
  }
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
  const endTime = (formData.get("end_time") as string) || null;
  const priceStr = (formData.get("price") as string)?.trim();
  const link = (formData.get("link") as string)?.trim() || null;
  const rawSpins = formData.get("reward_spins");
  const rewardSpins = rawSpins !== null && rawSpins !== "" ? Number(rawSpins) : 0;
  const isPublic = formData.get("is_public") === "1";
  const icon = (formData.get("icon") as string)?.trim() || null;
  const imageFile = formData.get("image") as File | null;
  const titleEs = (formData.get("title_es") as string)?.trim() || null;
  const descriptionEs = (formData.get("description_es") as string)?.trim() || null;
  const scope = (formData.get("scope") as string) || "single";
  const locationName = (formData.get("location_name") as string)?.trim() || null;
  const latStr = formData.get("latitude") as string;
  const lngStr = formData.get("longitude") as string;
  const latitude = latStr ? parseFloat(latStr) : null;
  const longitude = lngStr ? parseFloat(lngStr) : null;

  if (!title) return { error: "Title is required" };
  if (!date) return { error: "Date is required" };

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    title,
    description,
    date,
    time: time || null,
    end_time: endTime || null,
    price: priceStr ? Number(priceStr) : null,
    icon,
    link,
    reward_spins: rewardSpins,
    is_public: isPublic,
    title_es: titleEs,
    description_es: descriptionEs,
    location_name: locationName,
    latitude,
    longitude,
  };

  let imageUrl: string | undefined;
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
    imageUrl = result.url;
  }

  if (scope === "single") {
    const { error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", eventId);

    if (error) return { error: "Failed to update event" };
  }

  if (scope === "future") {
    // Get this event's info to find siblings
    const { data: thisEvent } = await supabase
      .from("events")
      .select("date, recurrence_parent_id")
      .eq("id", eventId)
      .single();

    if (thisEvent) {
      const parentId = thisEvent.recurrence_parent_id ?? eventId;
      const today = new Date().toISOString().split("T")[0];
      const fromDate = thisEvent.date > today ? thisEvent.date : today;

      // Update all future siblings (and parent if applicable)
      const updateData: Record<string, unknown> = {
        title, description, time: time || null,
        price: priceStr ? Number(priceStr) : null, link: link || null,
        reward_spins: rewardSpins, is_public: isPublic,
        icon: icon || null,
        title_es: titleEs || null, description_es: descriptionEs || null,
        location_name: locationName, latitude, longitude,
      };
      if (imageUrl !== undefined) updateData.image_url = imageUrl;

      // Update children of same parent
      await supabase
        .from("events")
        .update(updateData)
        .eq("recurrence_parent_id", parentId)
        .gte("date", fromDate);

      // Also update the parent itself if it's in the future
      await supabase
        .from("events")
        .update(updateData)
        .eq("id", parentId)
        .gte("date", fromDate);
    }
  }

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function deleteEvent(
  eventId: string,
  clubSlug: string,
  scope: string = "single",
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  if (scope === "future") {
    const { data: thisEvent } = await supabase
      .from("events")
      .select("date, recurrence_parent_id")
      .eq("id", eventId)
      .single();

    if (thisEvent) {
      const parentId = thisEvent.recurrence_parent_id ?? eventId;

      // Delete all future siblings
      await supabase
        .from("events")
        .delete()
        .eq("recurrence_parent_id", parentId)
        .gte("date", thisEvent.date);

      // Delete the parent too if it's this event or a future one
      const { data: parent } = await supabase
        .from("events")
        .select("date")
        .eq("id", parentId)
        .single();

      if (parent && parent.date >= thisEvent.date) {
        await supabase.from("events").delete().eq("id", parentId);
      }
    }

    revalidatePath(`/${clubSlug}/admin`, "layout");
    return { ok: true };
  }

  // Single delete (existing logic)
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
  price?: number | null,
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
    ...(price != null && { price }),
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

  const { count } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("membership_period_id", periodId);

  if (count && count > 0) {
    return { error: `Cannot delete: ${count} member${count === 1 ? "" : "s"} assigned to this plan. Reassign them first.` };
  }

  const { error } = await supabase
    .from("membership_periods")
    .delete()
    .eq("id", periodId);

  if (error) return { error: "Failed to delete membership period" };

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

// Badges are created implicitly via the `award_badge` checkbox on quests
// (see addQuest/updateQuest above). There is no standalone badge CRUD UI —
// the rows are displayed on members' profiles via BadgeCollection, and the
// legacy /admin/(panel)/badges page was removed in the Phase 4 AI revision.

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
    // If a row already exists (e.g. archived from a prior session), un-archive
    // it rather than inserting — otherwise the unique (club_id, offer_id)
    // constraint fires, we silently swallow 23505, and the offer stays hidden
    // from members.
    const { data: existingRow } = await supabase
      .from("club_offers")
      .select("id, archived")
      .eq("club_id", clubId)
      .eq("offer_id", offerId)
      .maybeSingle();

    if (existingRow) {
      if (existingRow.archived) {
        const { error } = await supabase
          .from("club_offers")
          .update({ archived: false })
          .eq("id", existingRow.id);
        if (error) return { error: "Failed to enable offer" };
      }
    } else {
      const { data: last } = await supabase
        .from("club_offers")
        .select("display_order")
        .eq("club_id", clubId)
        .order("display_order", { ascending: false })
        .limit(1);
      const nextOrder = last && last.length > 0 ? last[0].display_order + 1 : 0;

      const { error } = await supabase.from("club_offers").insert({
        club_id: clubId,
        offer_id: offerId,
        display_order: nextOrder,
      });
      if (error) return { error: "Failed to enable offer" };
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
  revalidatePath(`/${clubSlug}/offers`);
  revalidatePath(`/${clubSlug}/public`);
  revalidatePath(`/${clubSlug}/staff`, "layout");
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
  const link = (formData.get("link") as string)?.trim() || null;
  const icon = (formData.get("icon") as string)?.trim() || null;
  const isPublic = formData.get("is_public") === "1";
  const imageFile = formData.get("image") as File | null;

  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {
    orderable,
    price: orderable && price ? Number(price) : null,
    description,
    description_es: descriptionEs,
    link,
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
  id: string,
  clubSlug: string,
  clubId?: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();

  if (clubId) {
    // No existing club_offers record — create one with archived: true
    // id is the catalog offer_id in this case
    const { error } = await supabase
      .from("club_offers")
      .insert({ club_id: clubId, offer_id: id, archived: true });
    if (error) return { error: "Failed to archive offer" };
  } else {
    // Existing club_offers record — update it
    const { error } = await supabase
      .from("club_offers")
      .update({ archived: true })
      .eq("id", id);
    if (error) return { error: "Failed to archive offer" };
  }

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

export async function updateWorkingHours(
  clubId: string,
  workingHours: Record<string, { open: string; close: string } | null> | null,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clubs")
    .update({ working_hours: workingHours })
    .eq("id", clubId);
  if (error) return { error: "Failed to update working hours" };
  revalidatePath(`/${clubSlug}/admin`, "layout");
  revalidatePath(`/${clubSlug}/public`);
  return { ok: true };
}

export async function createReferralSource(
  clubId: string,
  name: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const code = name.trim().toUpperCase();
  if (!code || code.length < 2 || code.length > 30) {
    return { error: "Referral source name must be 2-30 characters" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("members").insert({
    club_id: clubId,
    member_code: code,
    is_system_member: true,
    is_premium_referrer: true,
    spin_balance: 0,
    status: "active",
  });

  if (error) {
    if (error.code === "23505") return { error: "Referral source already exists" };
    return { error: "Failed to create referral source" };
  }

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function deleteReferralSource(
  memberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId)
    .eq("is_system_member", true);
  if (error) return { error: "Failed to delete referral source" };
  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}

export async function updateSpinDisplayOptions(
  clubId: string,
  displayDecimals: number,
  spinCost: number,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  if (displayDecimals !== 0 && displayDecimals !== 2) {
    return { error: "Display decimals must be 0 or 2" };
  }
  if (spinCost < 0.1 || spinCost > 100) {
    return { error: "Spin cost must be between 0.1 and 100" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clubs")
    .update({ spin_display_decimals: displayDecimals, spin_cost: spinCost })
    .eq("id", clubId);
  if (error) return { error: "Failed to update spin options" };
  revalidatePath(`/${clubSlug}/admin`, "layout");
  return { ok: true };
}
