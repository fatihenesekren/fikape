import { ImageResponse } from "next/og";
import { FIKAPE_SOFT } from "@/lib/fikape";

export const runtime = "edge";
export const alt = "fikape — Gerçek Araç Yorumları";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CHIPS = [
  { short: "Fİ", label: "Fiyat",      color: FIKAPE_SOFT.fi },
  { short: "KA", label: "Kalite",     color: FIKAPE_SOFT.ka },
  { short: "PE", label: "Performans", color: FIKAPE_SOFT.pe },
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
      {/* Logo — 3 segmentli halka işareti + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "44px" }}>
        <div style={{ display: "flex", position: "relative", width: 54, height: 54 }}>
          {[
            { c: FIKAPE_SOFT.fi, r: 0 },     // Fİ · üst
            { c: FIKAPE_SOFT.pe, r: 120 },   // PE · sağ-alt
            { c: FIKAPE_SOFT.ka, r: 240 },   // KA · sol-alt
          ].map(({ c, r }) => (
            <div
              key={r}
              style={{
                position: "absolute",
                width: 54,
                height: 54,
                borderRadius: 54,
                border: "9px solid transparent",
                borderTopColor: c,
                transform: `rotate(${r}deg)`,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span style={{ fontSize: 44, fontWeight: 900, color: FIKAPE_SOFT.fi }}>fi</span>
          <span style={{ fontSize: 44, fontWeight: 300, color: "#444", margin: "0 4px" }}>·</span>
          <span style={{ fontSize: 44, fontWeight: 900, color: FIKAPE_SOFT.ka }}>ka</span>
          <span style={{ fontSize: 44, fontWeight: 300, color: "#444", margin: "0 4px" }}>·</span>
          <span style={{ fontSize: 44, fontWeight: 900, color: FIKAPE_SOFT.pe }}>pe</span>
        </div>
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
