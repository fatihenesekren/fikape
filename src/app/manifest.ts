import type { MetadataRoute } from "next";

// Android açılış (splash) ekranı: background_color + ikon (ortada) + name (altta). İkon, halka + "fi·ka·pe" birleşik
// görseli (public/icons/icon-*.png, üretici: scripts/pwa-ikon-uret.tsx); ana ekran ikonu ayrı ("maskable", yalnız halka).
// name kısa ve sönük tutuldu: Android altta adı her halükârda çiziyor, göz ortadaki yazıya gitsin.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "fikape.com",
    short_name: "fikape",
    description:
      "Türkiye'nin araç yorum platformu. Fiyat, Kalite ve Performans puanlarıyla gerçek kullanıcı deneyimleri.",
    start_url: "/",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#111111",
    lang: "tr-TR",
    icons: [
      { src: "/icons/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/icons/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
