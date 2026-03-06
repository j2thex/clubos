import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const session = await getMemberFromCookie();

  if (!session) {
    redirect(`/${clubSlug}/login`);
  }

  return (
    <div className="min-h-screen club-page-bg">
      <div className="club-hero px-6 pt-10 pb-12 text-center">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <p className="mt-1 club-light-text text-sm">Upcoming club events</p>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full club-tint-bg flex items-center justify-center">
            <svg className="w-8 h-8 club-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold text-lg">No events yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Check back soon for upcoming club events.
          </p>
        </div>
      </div>
    </div>
  );
}
