// PWA ikonlarını (public/icons/*.png) üretir. Elle çalıştırılır: npx tsx scripts/pwa-ikon-uret.tsx
// - icon-192 / icon-512: Android açılış (splash) ekranında ortada görünen "halka + fi·ka·pe" birleşik görseli
// - icon-maskable-512: ana ekran ikonu; yalnız halka, güvenli alan (%60) içinde
import { ImageResponse } from "next/og";
import { readFileSync, writeFileSync } from "node:fs";
import { FIKAPE_SOFT } from "@/lib/fikape";

// Kalın wordmark için yerel yazı tipi (yalnız PNG üretiminde kullanılır, siteye gömülmez)
const FONT = readFileSync("C:/Windows/Fonts/seguibl.ttf");

const yaylar = (d: number, kalinlik: number) =>
  [
    { c: FIKAPE_SOFT.fi, r: 0 },
    { c: FIKAPE_SOFT.pe, r: 120 },
    { c: FIKAPE_SOFT.ka, r: 240 },
  ].map(({ c, r }) => (
    <div
      key={r}
      style={{
        position: "absolute",
        width: d,
        height: d,
        borderRadius: d,
        border: `${kalinlik}px solid transparent`,
        borderTopColor: c,
        transform: `rotate(${r}deg)`,
      }}
    />
  ));

function lockup(s: number) {
  const halka = Math.round(s * 0.3);
  const yazi = Math.round(s * 0.2);
  return (
    <div style={{ width: "100%", height: "100%", background: "#111", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: Math.round(s * 0.07) }}>
      <div style={{ display: "flex", position: "relative", width: halka, height: halka }}>{yaylar(halka, Math.round(halka * 0.17))}</div>
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: "Segoe UI Black", fontWeight: 900, fontSize: yazi, lineHeight: 1 }}>
        <span style={{ color: FIKAPE_SOFT.fi }}>fi</span>
        <span style={{ color: "#6b7280", fontWeight: 900, margin: `0 ${Math.round(yazi * 0.12)}px` }}>·</span>
        <span style={{ color: FIKAPE_SOFT.ka }}>ka</span>
        <span style={{ color: "#6b7280", fontWeight: 900, margin: `0 ${Math.round(yazi * 0.12)}px` }}>·</span>
        <span style={{ color: FIKAPE_SOFT.pe }}>pe</span>
      </div>
    </div>
  );
}

function maskable(s: number) {
  const halka = Math.round(s * 0.42);
  return (
    <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", position: "relative", width: halka, height: halka }}>{yaylar(halka, Math.round(halka * 0.17))}</div>
    </div>
  );
}

async function yaz(ad: string, el: React.ReactElement, s: number) {
  const buf = Buffer.from(await new ImageResponse(el, { width: s, height: s, fonts: [{ name: "Segoe UI Black", data: FONT, weight: 900, style: "normal" }] }).arrayBuffer());
  writeFileSync(`public/icons/${ad}`, buf);
  console.log(ad, buf.length);
}

async function main() {
  await yaz("icon-192.png", lockup(192), 192);
  await yaz("icon-512.png", lockup(512), 512);
  await yaz("icon-maskable-512.png", maskable(512), 512);
}
main();
