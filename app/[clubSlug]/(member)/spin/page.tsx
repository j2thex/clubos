import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import SpinWheel from "@/components/club/spin-wheel";
import { performSpin } from "./actions";

export default async function SpinPage() {
  const memberPayload = await getMemberFromCookie();
  if (!memberPayload) redirect("/");

  const supabase = createAdminClient();

  // Fetch member balance
  const { data: member } = await supabase
    .from("members")
    .select("spin_balance")
    .eq("id", memberPayload.member_id)
    .single();

  // Fetch wheel segments
  const { data: segments } = await supabase
    .from("wheel_configs")
    .select("label, color, label_color, probability")
    .eq("club_id", memberPayload.club_id)
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (!segments || segments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Wheel not configured yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 club-page-bg">
      <SpinWheel
        segments={segments.map((s) => ({
          label: s.label,
          color: s.color ?? "#16a34a",
          labelColor: s.label_color ?? "#ffffff",
          probability: Number(s.probability),
        }))}
        balance={member?.spin_balance ?? 0}
        onSpin={performSpin}
      />
    </div>
  );
}
