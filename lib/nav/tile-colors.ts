export type SectionKey = "people" | "content" | "ops" | "finance" | "comms" | "system";

/**
 * Section → Tailwind gradient pair. Same section always renders the same hue
 * so admins/staff build muscle memory ("amber = ops").
 */
export const SECTION_GRADIENT: Record<SectionKey, string> = {
  people: "from-emerald-500 to-emerald-600",
  content: "from-violet-500 to-violet-600",
  ops: "from-amber-500 to-amber-600",
  finance: "from-lime-500 to-lime-600",
  comms: "from-sky-500 to-sky-600",
  system: "from-slate-500 to-slate-600",
};

/**
 * Order in which sections render inside the App Drawer.
 */
export const SECTION_ORDER: SectionKey[] = [
  "people",
  "content",
  "ops",
  "finance",
  "comms",
  "system",
];

export const SECTION_LABEL_KEY: Record<SectionKey, string> = {
  people: "nav.sections.people",
  content: "nav.sections.content",
  ops: "nav.sections.ops",
  finance: "nav.sections.finance",
  comms: "nav.sections.comms",
  system: "nav.sections.system",
};
