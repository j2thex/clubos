/**
 * Standard quest/event templates per club type.
 * Used by platform-admin to bootstrap content for new clubs.
 */

interface QuestTemplate {
  title: string;
  title_es: string;
  description: string | null;
  description_es: string | null;
  icon: string;
  reward_spins: number;
  quest_type: string;
  proof_mode: string;
  multi_use: boolean;
  is_public: boolean;
}

interface EventTemplate {
  title: string;
  title_es: string;
  description: string | null;
  description_es: string | null;
  icon: string;
}

export interface ClubTypeTemplate {
  label: string;
  quests: QuestTemplate[];
  events: EventTemplate[];
}

// --- Common quests shared by all club types ---
const COMMON_QUESTS: QuestTemplate[] = [
  {
    title: "Complete your first check-in",
    title_es: "Haz tu primer check-in",
    description: "Visit the club and ask staff to check you in",
    description_es: "Visita el club y pide al staff que te registre",
    icon: "map-pin",
    reward_spins: 1,
    quest_type: "default",
    proof_mode: "none",
    multi_use: false,
    is_public: true,
  },
  {
    title: "Invite a friend",
    title_es: "Invita a un amigo",
    description: "Share your referral link and bring someone new",
    description_es: "Comparte tu enlace de referencia y trae a alguien nuevo",
    icon: "user-plus",
    reward_spins: 2,
    quest_type: "referral",
    proof_mode: "none",
    multi_use: true,
    is_public: true,
  },
  {
    title: "Leave a Google review",
    title_es: "Deja una reseña en Google",
    description: "Help us grow by sharing your experience",
    description_es: "Ayúdanos a crecer compartiendo tu experiencia",
    icon: "star",
    reward_spins: 2,
    quest_type: "default",
    proof_mode: "optional",
    multi_use: false,
    is_public: true,
  },
  {
    title: "Follow us on Instagram",
    title_es: "Síguenos en Instagram",
    description: null,
    description_es: null,
    icon: "instagram",
    reward_spins: 1,
    quest_type: "default",
    proof_mode: "none",
    multi_use: false,
    is_public: true,
  },
  {
    title: "Share feedback",
    title_es: "Comparte tu opinión",
    description: "Tell us what you think and how we can improve",
    description_es: "Cuéntanos qué piensas y cómo podemos mejorar",
    icon: "message-circle",
    reward_spins: 1,
    quest_type: "feedback",
    proof_mode: "required",
    multi_use: true,
    is_public: false,
  },
];

// --- Club-type specific quests ---
const SMOKE_QUESTS: QuestTemplate[] = [
  {
    title: "Try 5 different strains",
    title_es: "Prueba 5 cepas diferentes",
    description: "Explore our menu variety",
    description_es: "Explora la variedad de nuestro menú",
    icon: "leaf",
    reward_spins: 3,
    quest_type: "default",
    proof_mode: "none",
    multi_use: false,
    is_public: false,
  },
  {
    title: "Attend a tasting session",
    title_es: "Asiste a una sesión de cata",
    description: null,
    description_es: null,
    icon: "wine",
    reward_spins: 2,
    quest_type: "default",
    proof_mode: "none",
    multi_use: false,
    is_public: true,
  },
];

const BAR_QUESTS: QuestTemplate[] = [
  {
    title: "Try our signature cocktail",
    title_es: "Prueba nuestro cóctel estrella",
    description: null,
    description_es: null,
    icon: "martini",
    reward_spins: 1,
    quest_type: "default",
    proof_mode: "none",
    multi_use: false,
    is_public: true,
  },
  {
    title: "Attend happy hour",
    title_es: "Asiste al happy hour",
    description: "Visit during happy hour and enjoy special prices",
    description_es: "Visítanos durante el happy hour y disfruta precios especiales",
    icon: "clock",
    reward_spins: 1,
    quest_type: "default",
    proof_mode: "none",
    multi_use: true,
    is_public: true,
  },
];

const SPORTS_QUESTS: QuestTemplate[] = [
  {
    title: "Watch a match with us",
    title_es: "Ve un partido con nosotros",
    description: "Join us for a live match screening",
    description_es: "Únete para ver un partido en vivo",
    icon: "tv",
    reward_spins: 1,
    quest_type: "default",
    proof_mode: "none",
    multi_use: true,
    is_public: true,
  },
  {
    title: "Join a team training",
    title_es: "Únete a un entrenamiento",
    description: null,
    description_es: null,
    icon: "dumbbell",
    reward_spins: 2,
    quest_type: "default",
    proof_mode: "none",
    multi_use: true,
    is_public: true,
  },
];

const COWORKING_QUESTS: QuestTemplate[] = [
  {
    title: "Book a meeting room",
    title_es: "Reserva una sala de reuniones",
    description: null,
    description_es: null,
    icon: "calendar",
    reward_spins: 1,
    quest_type: "default",
    proof_mode: "none",
    multi_use: true,
    is_public: false,
  },
  {
    title: "Attend a networking event",
    title_es: "Asiste a un evento de networking",
    description: "Meet fellow coworkers at our monthly mixer",
    description_es: "Conoce a otros compañeros en nuestro encuentro mensual",
    icon: "users",
    reward_spins: 2,
    quest_type: "default",
    proof_mode: "none",
    multi_use: true,
    is_public: true,
  },
];

const COFFEE_QUESTS: QuestTemplate[] = [
  {
    title: "Try our specialty coffee",
    title_es: "Prueba nuestro café de especialidad",
    description: null,
    description_es: null,
    icon: "coffee",
    reward_spins: 1,
    quest_type: "default",
    proof_mode: "none",
    multi_use: false,
    is_public: true,
  },
];

// --- Templates registry ---
export const CLUB_TYPE_TEMPLATES: Record<string, ClubTypeTemplate> = {
  smoke: {
    label: "Smoke / Cannabis Club",
    quests: [...COMMON_QUESTS, ...SMOKE_QUESTS],
    events: [
      { title: "Friday Tasting Night", title_es: "Noche de Cata del Viernes", description: "Weekly tasting session with new arrivals", description_es: "Sesión de cata semanal con novedades", icon: "wine" },
      { title: "Members Weekend Party", title_es: "Fiesta de Fin de Semana", description: null, description_es: null, icon: "music" },
    ],
  },
  bar: {
    label: "Bar / Nightlife",
    quests: [...COMMON_QUESTS, ...BAR_QUESTS],
    events: [
      { title: "Happy Hour", title_es: "Happy Hour", description: "Special prices every weekday evening", description_es: "Precios especiales cada tarde entre semana", icon: "clock" },
      { title: "Live Music Night", title_es: "Noche de Música en Vivo", description: null, description_es: null, icon: "music" },
      { title: "Weekend DJ Set", title_es: "DJ Set del Fin de Semana", description: null, description_es: null, icon: "headphones" },
    ],
  },
  sports: {
    label: "Sports Club",
    quests: [...COMMON_QUESTS, ...SPORTS_QUESTS],
    events: [
      { title: "Match Screening", title_es: "Transmisión de Partido", description: "Watch the big game together", description_es: "Ve el gran partido juntos", icon: "tv" },
      { title: "Weekly Training", title_es: "Entrenamiento Semanal", description: null, description_es: null, icon: "dumbbell" },
    ],
  },
  coworking: {
    label: "Coworking Space",
    quests: [...COMMON_QUESTS, ...COWORKING_QUESTS],
    events: [
      { title: "Monthly Networking Mixer", title_es: "Encuentro Mensual de Networking", description: "Connect with fellow members", description_es: "Conecta con otros miembros", icon: "users" },
      { title: "Workshop Wednesday", title_es: "Miércoles de Taller", description: null, description_es: null, icon: "presentation" },
    ],
  },
  coffee: {
    label: "Coffee Shop",
    quests: [...COMMON_QUESTS, ...COFFEE_QUESTS],
    events: [
      { title: "Barista Workshop", title_es: "Taller de Barista", description: "Learn latte art and brewing techniques", description_es: "Aprende arte latte y técnicas de preparación", icon: "coffee" },
    ],
  },
  general: {
    label: "General / Other",
    quests: COMMON_QUESTS,
    events: [
      { title: "Welcome Event", title_es: "Evento de Bienvenida", description: "Meet the community", description_es: "Conoce la comunidad", icon: "heart" },
    ],
  },
};

export const CLUB_TYPES = Object.entries(CLUB_TYPE_TEMPLATES).map(([key, val]) => ({
  key,
  label: val.label,
}));
