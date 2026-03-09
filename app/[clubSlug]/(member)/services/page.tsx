import { redirect } from "next/navigation";
import { getMemberFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const session = await getMemberFromCookie();

  if (!session) {
    redirect(`/${clubSlug}/login`);
  }

  const supabase = createAdminClient();

  const { data: services } = await supabase
    .from("services")
    .select("id, title, description, image_url, link, price")
    .eq("club_id", session.club_id)
    .eq("active", true)
    .order("display_order", { ascending: true });

  const list = services ?? [];

  return (
    <div className="min-h-screen club-page-bg">
      <div className="club-hero px-6 pt-10 pb-12 text-center">
        <h1 className="text-2xl font-bold text-white">Services</h1>
        <p className="mt-1 club-light-text text-sm">Available club services</p>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-md mx-auto space-y-3">
        {list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full club-tint-bg flex items-center justify-center">
              <svg className="w-8 h-8 club-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-gray-700 font-semibold text-lg">No services yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Club services will be available here.
            </p>
          </div>
        ) : (
          list.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow overflow-hidden">
              {s.image_url && (
                <img src={s.image_url} alt="" className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{s.title}</p>
                    {s.description && (
                      <p className="text-xs text-gray-500 mt-1">{s.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {s.price != null ? (
                      <span className="text-sm font-bold text-gray-900">${Number(s.price).toFixed(2)}</span>
                    ) : (
                      <span className="text-sm font-bold text-green-600">Free</span>
                    )}
                  </div>
                </div>
                {s.link && (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-xs font-medium club-primary underline"
                  >
                    Learn more
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
