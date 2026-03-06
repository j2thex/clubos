import type { Database } from "./database";

export type { Database };

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Club = Database["public"]["Tables"]["clubs"]["Row"];
export type ClubBranding = Database["public"]["Tables"]["club_branding"]["Row"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type Spin = Database["public"]["Tables"]["spins"]["Row"];
export type WheelConfig = Database["public"]["Tables"]["wheel_configs"]["Row"];

export type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
export type ClubInsert = Database["public"]["Tables"]["clubs"]["Insert"];
export type ClubBrandingInsert = Database["public"]["Tables"]["club_branding"]["Insert"];
export type MemberInsert = Database["public"]["Tables"]["members"]["Insert"];
export type SpinInsert = Database["public"]["Tables"]["spins"]["Insert"];
export type WheelConfigInsert = Database["public"]["Tables"]["wheel_configs"]["Insert"];
