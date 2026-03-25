const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://osocios.club";

export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "osocios.club",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-512.png`,
    description:
      "White-label membership platform for private clubs. Manage members, gamify engagement, run events, and operate daily — all under your brand.",
    foundingLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Barcelona",
        addressCountry: "ES",
      },
    },
  };
}

export function getWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "osocios.club",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/discover?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function getClubJsonLd(club: {
  name: string;
  slug: string;
  logo_url?: string | null;
  tags?: string[] | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: club.name,
    url: `${SITE_URL}/${club.slug}/public`,
    ...(club.logo_url && { logo: club.logo_url }),
    ...(club.tags && club.tags.length > 0 && { keywords: club.tags.join(", ") }),
    ...(club.address || club.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(club.address && { streetAddress: club.address }),
            ...(club.city && { addressLocality: club.city }),
            ...(club.country && { addressCountry: club.country }),
          },
        }
      : {}),
    memberOf: {
      "@type": "Organization",
      name: "osocios.club",
      url: SITE_URL,
    },
  };
}

export function getItemListJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
