import { generateText } from "ai";
import { uploadClubImage } from "@/lib/supabase/storage";
import { checkQuota, recordUsage } from "./quota";
import { DEFAULT_IMAGE_MODEL } from "./gateway";

// Generates an image via Gemini 3.1 Flash Image ("Nano Banana") through
// the Vercel AI Gateway, uploads the bytes to the club-images bucket,
// and returns the public URL.
//
// The model returns images as generated files on the result — we filter
// by mediaType.startsWith('image/'), take the first one, and upload it.

export interface GenerateImageArgs {
  clubId: string;
  ownerId?: string | null;
  contentType: "quest" | "event" | "offer" | "badge";
  prompt: string;
}

export interface GenerateImageResult {
  url: string;
  mediaType: string;
}

export async function generateImage(args: GenerateImageArgs): Promise<GenerateImageResult> {
  const quota = await checkQuota(args.clubId, "image");
  if (!quota.allowed) throw new Error(quota.reason ?? "Image quota exceeded");

  try {
    const result = await generateText({
      model: DEFAULT_IMAGE_MODEL,
      prompt: args.prompt,
      providerOptions: {
        gateway: {
          tags: [
            `feature:ai-assist`,
            `content:${args.contentType}`,
            `kind:image`,
            `club:${args.clubId}`,
          ],
        },
      },
    });

    const images = (result.files ?? []).filter((f) =>
      f.mediaType?.startsWith("image/"),
    );
    if (images.length === 0) {
      throw new Error("Image model returned no image files");
    }

    const img = images[0];
    const mediaType = img.mediaType ?? "image/png";
    const ext = mediaType.split("/")[1]?.split("+")[0] ?? "png";

    // Wrap the bytes in a File so we can reuse uploadClubImage.
    const file = new File(
      [img.uint8Array as unknown as BlobPart],
      `ai-${Date.now()}.${ext}`,
      { type: mediaType },
    );

    const uploaded = await uploadClubImage(args.clubId, file);
    if ("error" in uploaded) {
      throw new Error(`Upload failed: ${uploaded.error}`);
    }

    await recordUsage({
      clubId: args.clubId,
      ownerId: args.ownerId ?? null,
      contentType: args.contentType,
      kind: "image",
      model: DEFAULT_IMAGE_MODEL,
      imageCount: 1,
      status: "success",
    });

    return { url: uploaded.url, mediaType };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    await recordUsage({
      clubId: args.clubId,
      ownerId: args.ownerId ?? null,
      contentType: args.contentType,
      kind: "image",
      model: DEFAULT_IMAGE_MODEL,
      status: "error",
      errorMessage: msg.slice(0, 500),
    });
    throw err;
  }
}
