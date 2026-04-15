import { PushForm } from "./push-form";

export default async function PushPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  return (
    <div className="p-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Push notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Send a test notification to all members who have subscribed on this club.
        </p>
      </div>
      <PushForm clubSlug={clubSlug} />
    </div>
  );
}
