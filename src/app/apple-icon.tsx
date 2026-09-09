import { ImageResponse } from "next/og";

// iOS ana ekran ikonu. apple-icon.svg konvansiyonu Next'te desteklenmiyor
// (yalnızca png/jpg veya bu generator) — işaret, Satori uyumlu border-arc
// tekniğiyle çiziliyor (bkz. opengraph-image.tsx aynı yaklaşım).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", position: "relative", width: 108, height: 108 }}>
          {[
            { c: "#378ADD", r: 0 },     // Fİ · üst
            { c: "#F0997B", r: 120 },   // PE · sağ-alt
            { c: "#97C459", r: 240 },   // KA · sol-alt
          ].map(({ c, r }) => (
            <div
              key={r}
              style={{
                position: "absolute",
                width: 108,
                height: 108,
                borderRadius: 108,
                border: "18px solid transparent",
                borderTopColor: c,
                transform: `rotate(${r}deg)`,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
