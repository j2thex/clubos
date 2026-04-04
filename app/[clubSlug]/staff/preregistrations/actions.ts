"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity-log";
import { requireActiveStaff } from "@/lib/auth";

export async function confirmPreregistration(
  preregId: string,
  staffMemberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
  const supabase = createAdminClient();

  const { data: prereg } = await supabase
    .from("preregistrations")
    .select("id, club_id, email, visit_date, num_visitors, status")
    .eq("id", preregId)
    .single();

  if (!prereg) return { error: "Pre-registration not found" };
  if (prereg.status !== "pending") return { error: "Already reviewed" };

  const { error } = await supabase
    .from("preregistrations")
    .update({
      status: "confirmed",
      reviewed_by: staffMemberId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", preregId);

  if (error) return { error: "Failed to confirm" };

  await logActivity({
    clubId: prereg.club_id,
    staffMemberId,
    action: "preregistration_confirmed",
    targetMemberCode: null,
    details: `${prereg.email} — ${prereg.visit_date} (${prereg.num_visitors} visitors)`,
  });

  revalidatePath(`/${clubSlug}/staff/preregistrations`);
  return { ok: true };
}

export async function denyPreregistration(
  preregId: string,
  staffMemberId: string,
  clubSlug: string,
): Promise<{ error: string } | { ok: true }> {
  try { await requireActiveStaff(); } catch { return { error: "Account is inactive" }; }
  const supabase = createAdminClient();

  const { data: prereg } = await supabase
    .from("preregistrations")
    .select("id, club_id, email, visit_date, num_visitors, status")
    .eq("id", preregId)
    .single();

  if (!prereg) return { error: "Pre-registration not found" };
  if (prereg.status !== "pending") return { error: "Already reviewed" };

  const { error } = await supabase
    .from("preregistrations")
    .update({
      status: "denied",
      reviewed_by: staffMemberId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", preregId);

  if (error) return { error: "Failed to deny" };

  await logActivity({
    clubId: prereg.club_id,
    staffMemberId,
    action: "preregistration_denied",
    targetMemberCode: null,
    details: `${prereg.email} — ${prereg.visit_date} (${prereg.num_visitors} visitors)`,
  });

  revalidatePath(`/${clubSlug}/staff/preregistrations`);
  return { ok: true };
}
