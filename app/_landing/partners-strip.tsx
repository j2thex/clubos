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
        <h2 className="text-lg font-bold text-landing-text mb-8">
          {localized("Partners", "Socios", locale)}
        </h2>

        <div className="flex flex-wrap justify-center gap-4">
          {partners.map((p) => (
            <a
              key={p.id}
              href={p.website_url}
              target="_blank"
              rel="noopener noreferrer"
              title={p.name}
              aria-label={p.name}
              className="w-40 h-24 sm:w-48 sm:h-28 rounded-xl bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="relative w-full h-full block">
                <Image
                  src={p.logo_url}
                  alt={p.name}
                  fill
                  sizes="(min-width: 640px) 192px, 160px"
                  className="object-contain"
                />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
