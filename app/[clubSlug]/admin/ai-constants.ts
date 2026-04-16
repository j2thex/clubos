// Default style hints shown as placeholders in the image-gen style input.
// Kept in their own module because ai-actions.ts is a "use server" file and
// can only export async functions — Next 16 throws at runtime if we try to
// export strings from there.
export const QUEST_IMAGE_DEFAULT_STYLE = "flat vector badge, circular, minimal";
export const EVENT_IMAGE_DEFAULT_STYLE = "vibrant event flyer, nightlife vibe";
