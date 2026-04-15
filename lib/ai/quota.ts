import { createAdminClient } from "@/lib/supabase/admin";

// Monthly quota tracker for AI usage. Two budgets per club:
//   - tokens_used_this_month  (text generations)
//   - images_used_this_month  (image generations)
//
// If the stored quota_period_start is in a previous calendar month, the
// counters auto-reset on the next check. BYOK calls bypass quotas entirely
// (counted in ai_generations.byok for reporting, not enforced).

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  tokensRemaining: number;
  imagesRemaining: number;
}

interface QuotaRow {
  enabled: boolean;
  monthly_token_limit: number;
  monthly_images_limit: number;
  tokens_used_this_month: number;
  images_used_this_month: number;
  quota_period_start: string;
}

function currentPeriodStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

async function ensureRow(clubId: string): Promise<QuotaRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("club_ai_settings")
    .select(
      "enabled, monthly_token_limit, monthly_images_limit, tokens_used_this_month, images_used_this_month, quota_period_start",
    )
    .eq("club_id", clubId)
    .maybeSingle<QuotaRow>();

  if (error) throw new Error(`quota lookup failed: ${error.message}`);

  if (data) {
    if (data.quota_period_start !== currentPeriodStart()) {
      // Roll over
      await supabase
        .from("club_ai_settings")
        .update({
          tokens_used_this_month: 0,
          images_used_this_month: 0,
          quota_period_start: currentPeriodStart(),
        })
        .eq("club_id", clubId);
      data.tokens_used_this_month = 0;
      data.images_used_this_month = 0;
      data.quota_period_start = currentPeriodStart();
    }
    return data;
  }

  // Insert default row on first use
  const { data: inserted, error: insErr } = await supabase
    .from("club_ai_settings")
    .insert({ club_id: clubId })
    .select(
      "enabled, monthly_token_limit, monthly_images_limit, tokens_used_this_month, images_used_this_month, quota_period_start",
    )
    .single<QuotaRow>();
  if (insErr || !inserted) throw new Error(`quota init failed: ${insErr?.message ?? "no row"}`);
  return inserted;
}

export async function checkQuota(
  clubId: string,
  kind: "text" | "image",
): Promise<QuotaCheckResult> {
  const row = await ensureRow(clubId);
  if (!row.enabled) {
    return {
      allowed: false,
      reason: "AI is disabled for this club",
      tokensRemaining: 0,
      imagesRemaining: 0,
    };
  }
  const tokensRemaining = Math.max(0, row.monthly_token_limit - row.tokens_used_this_month);
  const imagesRemaining = Math.max(0, row.monthly_images_limit - row.images_used_this_month);

  if (kind === "text" && tokensRemaining <= 0) {
    return { allowed: false, reason: "Monthly AI token quota reached", tokensRemaining, imagesRemaining };
  }
  if (kind === "image" && imagesRemaining <= 0) {
    return { allowed: false, reason: "Monthly AI image quota reached", tokensRemaining, imagesRemaining };
  }
  return { allowed: true, tokensRemaining, imagesRemaining };
}

export async function recordUsage(params: {
  clubId: string;
  ownerId?: string | null;
  contentType: string;
  kind: "text" | "image";
  model: string;
  promptVersion?: number | null;
  tokensIn?: number;
  tokensOut?: number;
  imageCount?: number;
  costCents?: number;
  byok?: boolean;
  status?: "success" | "error";
  errorMessage?: string | null;
}): Promise<void> {
  const supabase = createAdminClient();
  const tokensIn = params.tokensIn ?? 0;
  const tokensOut = params.tokensOut ?? 0;
  const imageCount = params.imageCount ?? 0;
  const byok = params.byok ?? false;

  await supabase.from("ai_generations").insert({
    club_id: params.clubId,
    owner_id: params.ownerId ?? null,
    content_type: params.contentType,
    kind: params.kind,
    model: params.model,
    prompt_version: params.promptVersion ?? null,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    image_count: imageCount,
    cost_cents: params.costCents ?? 0,
    byok,
    status: params.status ?? "success",
    error_message: params.errorMessage ?? null,
  });

  // Platform-paid usage consumes quota; BYOK does not.
  if (byok) return;

  if (params.kind === "text") {
    const total = tokensIn + tokensOut;
    if (total > 0) {
      await supabase.rpc("increment_ai_tokens", { p_club_id: params.clubId, p_amount: total })
        .then(async (r) => {
          if (r.error) {
            // Fallback if RPC not defined: do a read-modify-write. Not
            // race-safe but acceptable for Phase 0 single-admin usage.
            const { data } = await supabase
              .from("club_ai_settings")
              .select("tokens_used_this_month")
              .eq("club_id", params.clubId)
              .single();
            await supabase
              .from("club_ai_settings")
              .update({ tokens_used_this_month: (data?.tokens_used_this_month ?? 0) + total })
              .eq("club_id", params.clubId);
          }
        });
    }
  } else if (imageCount > 0) {
    await supabase.rpc("increment_ai_images", { p_club_id: params.clubId, p_amount: imageCount })
      .then(async (r) => {
        if (r.error) {
          const { data } = await supabase
            .from("club_ai_settings")
            .select("images_used_this_month")
            .eq("club_id", params.clubId)
            .single();
          await supabase
            .from("club_ai_settings")
            .update({ images_used_this_month: (data?.images_used_this_month ?? 0) + imageCount })
            .eq("club_id", params.clubId);
        }
      });
  }
}
