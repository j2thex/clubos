import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { LandingFooter } from "../_landing/landing-footer";
import { ContactForm } from "../_landing/contact-form";
import { TopNav } from "../_landing/top-nav";

export const metadata: Metadata = {
  title: "Contact — osocios.club",
  description:
    "Talk to the team behind osocios.club. WhatsApp or email, answered personally from Barcelona.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const locale = await getServerLocale();
  const tr = (key: string, params?: Record<string, string | number>) =>
    t(locale, key, params);

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "34607349242";
  const whatsappHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola osocios.club!")}`;

  return (
    <div className="min-h-screen landing-dark">
      <TopNav />
      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <h1 className="text-4xl sm:text-5xl font-extralight tracking-tight">
          {tr("contact.title")}
        </h1>
        <p className="mt-4 opacity-70 max-w-lg">{tr("contact.subtitle")}</p>

        <div className="mt-10 rounded-2xl bg-landing-surface border border-landing-border-subtle p-6">
          <h2 className="text-lg font-medium">{tr("contact.whatsappTitle")}</h2>
          <p className="mt-1 text-sm opacity-60">{tr("contact.whatsappDesc")}</p>
          <Link
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-500"
          >
            {tr("contact.whatsappCta")} →
          </Link>
        </div>

        <div className="mt-6 rounded-2xl bg-landing-surface border border-landing-border-subtle p-6">
          <h2 className="text-lg font-medium">{tr("contact.emailTitle")}</h2>
          <p className="mt-1 text-sm opacity-60">{tr("contact.emailDesc")}</p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>

        <p className="mt-8 text-xs opacity-50">{tr("contact.location")}</p>
      </section>

      <LandingFooter t={tr} />
    </div>
  );
}
