import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { ownBlobHost } from "./src/lib/blobUrl";
import { cspOlustur } from "./src/lib/csp";

// TSB katalog geçişi (2026-09): model adlarından nesil etiketi ("(2016-)",
// "W213", "Golf 6") ve slug'a sızmış beygir sayıları kaldırıldı. Yayındaki
// araçların eski adresleri — sayfa ve dış sitelere gömülen skor rozeti/API —
// yeni slug'a 301 ile yönlenir. [eski, yeni]
const KATALOG_SLUG_DEGISIKLIKLERI: [string, string][] = [
  ["togg-t10x-2023", "togg-t10x-uzun-menzil-2023"],
  ["togg-t10x-2024", "togg-t10x-uzun-menzil-2024"],
  ["togg-t10f-2024", "togg-t10f-standart-menzil-2024"],
  ["tesla-model-y-2023", "tesla-model-y-long-range-awd-2023"],
  ["tesla-model-y-2024", "tesla-model-y-long-range-rwd-2024"],
  ["fiat-egea-sedan-2020", "fiat-egea-urban-2020"],
  ["fiat-egea-sedan-2022", "fiat-egea-urban-2022"],
  ["fiat-egea-sedan-2024", "fiat-egea-lounge-2024"],
  ["renault-clio-2021", "renault-clio-touch-2021"],
  ["renault-clio-2023", "renault-clio-techno-2023"],
  ["dacia-duster-2021", "dacia-duster-comfort-2021"],
  ["dacia-duster-2024", "dacia-duster-extreme-2024"],
  ["honda-nc750x-2023", "honda-nc750x-dct-2023"],
  ["yamaha-mt07-2023", "yamaha-mt-07-2023"],
  // Versiyon olmayan araçlarda gereksiz "Standart" versiyonu kaldırıldı (2026-10-17)
  ["honda-pcx-125-standart-2025", "honda-pcx-125-2025"],
  ["honda-forza-250-standart-2025", "honda-forza-250-2025"],
  ["arora-zr7-standart-2026", "arora-zr7-2026"],
  ["yamaha-xmax-250-standart-2023", "yamaha-xmax-250-2023"],
  ["zero-sr-s-2024", "zero-motorcycles-sr-s-premium-2024"],
  ["xiaomi-mi-4-pro-2023", "xiaomi-mi-electric-scooter-4-pro-2023"],
  ["ford-ranger-2023", "ford-ranger-wildtrak-2023"],
  ["ford-ranger-2024", "ford-ranger-raptor-2024"],
  ["ford-transit-custom-2023", "ford-transit-custom-320s-trend-2023"],
  ["ford-transit-custom-trend-2023", "ford-transit-custom-320s-trend-2023"],
  ["toyota-hilux-2023", "toyota-hilux-adventure-2023"],
  ["vw-amarok-2023", "volkswagen-amarok-panamericana-2023"],
  ["isuzu-d-max-2023", "isuzu-d-max-v-cross-2023"],
  ["mitsubishi-l200-2023", "mitsubishi-l200-athlete-2023"],
  ["specialized-turbo-vado-5-2023", "specialized-turbo-vado-5-0-igh-eq-2023"],
  ["giant-explore-e-plus-3-2023", "giant-explore-e-3-gts-2023"],
  ["cube-kathmandu-hybrid-pro-2023", "cube-kathmandu-hybrid-pro-500-2023"],
  ["volkswagen-golf-6-2008-2012-1-4-tsi-trendline-2011", "volkswagen-golf-1-4-tsi-trendline-2011"],
  ["nissan-qashqai-2013-2021-1-2-dig-t-tekna-2016", "nissan-qashqai-1-2-dig-t-tekna-2016"],
  ["mercedes-benz-e-serisi-w213-2016-e-220d-exclusive-2022", "mercedes-benz-e-serisi-e-220d-exclusive-2022"],
  ["hyundai-tucson-2015-2020-1-6-t-gdi-177-awd-elite-2020", "hyundai-tucson-1-6-t-gdi-awd-elite-2020"],
  ["hyundai-bayon-1-0-t-gdi-100-mhev-style-2024", "hyundai-bayon-1-0-t-gdi-mhev-style-2024"],
  ["bmw-x1-u11-2022-sdrive18i-m-sport-2022", "bmw-x1-sdrive18i-m-sport-2022"],
  ["ford-fiesta-2008-2017-1-4-titanium-2011", "ford-fiesta-1-4-titanium-2011"],
  ["renault-megane-4-2016-1-3-tce-touch-2024", "renault-megane-1-3-tce-touch-2024"],
  ["audi-a4-2016-1-4-tfsi-design-2018", "audi-a4-1-4-tfsi-design-2018"],
  ["bmw-x1-sdrive16d-1-5-sdrive-x-line-2021-otomatik", "bmw-x1-sdrive16d-1-5-x-line-2021-otomatik"],
];

// ─── İçerik Güvenlik Politikası (CSP) ───────────────────────────────────────
// Zorlanan politika burada (script-src 'unsafe-inline'). Nonce'lu sıkı aday (src/lib/csp.ts, nonce seçeneği) yerelde çalışıyor
// ama Vercel'de Next'in kendi scriptlerine nonce uygulanmadığı için canlıya alınmadı (rapor modu denendi ve kaldırıldı); zorlamadan
// önce preview'da farklı yöntem araştırılmalı. İhlaller /api/csp-report ile [csp-report] satırı olarak günlüğe düşer.
// Blob mağaza hostu (BLOB_STORE_HOST veya BLOB_READ_WRITE_TOKEN'dan); başkasının mağazasından görsel/bağlantı yüklenmesin diye
// joker yerine tam host. Bilinmiyorsa (yerel geliştirme, env yok) eski joker.
const BLOB_HOST = ownBlobHost() ?? "*.public.blob.vercel-storage.com";
const CSP_ZORLANAN = cspOlustur({
  uretim: process.env.NODE_ENV === "production",
  onizleme: process.env.VERCEL_ENV === "preview", // Vercel önizleme araç çubuğu (yalnız preview dağıtımlarında)
  blobHost: BLOB_HOST,
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "thumb.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: BLOB_HOST },
    ],
  },
  // Katalog verisinde motor bilgisi sızmış slug'lar temizlendi — eski URL'ler
  // (bookmark / arama motoru indeksi) kırılmasın diye 301 (bkz. Honda PCX 125,
  // Honda Forza 250, Yamaha XMAX 250 trimName/slug temizliği).
  async redirects() {
    return [
      {
        source: "/araclar/honda-pcx-125-125cc-12-5-cv-standart-2025",
        destination: "/araclar/honda-pcx-125-2025",
        permanent: true,
      },
      {
        source: "/araclar/honda-forza-250-250cc-23-cv-standart-2025",
        destination: "/araclar/honda-forza-250-2025",
        permanent: true,
      },
      {
        source: "/araclar/yamaha-xmax-250-250cc-23-cv-standart-2023",
        destination: "/araclar/yamaha-xmax-250-2023",
        permanent: true,
      },
      // "Citroën" markası eski hatalı slugify ile "citro-n" slug'lı ölü bir
      // marka kaydı yaratmış (ë atılıp "-" olmuş). Ölü kayıt silindi; gerçek
      // marka slug'ı "citroen". /markalar/citro-n sitemap'te olduğu için 301.
      {
        source: "/markalar/citro-n",
        destination: "/markalar/citroen",
        permanent: true,
      },
      ...KATALOG_SLUG_DEGISIKLIKLERI.flatMap(([eski, yeni]) => [
        { source: `/araclar/${eski}`, destination: `/araclar/${yeni}`, permanent: true },
        // Skor API'si ve rozet (badge.png) — dış sitelere gömülü olabilir
        { source: `/api/public/skor/${eski}/:path*`, destination: `/api/public/skor/${yeni}/:path*`, permanent: true },
      ]),
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // CSP: zorlanan politika; nonce'lu rapor-only aday sayfa isteklerinde proxy.ts'ten eklenir.
          { key: "Content-Security-Policy", value: CSP_ZORLANAN },
          // Sesli arama/giriş için mikrofon yalnız kendi sitemizde; kamera, konum ve ödeme API'si kapalı.
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: {
    disable: true,
  },
});
