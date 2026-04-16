import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AiPromptsClient } from "./client";

export const dynamic = "force-dynamic";

interface PromptRow {
  id: string;
  content_type: string;
  version: number;
  system_prompt: string;
  user_template: string;
  model: string;
  active: boolean;
  updated_by: string | null;
  updated_at: string;
}

export default async function AiPromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>;
}) {
  const { secret } = await searchParams;

  if (!secret || secret !== process.env.PLATFORM_ADMIN_SECRET) {
    redirect("/");
  }

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("ai_prompts")
    .select("id, content_type, version, system_prompt, user_template, model, active, updated_by, updated_at")
    .order("content_type", { ascending: true })
    .order("version", { ascending: false });

  const allRows = (rows ?? []) as PromptRow[];

  return <AiPromptsClient secret={secret} rows={allRows} />;
}
