import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function StaffServicesPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const { data: services } = await supabase
    .from("services")
    .select("id, title, description, image_url, link, price")
    .eq("club_id", club.id)
    .eq("active", true)
    .order("display_order", { ascending: true });

  const list = services ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-6 pt-10 pb-12">
        <h1 className="text-2xl font-bold text-white">Services</h1>
        <p className="mt-1 text-gray-400 text-sm">{club.name}</p>
      </div>

      <div className="px-4 -mt-6 pb-10 max-w-md mx-auto space-y-3">
        {list.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No services yet</p>
            <p className="text-xs text-gray-400 mt-1">Services will appear here once created by admin.</p>
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
                    className="inline-block mt-3 text-xs font-medium text-blue-600 underline"
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
