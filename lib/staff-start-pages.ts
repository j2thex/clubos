export type StaffStartPage = {
  value: string;
  label: string;
  requiresOps?: boolean;
};

export const STAFF_START_PAGES: StaffStartPage[] = [
  { value: "/staff/members", label: "Members" },
  { value: "/staff/operations/sell", label: "Operations: Sell", requiresOps: true },
  { value: "/staff/operations/entry", label: "Operations: Door / Entry", requiresOps: true },
  { value: "/staff/events", label: "Events" },
  { value: "/staff/quest", label: "Quests" },
  { value: "/staff/offers", label: "Offers" },
  { value: "/staff/spin", label: "Spin" },
  { value: "/staff/preregistrations", label: "Pre-registrations" },
];

export function isAllowedStartPage(value: string | null, opsEnabled: boolean): boolean {
  if (!value) return false;
  const entry = STAFF_START_PAGES.find((p) => p.value === value);
  if (!entry) return false;
  if (entry.requiresOps && !opsEnabled) return false;
  return true;
}
