export interface VerticalExample {
  slug: string;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  heroContent: string;
  sampleEvents: { title: string; description: string; date: string; time?: string; price?: number }[];
  sampleServices: { title: string; description: string; price: number | null }[];
  sampleQuests: { title: string; description: string; rewardSpins: number }[];
}

export const VERTICALS: VerticalExample[] = [
  {
    slug: "sports-clubs",
    name: "Barcelona FC Supporters",
    tagline: "Unite your sports community with memberships, events, and rewards",
    primaryColor: "#a50044",
    secondaryColor: "#004d98",
    heroContent: "Welcome to the club, {name}!",
    sampleEvents: [
      { title: "Match Day Viewing Party", description: "Watch the big game on our 4K screens with fellow supporters", date: "2026-03-28", time: "21:00", price: 5 },
      { title: "5-a-Side Tournament", description: "Monthly members tournament — sign up your team of 5", date: "2026-04-05", time: "10:00" },
      { title: "Season Ticket Lottery", description: "Members-only draw for discounted season tickets", date: "2026-04-15", time: "19:00" },
    ],
    sampleServices: [
      { title: "Official Kit", description: "Members get 20% off this season's official kit", price: 65 },
      { title: "Locker Rental", description: "Secure locker in the clubhouse — monthly", price: 15 },
      { title: "Guest Pass", description: "Bring a friend to any viewing party", price: 8 },
    ],
    sampleQuests: [
      { title: "Follow us on Instagram", description: "Follow @barca_supporters and show staff", rewardSpins: 1 },
      { title: "Attend 3 Match Days", description: "Come to three viewing parties this month", rewardSpins: 3 },
      { title: "Refer a Friend", description: "Bring a new member to the club", rewardSpins: 2 },
    ],
  },
  {
    slug: "coworking-spaces",
    name: "Hub Barcelona",
    tagline: "Manage your coworking community with smart membership tools",
    primaryColor: "#2563eb",
    secondaryColor: "#1e3a5f",
    heroContent: "Good morning, {name}!",
    sampleEvents: [
      { title: "Startup Pitch Night", description: "5 members pitch their ideas — pizza and drinks included", date: "2026-03-27", time: "18:30" },
      { title: "Workshop: AI for Freelancers", description: "Hands-on session on using AI tools in your workflow", date: "2026-04-02", time: "14:00", price: 10 },
      { title: "Friday Rooftop Social", description: "End the week with drinks and networking on the terrace", date: "2026-03-28", time: "17:00" },
    ],
    sampleServices: [
      { title: "Meeting Room (1hr)", description: "Private meeting room with whiteboard and screen", price: 12 },
      { title: "Mailbox Service", description: "Use our address for your business mail", price: 20 },
      { title: "Print Credits (50 pages)", description: "Color or B&W printing pack", price: 5 },
    ],
    sampleQuests: [
      { title: "Complete Your Profile", description: "Add your bio and photo to the member wall", rewardSpins: 1 },
      { title: "Leave a Google Review", description: "Share your experience to help us grow", rewardSpins: 2 },
      { title: "Refer a Freelancer", description: "Bring a new member and both get rewards", rewardSpins: 3 },
    ],
  },
  {
    slug: "coffee-shops",
    name: "Café Gòtic",
    tagline: "Reward your regulars and fill your events calendar",
    primaryColor: "#92400e",
    secondaryColor: "#451a03",
    heroContent: "Hey {name}, your usual?",
    sampleEvents: [
      { title: "Latte Art Workshop", description: "Learn to pour rosettas and hearts from our baristas", date: "2026-03-29", time: "11:00", price: 15 },
      { title: "Board Game Sunday", description: "Bring your games or try ours — free coffee with purchase", date: "2026-03-30", time: "16:00" },
      { title: "Coffee Tasting: Ethiopian Origins", description: "Cupping session with single-origin beans", date: "2026-04-06", time: "10:30", price: 8 },
    ],
    sampleServices: [
      { title: "Monthly Bean Bag", description: "250g of our featured roast, delivered or pickup", price: 14 },
      { title: "Reserved Workspace", description: "Guaranteed desk + Wi-Fi + 2 drinks, mornings only", price: 25 },
      { title: "Birthday Cake Order", description: "Custom cake from our bakery, 48h notice", price: 35 },
    ],
    sampleQuests: [
      { title: "Follow us on Instagram", description: "Follow @cafegotic for daily specials", rewardSpins: 1 },
      { title: "Try the Seasonal Menu", description: "Order any seasonal drink and snap a photo", rewardSpins: 1 },
      { title: "Bring a Friend", description: "Introduce someone new to Café Gòtic", rewardSpins: 2 },
    ],
  },
  {
    slug: "tourist-guides",
    name: "Walk Barcelona",
    tagline: "Build a loyal community of explorers with guided experiences",
    primaryColor: "#059669",
    secondaryColor: "#064e3b",
    heroContent: "Ready to explore, {name}?",
    sampleEvents: [
      { title: "Gothic Quarter Night Walk", description: "Discover hidden stories under the moonlight — 2 hours", date: "2026-03-28", time: "20:00", price: 18 },
      { title: "Gaudí Architecture Tour", description: "Sagrada Família to Casa Batlló with skip-the-line access", date: "2026-03-29", time: "10:00", price: 25 },
      { title: "Tapas & History Walk", description: "4 stops, 4 tapas, 400 years of stories", date: "2026-04-01", time: "13:00", price: 30 },
    ],
    sampleServices: [
      { title: "Private Tour (2hrs)", description: "Customized route for your group, up to 8 people", price: 90 },
      { title: "Photo Package", description: "Professional photos from your tour, delivered same day", price: 20 },
      { title: "Airport Pickup", description: "Meet-and-greet with city orientation briefing", price: 35 },
    ],
    sampleQuests: [
      { title: "Leave a TripAdvisor Review", description: "Share your experience to help other travelers", rewardSpins: 2 },
      { title: "Post a Photo", description: "Tag us on Instagram from your tour", rewardSpins: 1 },
      { title: "Complete 3 Tours", description: "Explore Barcelona from multiple angles", rewardSpins: 3 },
    ],
  },
  {
    slug: "catalonia-tours",
    name: "Catalunya Descoberta",
    tagline: "Showcase regional tours with membership perks and exclusive access",
    primaryColor: "#dc2626",
    secondaryColor: "#7f1d1d",
    heroContent: "Benvingut, {name}!",
    sampleEvents: [
      { title: "Montserrat Sunrise Hike", description: "Early morning trek with breakfast at the monastery", date: "2026-04-05", time: "06:30", price: 35 },
      { title: "Costa Brava Kayak Day", description: "Paddle hidden coves and swim in crystal water", date: "2026-04-12", time: "09:00", price: 45 },
      { title: "Wine & Cava Route", description: "Visit 3 wineries in Penedès with tastings and lunch", date: "2026-04-19", time: "10:00", price: 55 },
    ],
    sampleServices: [
      { title: "Custom Itinerary", description: "Personalized day plan based on your interests", price: 25 },
      { title: "Transport Add-On", description: "Round-trip from Barcelona to any tour start", price: 15 },
      { title: "Members Photo Book", description: "Printed memory book from all your tours", price: 40 },
    ],
    sampleQuests: [
      { title: "Follow us on Instagram", description: "Follow @catdescoberta for weekly highlights", rewardSpins: 1 },
      { title: "Visit All 4 Regions", description: "Complete tours in Costa Brava, Pyrenees, Penedès, and Delta", rewardSpins: 5 },
      { title: "Refer a Traveler", description: "Bring a friend on any tour", rewardSpins: 2 },
    ],
  },
  {
    slug: "bars",
    name: "El Xiringuito",
    tagline: "Turn regulars into members with spin rewards and exclusive events",
    primaryColor: "#7c3aed",
    secondaryColor: "#3b0764",
    heroContent: "Welcome back, {name}!",
    sampleEvents: [
      { title: "Cocktail Masterclass", description: "Learn to make 3 signature cocktails with our mixologist", date: "2026-03-27", time: "19:00", price: 20 },
      { title: "Trivia Thursday", description: "Teams of 4 — winning team gets a round on the house", date: "2026-03-27", time: "20:30" },
      { title: "Live Jazz Night", description: "Local quartet playing smooth jazz, no cover for members", date: "2026-03-29", time: "21:00" },
    ],
    sampleServices: [
      { title: "VIP Table Reservation", description: "Reserved booth for up to 6, includes a bottle", price: 60 },
      { title: "Birthday Package", description: "Decorated area, cake, and welcome shots for the group", price: 45 },
      { title: "Happy Hour Card", description: "10 drinks at happy hour prices, use any time", price: 30 },
    ],
    sampleQuests: [
      { title: "Post a Google Review", description: "Share your favorite drink and experience", rewardSpins: 2 },
      { title: "Try 5 Different Cocktails", description: "Explore our signature menu", rewardSpins: 3 },
      { title: "Bring a Group", description: "Come with 4+ friends on any night", rewardSpins: 2 },
    ],
  },
  {
    slug: "nightclubs",
    name: "Club Nocturna",
    tagline: "VIP memberships, guestlists, and reward spins for the nightlife scene",
    primaryColor: "#e11d48",
    secondaryColor: "#4a0519",
    heroContent: "The night is yours, {name}",
    sampleEvents: [
      { title: "Saturday Resident: DJ Luma", description: "Deep house and techno all night — free entry for members", date: "2026-03-28", time: "23:00" },
      { title: "Foam Party", description: "Annual foam night — pre-sale tickets for members", date: "2026-04-04", time: "23:30", price: 15 },
      { title: "Silent Disco", description: "Three channels, one dancefloor, zero noise complaints", date: "2026-04-11", time: "22:00", price: 12 },
    ],
    sampleServices: [
      { title: "VIP Table + Bottle", description: "Reserved table, premium bottle, and VIP area access", price: 120 },
      { title: "Guestlist Spot", description: "Guaranteed entry before midnight, skip the queue", price: null },
      { title: "Birthday VIP", description: "Free entry for 10, sparklers, and a champagne toast", price: 80 },
    ],
    sampleQuests: [
      { title: "Follow us on TikTok", description: "Follow @clubnocturna for event previews", rewardSpins: 1 },
      { title: "Attend 3 Events", description: "Check in at three different events this month", rewardSpins: 3 },
      { title: "Refer a VIP", description: "Bring someone who signs up for VIP membership", rewardSpins: 5 },
    ],
  },
  {
    slug: "barcelona-events",
    name: "BCN Agenda",
    tagline: "Your city events calendar with memberships and community perks",
    primaryColor: "#0891b2",
    secondaryColor: "#164e63",
    heroContent: "What's on today, {name}?",
    sampleEvents: [
      { title: "Mercè Festival Guide", description: "Curated itinerary for the best acts and locations", date: "2026-09-24", time: "18:00" },
      { title: "Primavera Sound Meetup", description: "Members pre-festival gathering with lineup tips", date: "2026-06-01", time: "17:00", price: 5 },
      { title: "Beach Volleyball Tournament", description: "Open tournament at Barceloneta — sign up as a team", date: "2026-04-12", time: "10:00" },
    ],
    sampleServices: [
      { title: "Weekly Events Newsletter", description: "Curated picks delivered every Monday", price: null },
      { title: "Priority Tickets", description: "Early access to sold-out events through our partners", price: 10 },
      { title: "Event Photography", description: "We cover your event — photos delivered in 24h", price: 50 },
    ],
    sampleQuests: [
      { title: "Follow us on Instagram", description: "Stay updated with @bcnagenda daily posts", rewardSpins: 1 },
      { title: "Attend a Community Event", description: "Show up to any BCN Agenda event and check in", rewardSpins: 1 },
      { title: "Share with Friends", description: "Forward the newsletter to 3 friends", rewardSpins: 2 },
    ],
  },
];

export function getVertical(slug: string): VerticalExample | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}
