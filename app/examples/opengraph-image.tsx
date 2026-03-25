import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "See osocios.club in action — example portals for every industry";
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
          See it in action
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.5)",
            marginTop: 16,
            fontWeight: 300,
          }}
        >
          Example portals for every industry
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["Sports", "Coworking", "Bars", "Tourism"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)",
                fontSize: 14,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
