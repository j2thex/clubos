"use server";

import { clearMemberCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function logout(clubSlug: string) {
  await clearMemberCookie();
  redirect(`/${clubSlug}/login`);
}
