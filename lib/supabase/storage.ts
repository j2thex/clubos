import { createAdminClient } from "./admin";

export async function uploadEventImage(
  clubId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const supabase = createAdminClient();

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${clubId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("event-images")
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) return { error: "Failed to upload image" };

  const { data } = supabase.storage
    .from("event-images")
    .getPublicUrl(filename);

  return { url: data.publicUrl };
}

export async function deleteEventImage(imageUrl: string): Promise<void> {
  const supabase = createAdminClient();

  // Extract path from full URL: .../event-images/clubId/filename.ext
  const match = imageUrl.match(/event-images\/(.+)$/);
  if (!match) return;

  await supabase.storage.from("event-images").remove([match[1]]);
}
