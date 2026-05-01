import Image from "next/image";
import { localized, type Locale } from "@/lib/i18n";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string;
}

interface Props {
  partners: Partner[];
  locale: Locale;
}

export function PartnersStrip({ partners, locale }: Props) {
  if (partners.length === 0) return null;

  return (
    <section className="px-6 py-12 border-t border-landing-border-subtle">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-lg font-bold text-landing-text mb-6">
          {localized("Partners", "Socios", locale)}
        </h2>

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:flex-wrap md:overflow-visible md:justify-start">
          {partners.map((p) => (
            <a
              key={p.id}
              href={p.website_url}
              target="_blank"
              rel="noopener noreferrer"
              title={p.name}
              className="flex-shrink-0 snap-start w-32 h-20 rounded-xl bg-landing-surface hover:bg-landing-surface-hover transition-colors flex items-center justify-center p-3 group"
            >
              <span className="relative w-full h-full block">
                <Image
                  src={p.logo_url}
                  alt={p.name}
                  fill
                  sizes="128px"
                  className="object-contain brightness-0 invert opacity-70 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0 transition duration-300"
                />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
