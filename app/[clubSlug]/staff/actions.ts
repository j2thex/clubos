"use server";

import { clearStaffCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function logoutStaff(clubSlug: string) {
  await clearStaffCookie();
  redirect(`/${clubSlug}/staff/login`);
}
