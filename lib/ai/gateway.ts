// Resolves which AI Gateway model string to use for a given club.
//
// Auth: AI Gateway reads VERCEL_OIDC_TOKEN (auto on Vercel, `vercel env pull`
// locally) or AI_GATEWAY_API_KEY as fallback. No provider keys needed here.
//
// Per-club BYOK (own Anthropic/OpenAI key) is DEFERRED TO PHASE 6. When it
// lands, the BYOK branch will short-circuit out of the gateway and call the
// provider SDK directly with the decrypted key. The crypto helpers in
// ./crypto.ts are already in place for that.
//
// For Phase 0 everything routes through the gateway via plain
// "provider/model" strings consumed directly by `generateText`.

export type GatewayModelId = `${string}/${string}`;

export const DEFAULT_TEXT_MODEL: GatewayModelId = "anthropic/claude-sonnet-4.6";
export const DEFAULT_IMAGE_MODEL: GatewayModelId = "google/gemini-3.1-flash-image-preview";

export interface ModelResolution {
  modelId: GatewayModelId;
  byok: boolean;
}

// Phase 0: ignores clubId, always returns the prompt-configured gateway model.
// Phase 6: if club has BYOK configured, return a different branch indicating
// the caller should bypass the gateway.
export async function resolveModelForClub(
  _clubId: string,
  promptModel: string,
): Promise<ModelResolution> {
  const modelId = isGatewayModel(promptModel) ? promptModel : DEFAULT_TEXT_MODEL;
  return { modelId, byok: false };
}

function isGatewayModel(s: string): s is GatewayModelId {
  return /^[a-z0-9-]+\/[a-z0-9.\-]+$/i.test(s);
}
