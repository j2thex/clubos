"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPassword, createOwnerToken, setOwnerCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginOwner(clubSlug: string, formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) return { error: "Invalid email or password" };

  const { data: owner } = await supabase
    .from("club_owners")
    .select("id, password_hash")
    .eq("email", email)
    .single();

  if (!owner) return { error: "Invalid email or password" };

  const { data: ownership } = await supabase
    .from("club_owner_clubs")
    .select("id")
    .eq("owner_id", owner.id)
    .eq("club_id", club.id)
    .single();

  if (!ownership) return { error: "Invalid email or password" };

  if (!verifyPassword(password, owner.password_hash)) {
    return { error: "Invalid email or password" };
  }

  const token = await createOwnerToken(owner.id, club.id);
  await setOwnerCookie(token);

  redirect(`/${clubSlug}/admin`);
}
