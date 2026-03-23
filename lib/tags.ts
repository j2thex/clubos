import type { Locale } from "./i18n";

export interface PredefinedTag {
  value: string;
  en: string;
  es: string;
}

export const PREDEFINED_TAGS: PredefinedTag[] = [
  { value: "bar", en: "Bar", es: "Bar" },
  { value: "restaurant", en: "Restaurant", es: "Restaurante" },
  { value: "coffee-shop", en: "Coffee Shop", es: "Cafetería" },
  { value: "nightclub", en: "Nightclub", es: "Discoteca" },
  { value: "coworking", en: "Coworking", es: "Coworking" },
  { value: "sports-club", en: "Sports Club", es: "Club Deportivo" },
  { value: "smoking-club", en: "Smoking Club", es: "Club de Fumadores" },
  { value: "rooftop", en: "Rooftop", es: "Azotea" },
  { value: "salon", en: "Salon", es: "Salón de Belleza" },
  { value: "dentist", en: "Dentist", es: "Dentista" },
  { value: "photographer", en: "Photographer", es: "Fotógrafo" },
  { value: "tour-guide", en: "Tour Guide", es: "Guía Turístico" },
  { value: "gym", en: "Gym", es: "Gimnasio" },
  { value: "events", en: "Events", es: "Eventos" },
  { value: "community", en: "Community", es: "Comunidad" },
];

/** Get the localized label for a tag value. Falls back to the raw value for custom tags. */
export function getTagLabel(value: string, locale: Locale): string {
  const tag = PREDEFINED_TAGS.find((t) => t.value === value);
  if (tag) return locale === "es" ? tag.es : tag.en;
  // Custom tag — capitalize first letter
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

/**
 * Mapping of tag values to offer catalog names that should be auto-enabled during onboarding.
 * Names must match `offer_catalog.name` exactly.
 */
export const TAG_OFFER_SUGGESTIONS: Record<string, string[]> = {
  "bar": ["Cocktails", "Craft Beer", "Live Music", "DJ", "VIP Table", "Bottle Service"],
  "restaurant": ["Food Menu", "Coffee", "VIP Table", "Private Room", "Birthday Service"],
  "coffee-shop": ["Coffee", "WiFi", "Snacks", "Food Menu"],
  "nightclub": ["DJ", "Dance Floor", "VIP Table", "Bottle Service", "Coat Check", "Live Music"],
  "coworking": ["WiFi", "Private Room", "Coffee", "Networking", "Education"],
  "sports-club": ["Sports on TV", "Networking", "Competitions", "Snacks", "Drinks"],
  "smoking-club": ["Hash", "Kief", "Vape", "Edibles", "Bongs", "Pre-roll Maker", "Extractions", "Cali", "Gravity Hookah", "Volcano", "Vaporizer"],
  "rooftop": ["Cocktails", "DJ", "Outdoor Terrace", "Snacks"],
  "salon": ["Birthday Service", "VIP Table"],
  "gym": ["Competitions", "Snacks", "Drinks", "Networking"],
  "events": ["Live Music", "DJ", "Dance Floor", "Karaoke", "Trivia Night", "Networking"],
};
