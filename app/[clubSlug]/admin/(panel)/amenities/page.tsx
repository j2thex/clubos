import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AmenityManager } from "../../amenity-manager";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function AmenitiesPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const locale = await getServerLocale();

  // Fetch full catalog + club's enabled amenities
  const [{ data: catalog }, { data: clubAmenities }] = await Promise.all([
    supabase
      .from("amenity_catalog")
      .select("id, name, name_es, subtype, icon")
      .order("name", { ascending: true }),
    supabase
      .from("club_amenities")
      .select("id, amenity_id, orderable, price")
      .eq("club_id", club.id),
  ]);

  return (
    <div className="space-y-4">
      <Link
        href={`/${clubSlug}/admin/content`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t(locale, "admin.backToContent")}
      </Link>
      <AmenityManager
        catalog={(catalog ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          name_es: a.name_es,
          subtype: a.subtype,
          icon: a.icon ?? null,
        }))}
        clubAmenities={(clubAmenities ?? []).map((ca) => ({
          id: ca.id,
          amenity_id: ca.amenity_id,
          orderable: ca.orderable ?? false,
          price: ca.price != null ? Number(ca.price) : null,
        }))}
        clubId={club.id}
        clubSlug={clubSlug}
      />
    </div>
  );
}
