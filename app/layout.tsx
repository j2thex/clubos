import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerLocale } from "@/lib/i18n/server";
import { LanguageProvider } from "@/lib/i18n/provider";
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

export const metadata: Metadata = {
  title: "osocios.club",
  description: "A white-label operating system for private clubs",
  icons: { icon: "/favicon-member.svg" },
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
    <html lang={locale}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Amatic+SC:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider initialLocale={locale}>
          {process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" && (
            <div className="bg-yellow-500 text-black text-center text-xs py-1 fixed top-0 w-full z-[9999]">
              STAGING
            </div>
          )}
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
