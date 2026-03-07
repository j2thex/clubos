import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Subtle green gradient accent at top */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <main className="relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Logo / Branding */}
        <h1 className="text-5xl font-bold tracking-tight text-primary sm:text-6xl md:text-7xl">
          osocio.club
        </h1>

        {/* Tagline */}
        <p className="max-w-md text-lg text-muted-foreground sm:text-xl">
          A white-label operating system for private clubs
        </p>

        {/* CTA Button */}
        <Link
          href="/onboarding"
          className="mt-4 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-md transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Create a Club
        </Link>
      </main>
    </div>
  );
}
