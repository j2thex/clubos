import { notFound } from "next/navigation";
import { VERTICALS, getVertical } from "../verticals";
import { ExamplePortal } from "../example-portal";
import type { Metadata } from "next";

export function generateStaticParams() {
  return VERTICALS.map((v) => ({ vertical: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>;
}): Promise<Metadata> {
  const { vertical: slug } = await params;
  const vertical = getVertical(slug);
  if (!vertical) return { title: "Example | osocios.club" };

  return {
    title: `${vertical.name} — Example`,
    description: vertical.tagline,
    alternates: {
      canonical: `/examples/${slug}`,
      languages: {
        en: `/examples/${slug}`,
        es: `/examples/${slug}`,
        "x-default": `/examples/${slug}`,
      },
    },
  };
}

export default async function VerticalExamplePage({
  params,
}: {
  params: Promise<{ vertical: string }>;
}) {
  const { vertical: slug } = await params;
  const vertical = getVertical(slug);

  if (!vertical) notFound();

  return <ExamplePortal vertical={vertical} />;
}
