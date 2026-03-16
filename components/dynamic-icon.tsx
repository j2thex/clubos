import * as icons from "lucide-react";
import type { LucideProps } from "lucide-react";

// Convert kebab-case to PascalCase (e.g., "map-pin" -> "MapPin")
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export function DynamicIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const iconName = toPascalCase(name);
  const Icon = (icons as unknown as Record<string, icons.LucideIcon>)[iconName];
  if (!Icon) return null;
  return <Icon {...props} />;
}
