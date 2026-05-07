import { redirect } from "next/navigation";

export default async function StaffConsoleIndex({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  redirect(`/${clubSlug}/staff/members`);
}
