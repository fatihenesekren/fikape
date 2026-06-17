import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "fikape — Gerçek Araç Yorumları";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CHIPS = [
  { short: "Fİ", label: "Fiyat",      color: "#85B7EB" },
  { short: "KA", label: "Kalite",     color: "#97C459" },
  { short: "PE", label: "Performans", color: "#F0997B" },
];

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#111",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px 90px",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "2px", marginBottom: "44px" }}>
        <span style={{ fontSize: 44, fontWeight: 900, color: "#85B7EB" }}>fi</span>
        <span style={{ fontSize: 44, fontWeight: 300, color: "#444", margin: "0 4px" }}>·</span>
        <span style={{ fontSize: 44, fontWeight: 900, color: "#97C459" }}>ka</span>
        <span style={{ fontSize: 44, fontWeight: 300, color: "#444", margin: "0 4px" }}>·</span>
        <span style={{ fontSize: 44, fontWeight: 900, color: "#F0997B" }}>pe</span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 1.1,
          marginBottom: 24,
          letterSpacing: "-2px",
        }}
      >
        Aldın. Kullandın. Anlat.
      </div>

      {/* Subtext */}
      <div style={{ fontSize: 28, color: "#777", marginBottom: 52 }}>
        Türkiye&apos;nin araç yorum platformu
      </div>

      {/* FI·KA·PE chips */}
      <div style={{ display: "flex", gap: 16 }}>
        {CHIPS.map(({ short, label, color }) => (
          <div
            key={short}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 24px",
              borderRadius: 14,
              background: `${color}18`,
              border: `1.5px solid ${color}55`,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 900, color }}>{short}</span>
            <span style={{ fontSize: 18, color: "#999" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>,
    { ...size }
  );
}
