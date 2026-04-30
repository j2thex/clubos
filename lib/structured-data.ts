import type { DayKey, WorkingHours } from "@/lib/working-hours";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://osocios.club";

const DAY_KEY_TO_SCHEMA: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

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

export interface ClubJsonLdInput {
  name: string;
  slug: string;
  logo_url?: string | null;
  tags?: string[] | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  working_hours?: WorkingHours | null;
  social_instagram?: string | null;
  social_telegram?: string | null;
  social_google_maps?: string | null;
  social_website?: string | null;
}

export function getClubJsonLd(club: ClubJsonLdInput) {
  const hasGeo = club.latitude != null && club.longitude != null;
  const hasAddress = Boolean(club.address || club.city);
  const isLocalBusiness = hasAddress || hasGeo;

  const sameAs = [
    club.social_website,
    club.social_instagram,
    club.social_telegram,
    club.social_google_maps,
  ].filter((u): u is string => Boolean(u));

  const openingHoursSpecification = club.working_hours
    ? (Object.entries(club.working_hours)
        .filter(([, entry]) => entry !== null && entry !== undefined)
        .map(([day, entry]) => {
          const schemaDay = DAY_KEY_TO_SCHEMA[day as DayKey];
          if (!schemaDay || !entry) return null;
          return {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: `https://schema.org/${schemaDay}`,
            opens: entry.open,
            closes: entry.close,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null))
    : [];

  return {
    "@context": "https://schema.org",
    "@type": isLocalBusiness ? "LocalBusiness" : "Organization",
    name: club.name,
    url: `${SITE_URL}/${club.slug}/public`,
    ...(club.logo_url && { logo: club.logo_url, image: club.logo_url }),
    ...(club.tags && club.tags.length > 0 && {
      keywords: club.tags.join(", "),
    }),
    ...(hasAddress && {
      address: {
        "@type": "PostalAddress",
        ...(club.address && { streetAddress: club.address }),
        ...(club.city && { addressLocality: club.city }),
        ...(club.country && { addressCountry: club.country }),
      },
    }),
    ...(hasGeo && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: club.latitude,
        longitude: club.longitude,
      },
    }),
    ...(openingHoursSpecification.length > 0 && {
      openingHoursSpecification,
    }),
    ...(sameAs.length > 0 && { sameAs }),
    memberOf: {
      "@type": "Organization",
      name: "osocios.club",
      url: SITE_URL,
    },
  };
}

export interface EventJsonLdInput {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  price?: number | null;
  image_url?: string | null;
  link?: string | null;
}

export interface EventClubContext {
  name: string;
  slug: string;
  timezone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

export function getEventJsonLd(
  event: EventJsonLdInput,
  club: EventClubContext,
) {
  const startDate = event.time
    ? `${event.date}T${event.time}:00`
    : event.date;

  const url = event.link || `${SITE_URL}/${club.slug}/public`;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(event.description && { description: event.description }),
    ...(event.image_url && { image: event.image_url }),
    url,
    location: {
      "@type": "Place",
      name: club.name,
      ...((club.address || club.city) && {
        address: {
          "@type": "PostalAddress",
          ...(club.address && { streetAddress: club.address }),
          ...(club.city && { addressLocality: club.city }),
          ...(club.country && { addressCountry: club.country }),
        },
      }),
    },
    organizer: {
      "@type": "Organization",
      name: club.name,
      url: `${SITE_URL}/${club.slug}/public`,
    },
    ...(event.price != null && {
      offers: {
        "@type": "Offer",
        price: event.price,
        priceCurrency: "EUR",
        url,
        availability: "https://schema.org/InStock",
      },
    }),
  };
}

export interface OfferCatalogItem {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
}

export function getOfferCatalogJsonLd(
  club: { name: string; slug: string },
  offers: OfferCatalogItem[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: `Offers at ${club.name}`,
    url: `${SITE_URL}/${club.slug}/public`,
    itemListElement: offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      ...(offer.description && { description: offer.description }),
      ...(offer.image_url && { image: offer.image_url }),
    })),
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

export function getBreadcrumbListJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getFaqPageJsonLd(
  qas: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qas.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer,
      },
    })),
  };
}
