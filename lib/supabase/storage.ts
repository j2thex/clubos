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

// --- Quest proof screenshots (bucket: quest-proofs) ---

export async function uploadQuestProof(
  clubId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  return uploadToBucket("quest-proofs", clubId, file);
}

// --- Member ID photos (bucket: member-ids, PRIVATE) ---
// Stores a storage path, not a public URL. Reads go through getMemberIdPhotoSignedUrl.

export async function uploadMemberIdPhoto(
  clubId: string,
  file: File,
): Promise<{ path: string } | { error: string }> {
  const supabase = createAdminClient();

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${clubId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("member-ids")
    .upload(filename, file, { contentType: file.type, upsert: false });

  if (error) return { error: "Failed to upload ID photo" };

  return { path: filename };
}

export async function deleteMemberIdPhoto(path: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.storage.from("member-ids").remove([path]);
}

export async function getMemberIdPhotoSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.storage
    .from("member-ids")
    .createSignedUrl(path, expiresInSeconds);
  return data?.signedUrl ?? null;
}

// --- Member portrait photos (bucket: member-photos, PRIVATE) ---
// Head-and-shoulders photo captured at onboarding. Mirrors the member-ids pattern.

export async function uploadMemberPhoto(
  clubId: string,
  file: File,
): Promise<{ path: string } | { error: string }> {
  const supabase = createAdminClient();

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${clubId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("member-photos")
    .upload(filename, file, { contentType: file.type, upsert: false });

  if (error) return { error: "Failed to upload member photo" };

  return { path: filename };
}

export async function deleteMemberPhoto(path: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.storage.from("member-photos").remove([path]);
}

export async function getMemberPhotoSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.storage
    .from("member-photos")
    .createSignedUrl(path, expiresInSeconds);
  return data?.signedUrl ?? null;
}

// --- Member signatures (bucket: member-signatures, PRIVATE) ---
// PNG exports from the canvas signature pad (or Signotec signoPAD later).

export async function uploadMemberSignature(
  clubId: string,
  file: File,
): Promise<{ path: string } | { error: string }> {
  const supabase = createAdminClient();

  const filename = `${clubId}/${crypto.randomUUID()}.png`;

  const { error } = await supabase.storage
    .from("member-signatures")
    .upload(filename, file, { contentType: "image/png", upsert: false });

  if (error) return { error: "Failed to upload signature" };

  return { path: filename };
}

export async function deleteMemberSignature(path: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.storage.from("member-signatures").remove([path]);
}

export async function getMemberSignatureSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.storage
    .from("member-signatures")
    .createSignedUrl(path, expiresInSeconds);
  return data?.signedUrl ?? null;
}

// --- Feedback screenshots (bucket: feedback) ---

export async function uploadFeedbackImage(
  file: File,
): Promise<{ url: string } | { error: string }> {
  const supabase = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("feedback")
    .upload(filename, file, { contentType: file.type, upsert: false });

  if (error) return { error: "Failed to upload screenshot" };

  const { data } = supabase.storage.from("feedback").getPublicUrl(filename);
  return { url: data.publicUrl };
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
