import { createAdminClient } from "@/lib/supabase/admin";
import { LoginForm } from "./login-form";

export default async function MemberLoginPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("login_mode")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  return <LoginForm loginMode={club?.login_mode ?? "code_only"} />;
}
