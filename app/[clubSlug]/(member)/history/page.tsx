import { redirect } from "next/navigation";

export default async function LegacyHistoryRedirect({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  redirect(`/${clubSlug}/bonuses`);
}
