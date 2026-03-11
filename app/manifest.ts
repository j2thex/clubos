import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "osocio.club",
    short_name: "osocio",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      {
        src: "/favicon-member.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
