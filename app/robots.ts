import type { MetadataRoute } from "next";

const PRIVATE_PATHS = [
  "/*/staff/",
  "/*/admin/",
  "/*/login",
  "/onboarding",
  "/platform-admin",
  "/api/",
];

const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "anthropic-ai",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Meta-ExternalAgent",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_BOTS,
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: "https://osocios.club/sitemap.xml",
  };
}
