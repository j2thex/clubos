import * as icons from "lucide-react";
import type { LucideProps } from "lucide-react";

// Custom SVG icons not available in lucide-react
const CUSTOM_ICONS: Record<string, (props: LucideProps) => React.ReactElement> = {
  tiktok: ({ size = 24, className, ...rest }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...rest}
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.4a8.16 8.16 0 004.76 1.52V7.56a4.85 4.85 0 01-1-.87z" />
    </svg>
  ),
  "google-maps": ({ size = 24, className, ...rest }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...rest}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
    </svg>
  ),
};

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
  // Check custom icons first
  const CustomIcon = CUSTOM_ICONS[name];
  if (CustomIcon) return <CustomIcon {...props} />;

  const iconName = toPascalCase(name);
  const Icon = (icons as unknown as Record<string, icons.LucideIcon>)[iconName];
  if (!Icon) return null;
  return <Icon {...props} />;
}
