import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { getServerLocale } from "@/lib/i18n/server";
import { LanguageProvider } from "@/lib/i18n/provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FeedbackWidget } from "@/components/feedback-widget";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://osocios.club";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "osocios.club — The operating system for private clubs",
    template: "%s | osocios.club",
  },
  description:
    "White-label membership platform for private clubs. Manage members, gamify engagement with rewards and quests, run events, and operate daily — all under your brand.",
  keywords: [
    "club management",
    "membership platform",
    "private clubs",
    "white-label",
    "member engagement",
    "loyalty rewards",
    "event management",
    "club software",
  ],
  openGraph: {
    type: "website",
    siteName: "osocios.club",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/icon.ico", sizes: "48x32x16" },
      { url: "/favicon-member.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider initialLocale={locale}>
            {process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" && (
              <div className="bg-yellow-500 text-black text-center text-xs py-1 w-full font-semibold tracking-wide">
                STAGING
              </div>
            )}
            {children}
            <FeedbackWidget />
            <Toaster position="top-center" richColors />
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
