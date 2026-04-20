import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Archived",
  robots: { index: false, follow: false },
};

export default async function ArchivedPage() {
  const lang = (await headers()).get("x-lang") ?? "en";
  const isEs = lang === "es";
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-3xl">🗄️</div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEs ? "Club archivado" : "Club archived"}
        </h1>
        <p className="text-sm text-gray-600">
          {isEs
            ? "Este club ya no está disponible. Si crees que es un error, contacta con el equipo de osocios."
            : "This club is no longer available. If you think this is a mistake, contact the osocios team."}
        </p>
        <Link href="/" className="inline-block text-sm font-medium text-blue-600 hover:underline">
          {isEs ? "Volver al inicio" : "Back to home"}
        </Link>
      </div>
    </main>
  );
}
