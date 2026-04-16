import { PNG } from "pngjs";

// Post-processing helpers for generated images.
//
// Today we only strip a solid-white background into transparency. Reason:
// Nano Banana (Gemini 3.1 Flash Image) won't reliably return a PNG with a
// real alpha channel no matter how the prompt is worded — so the quest
// prompt instructs it to use a plain white background, and we punch the
// white out here before the bytes are uploaded to Supabase.
//
// The strip is shape-agnostic: any pixel near pure white goes transparent,
// regardless of whether the badge subject is a circle, triangle, hexagon,
// etc. The tradeoff is that genuine near-white pixels inside the subject
// also go transparent. Mitigate via the tower prompt: tell the model to
// stick to the brand color + darker shades inside the badge.

interface RemoveWhiteBgOptions {
  // Pixels with all three RGB channels >= threshold become fully
  // transparent. Default 240 leaves a little headroom for JPEG-ish noise.
  threshold?: number;
  // Width (in channel units) of the soft-edge ramp below the threshold.
  // Pixels whose min(RGB) is within [threshold-feather, threshold] get
  // a proportionally reduced alpha so the edge is anti-aliased instead
  // of a hard jagged cutoff. Default 30.
  feather?: number;
}

export async function removeWhiteBackground(
  bytes: Uint8Array,
  mediaType: string,
  options?: RemoveWhiteBgOptions,
): Promise<Uint8Array> {
  if (mediaType !== "image/png") {
    console.warn(
      "[removeWhiteBackground] skip: non-PNG input",
      mediaType,
    );
    return bytes;
  }

  const threshold = options?.threshold ?? 240;
  const feather = options?.feather ?? 30;
  const featherFloor = Math.max(0, threshold - feather);

  const png = await new Promise<PNG>((resolve, reject) => {
    new PNG().parse(Buffer.from(bytes), (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  // pngjs always gives us an RGBA buffer (channels=4) even for RGB inputs.
  const buf = png.data;
  const total = png.width * png.height;
  for (let i = 0; i < total; i++) {
    const o = i << 2;
    const r = buf[o];
    const g = buf[o + 1];
    const b = buf[o + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      buf[o + 3] = 0;
      continue;
    }
    const minRgb = r < g ? (r < b ? r : b) : (g < b ? g : b);
    if (minRgb >= featherFloor) {
      // Ramp alpha 255 → 0 across the feather zone.
      const t = (minRgb - featherFloor) / feather;
      const currentAlpha = buf[o + 3];
      buf[o + 3] = Math.min(currentAlpha, Math.round(255 * (1 - t)));
    }
  }

  const out = PNG.sync.write(png);
  return new Uint8Array(out);
}
