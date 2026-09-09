import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "fikape — Gerçek Araç Yorumları",
    short_name: "fikape",
    description:
      "Türkiye'nin araç yorum platformu. Fiyat, Kalite ve Performans puanlarıyla gerçek kullanıcı deneyimleri.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    lang: "tr-TR",
    icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
  };
}
