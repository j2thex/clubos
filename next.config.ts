import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
      allowedOrigins: [
        "osocios.club",
        "www.osocios.club",
        "staging.osocios.club",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Declare rewrites as an object so withBotId merges its proxy routes into
  // beforeFiles. Without this, withBotId appends to a plain array (afterFiles),
  // which runs too late — the dynamic [clubSlug] route catches BotID's UUID
  // prefix paths first and 404s.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default withBotId(nextConfig);
