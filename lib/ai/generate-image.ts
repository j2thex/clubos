import { generateText } from "ai";
import { uploadClubImage, uploadEventImage } from "@/lib/supabase/storage";
import { checkQuota, recordUsage } from "./quota";
import { DEFAULT_IMAGE_MODEL } from "./gateway";
import { removeWhiteBackground } from "./post-process-image";

// Generates an image via Gemini 3.1 Flash Image ("Nano Banana") through
// the Vercel AI Gateway, uploads the bytes to the appropriate Supabase
// bucket, and returns the public URL.
//
// The model returns images as generated files on the result — we filter
// by mediaType.startsWith('image/'), take the first one, and upload it.
//
// bucket option: 'club' → club-images bucket (default, used for quests,
// badges, offers), 'event' → event-images bucket. The storage helpers
// are selected to match the existing upload functions in
// lib/supabase/storage.ts so images end up where the rest of the app
// expects them.

export interface GenerateImageArgs {
  clubId: string;
  ownerId?: string | null;
  contentType: "quest" | "event" | "offer" | "badge";
  prompt: string;
  bucket?: "club" | "event";
  // Optional post-processing. "removeWhiteBg" strips any pixel near pure
  // white into transparency (used for quest badges because Nano Banana
  // won't reliably return a real alpha channel — we prompt it to draw on
  // solid white and strip that white here before upload).
  postProcess?: "removeWhiteBg";
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
    const sourceMediaType = img.mediaType ?? "image/png";
    let bytes: Uint8Array = img.uint8Array;
    let mediaType = sourceMediaType;
    let ext = mediaType.split("/")[1]?.split("+")[0] ?? "png";

    if (args.postProcess === "removeWhiteBg") {
      bytes = await removeWhiteBackground(bytes, sourceMediaType);
      // If the source was a PNG we've re-encoded as PNG; if it wasn't a
      // PNG the helper returned the original bytes unchanged, so keep the
      // source media type/ext in that case.
      if (sourceMediaType === "image/png") {
        mediaType = "image/png";
        ext = "png";
      }
    }

    // Wrap the bytes in a File so we can reuse the existing upload helpers.
    const file = new File(
      [bytes as unknown as BlobPart],
      `ai-${Date.now()}.${ext}`,
      { type: mediaType },
    );

    const uploader =
      args.bucket === "event" ? uploadEventImage : uploadClubImage;
    const uploaded = await uploader(args.clubId, file);
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
