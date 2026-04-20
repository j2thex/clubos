import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Temporarily unavailable",
  robots: { index: false, follow: false },
};

export default async function LockedPage() {
  const lang = (await headers()).get("x-lang") ?? "en";
  const isEs = lang === "es";
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-3xl">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEs ? "Acceso temporalmente no disponible" : "Temporarily no access"}
        </h1>
        <p className="text-sm text-gray-600">
          {isEs
            ? "El club está tomando una pequeña pausa. Por favor, inténtalo de nuevo en un momento."
            : "The club is taking a short break. Please try again in a moment."}
        </p>
      </div>
    </main>
  );
}
