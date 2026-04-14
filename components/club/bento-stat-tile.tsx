import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

type Tone = "editorial" | "gamified";

interface BentoStatTileProps {
  caption: string;
  value: ReactNode;
  href?: string;
  tone?: Tone;
  imageUrl?: string | null;
  imageAlt?: string;
  span?: 1 | 2;
  valueClassName?: string;
}

/**
 * Reusable bento grid tile. Used in the Quests landing bento strip and the
 * Profile stat strip. Tiles share: hairline border, raised elevation,
 * 4px radius, uppercase caption label, emphasized value below.
 */
export function BentoStatTile({
  caption,
  value,
  href,
  tone = "editorial",
  imageUrl,
  imageAlt,
  span = 1,
  valueClassName = "",
}: BentoStatTileProps) {
  const spanClass = span === 2 ? "col-span-2" : "col-span-1";
  const toneClass =
    tone === "gamified"
      ? "bg-[color:var(--m-surface)] border-[color:var(--m-border)]"
      : "bg-[color:var(--m-surface)] border-[color:var(--m-border)]";

  const content = (
    <div
      className={`${spanClass} relative flex h-full min-h-[96px] flex-col justify-between overflow-hidden border p-4 ${toneClass}`}
      style={{
        borderRadius: "var(--m-radius-sm)",
        boxShadow: "var(--m-elev-raised)",
      }}
    >
      {imageUrl ? (
        <div className="absolute inset-0 opacity-15">
          <Image
            src={imageUrl}
            alt={imageAlt ?? ""}
            fill
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="relative flex h-full flex-col justify-between gap-2">
        <span className="m-caption">{caption}</span>
        <div
          className={`font-semibold leading-tight text-[color:var(--m-ink)] ${valueClassName || "text-lg"}`}
        >
          {value}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block transition-transform active:scale-[0.98]"
      >
        {content}
      </Link>
    );
  }

  return content;
}
