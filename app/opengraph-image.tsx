import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "osocios.club — The operating system for private clubs";
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
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "#16a34a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "6px solid white",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 200,
            color: "white",
            letterSpacing: "-1px",
          }}
        >
          osocios.club
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            marginTop: 16,
            fontWeight: 300,
          }}
        >
          The operating system for private clubs
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
            fontSize: 14,
            color: "rgba(255,255,255,0.3)",
            fontWeight: 400,
          }}
        >
          <span>Members</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>Events</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>Rewards</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>White-label</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
