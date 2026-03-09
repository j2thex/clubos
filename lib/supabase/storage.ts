import { createAdminClient } from "./admin";

// --- Event images (bucket: event-images) ---

export async function uploadEventImage(
  clubId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  return uploadToBucket("event-images", clubId, file);
}

export async function deleteEventImage(imageUrl: string): Promise<void> {
  return deleteFromBucket("event-images", imageUrl);
}

// --- Club images for quests/services (bucket: club-images) ---

export async function uploadClubImage(
  clubId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  return uploadToBucket("club-images", clubId, file);
}

export async function deleteClubImage(imageUrl: string): Promise<void> {
  return deleteFromBucket("club-images", imageUrl);
}

// --- Shared helpers ---

async function uploadToBucket(
  bucket: string,
  clubId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const supabase = createAdminClient();

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${clubId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) return { error: "Failed to upload image" };

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename);

  return { url: data.publicUrl };
}

async function deleteFromBucket(bucket: string, imageUrl: string): Promise<void> {
  const supabase = createAdminClient();

  const regex = new RegExp(`${bucket}/(.+)$`);
  const match = imageUrl.match(regex);
  if (!match) return;

  await supabase.storage.from(bucket).remove([match[1]]);
}
