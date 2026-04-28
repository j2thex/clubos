export interface DiscoverClub {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tags: string[] | null;
  logo_url: string | null;
  primary_color: string | null;
  working_hours: import("@/lib/working-hours").WorkingHours | null;
  timezone: string | null;
}

export interface DiscoverEvent {
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  date: string;
  time: string | null;
  price: number | null;
  image_url: string | null;
  icon: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  club_name: string;
  club_slug: string;
  club_logo: string | null;
  club_primary_color: string | null;
  club_latitude: number | null;
  club_longitude: number | null;
}

export interface DiscoverOffer {
  id: string;
  offer_name: string;
  offer_name_es: string | null;
  subtype: string;
  icon: string | null;
  description: string | null;
  description_es: string | null;
  price: number | null;
  image_url: string | null;
  club_name: string;
  club_slug: string;
  club_logo: string | null;
  club_primary_color: string | null;
  club_latitude: number | null;
  club_longitude: number | null;
}

export interface DiscoverQuest {
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  reward_spins: number;
  icon: string | null;
  image_url: string | null;
  deadline: string | null;
  club_name: string;
  club_slug: string;
  club_logo: string | null;
  club_primary_color: string | null;
  club_latitude: number | null;
  club_longitude: number | null;
}

export type ActiveTab = "clubs" | "events" | "offers" | "quests";

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

// Default center: Catalonia
export const DEFAULT_VIEWPORT: MapViewport = {
  latitude: 41.39,
  longitude: 2.17,
  zoom: 11,
};
