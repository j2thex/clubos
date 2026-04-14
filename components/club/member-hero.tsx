import Image from "next/image";
import { SocialLinks } from "@/components/club/social-links";

interface MemberHeroProps {
  displayName: string;
  greeting: string;
  caption: string;
  coverUrl: string | null;
  logoUrl: string | null;
  clubName: string;
  social?: {
    instagram?: string | null;
    whatsapp?: string | null;
    telegram?: string | null;
    googleMaps?: string | null;
    website?: string | null;
  };
}

/**
 * Editorial hero — photo-forward, dark gradient overlay, display-type
 * greeting bottom-left with uppercase caption beneath. Used on the Quests
 * landing page. Server component, uses next/image with priority.
 */
export function MemberHero({
  displayName,
  greeting,
  caption,
  coverUrl,
  logoUrl,
  clubName,
  social,
}: MemberHeroProps) {
  const resolvedGreeting = greeting.replace("{name}", displayName);

  const hasSocial =
    social &&
    (social.instagram ||
      social.whatsapp ||
      social.telegram ||
      social.googleMaps ||
      social.website);

  return (
    <section
      className="relative h-[260px] w-full overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={clubName}
          fill
          priority
          sizes="(max-width: 448px) 100vw, 448px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 club-hero" />
      )}

      {/* Dark gradient — transparent top, deep black bottom — editorial readable */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.30) 45%, rgba(0,0,0,0.78) 100%)",
        }}
      />

      {logoUrl ? (
        <div className="absolute left-5 top-5">
          <Image
            src={logoUrl}
            alt={`${clubName} logo`}
            width={44}
            height={44}
            className="h-11 w-11 rounded-[var(--m-radius-sm)] object-cover ring-1 ring-white/30"
          />
        </div>
      ) : null}

      {hasSocial ? (
        <div className="absolute right-5 top-5">
          <SocialLinks
            instagram={social.instagram}
            whatsapp={social.whatsapp}
            telegram={social.telegram}
            googleMaps={social.googleMaps}
            website={social.website}
            variant="light"
          />
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
        <p className="m-caption text-white/70">{caption}</p>
        <h1 className="m-display mt-2 text-white">{resolvedGreeting}</h1>
      </div>
    </section>
  );
}
