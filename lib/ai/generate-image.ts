import { createAdminClient } from "@/lib/supabase/admin";
import { checkQuota, recordUsage } from "./quota";

// Nano Banana (Gemini 3 Flash Image) wrapper.
//
// Phase 0 status: SCAFFOLD ONLY. Phase 4 will wire the real provider call.
// This function is intentionally throws-not-implemented so nothing can ship
// to production with a silent stub. The signature is locked so Phase 4
// only has to replace the body.
//
// Phase 4 plan:
//   1. Use AI Gateway model string "google/gemini-3.1-flash-image-preview"
//      with generateText({ model, prompt }) — multimodal LLM returns images
//      in result.files filtered by mediaType.startsWith('image/').
//   2. Take the returned bytes, wrap in a File, push through
//      uploadClubImage(clubId, file) from lib/supabase/storage.ts.
//   3. Return { url, storagePath }.
//   4. Call recordUsage({ kind: 'image', imageCount: 1 }).

export interface GenerateImageArgs {
  clubId: string;
  ownerId?: string | null;
  contentType: "quest" | "event" | "offer" | "badge";
  prompt: string;
  aspectRatio?: "1:1" | "4:3" | "16:9";
}

export interface GenerateImageResult {
  url: string;
  storagePath: string;
}

export async function generateImage(args: GenerateImageArgs): Promise<GenerateImageResult> {
  const quota = await checkQuota(args.clubId, "image");
  if (!quota.allowed) throw new Error(quota.reason ?? "Image quota exceeded");

  // Touch supabase client so the import isn't tree-shaken before Phase 4.
  void createAdminClient;
  void recordUsage;
  void args;

  throw new Error("generateImage: not implemented (Phase 4)");
}
