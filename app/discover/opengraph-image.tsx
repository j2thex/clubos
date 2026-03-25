import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Discover clubs, events & services on osocios.club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "#16a34a",
            letterSpacing: "4px",
            textTransform: "uppercase" as const,
            marginBottom: 24,
          }}
        >
          osocios.club
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 200,
            color: "white",
            letterSpacing: "-1px",
          }}
        >
          Discover
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            marginTop: 16,
            fontWeight: 300,
          }}
        >
          Find clubs, events & services near you
        </div>
      </div>
    ),
    { ...size }
  );
}
