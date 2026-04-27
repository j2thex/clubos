import { createAdminClient } from "@/lib/supabase/admin";

export async function logActivity(params: {
  clubId: string;
  staffMemberId?: string | null;
  actorOwnerId?: string | null;
  action: string;
  targetMemberCode?: string | null;
  details?: string | null;
}) {
  const supabase = createAdminClient();
  await supabase.from("activity_log").insert({
    club_id: params.clubId,
    staff_member_id: params.staffMemberId ?? null,
    actor_owner_id: params.actorOwnerId ?? null,
    action: params.action,
    target_member_code: params.targetMemberCode ?? null,
    details: params.details ?? null,
  });
}
