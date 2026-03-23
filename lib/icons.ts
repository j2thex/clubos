// Curated list of lucide-react icons relevant to clubs, events, and services
export const CONTENT_ICONS = [
  // Social & Marketing
  { name: "instagram", label: "Instagram" },
  { name: "tiktok", label: "TikTok" },
  { name: "youtube", label: "YouTube" },
  { name: "twitter", label: "Twitter" },
  { name: "facebook", label: "Facebook" },
  { name: "share-2", label: "Share" },
  { name: "megaphone", label: "Megaphone" },
  { name: "message-circle", label: "Message" },
  { name: "mail", label: "Email" },
  { name: "qr-code", label: "QR Code" },

  // Food & Drink
  { name: "beer", label: "Beer" },
  { name: "wine", label: "Wine" },
  { name: "coffee", label: "Coffee" },
  { name: "utensils", label: "Food" },
  { name: "pizza", label: "Pizza" },
  { name: "cake", label: "Cake" },
  { name: "cup-soda", label: "Drink" },

  // Entertainment & Music
  { name: "music", label: "Music" },
  { name: "headphones", label: "Headphones" },
  { name: "mic", label: "Microphone" },
  { name: "radio", label: "Radio" },
  { name: "tv", label: "Screen" },
  { name: "gamepad-2", label: "Gaming" },
  { name: "dice-5", label: "Dice" },
  { name: "party-popper", label: "Party" },

  // Sports & Fitness
  { name: "trophy", label: "Trophy" },
  { name: "medal", label: "Medal" },
  { name: "dumbbell", label: "Fitness" },
  { name: "bike", label: "Cycling" },
  { name: "footprints", label: "Walking" },
  { name: "mountain", label: "Hiking" },
  { name: "waves", label: "Swimming" },

  // Places & Travel
  { name: "map-pin", label: "Location" },
  { name: "map", label: "Map" },
  { name: "compass", label: "Compass" },
  { name: "plane", label: "Travel" },
  { name: "tent", label: "Camping" },
  { name: "building-2", label: "Building" },
  { name: "globe", label: "Globe" },
  { name: "home", label: "Home" },

  // Rewards & Tokens
  { name: "star", label: "Star" },
  { name: "heart", label: "Heart" },
  { name: "gift", label: "Gift" },
  { name: "gem", label: "Gem" },
  { name: "crown", label: "Crown" },
  { name: "zap", label: "Lightning" },
  { name: "flame", label: "Fire" },
  { name: "sparkles", label: "Sparkles" },

  // Actions & Objects
  { name: "camera", label: "Camera" },
  { name: "image", label: "Photo" },
  { name: "ticket", label: "Ticket" },
  { name: "calendar", label: "Calendar" },
  { name: "clock", label: "Clock" },
  { name: "tag", label: "Tag" },
  { name: "book-open", label: "Book" },
  { name: "bookmark", label: "Bookmark" },
  { name: "lock", label: "Lock" },
  { name: "key", label: "Key" },
  { name: "users", label: "Group" },
  { name: "user-plus", label: "Add User" },
  { name: "thumbs-up", label: "Like" },
  { name: "eye", label: "View" },
  { name: "shield-check", label: "Verified" },
] as const;

export type ContentIconName = (typeof CONTENT_ICONS)[number]["name"];
