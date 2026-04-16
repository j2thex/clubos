import { Lock } from "lucide-react";

export function MembersOnlyTeaser({ count, locale }: { count: number; locale: string }) {
  if (count <= 0) return null;
  const text = locale === "es"
    ? `+${count} más para socios`
    : `+${count} more for members`;
  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4 mt-3 rounded-lg bg-gray-100/80 text-gray-500">
      <Lock className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{text}</span>
    </div>
  );
}
