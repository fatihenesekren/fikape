import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  // Katalog verisinde motor bilgisi sızmış slug'lar temizlendi — eski URL'ler
  // (bookmark / arama motoru indeksi) kırılmasın diye 301 (bkz. Honda PCX 125,
  // Honda Forza 250, Yamaha XMAX 250 trimName/slug temizliği).
  async redirects() {
    return [
      {
        source: "/araclar/honda-pcx-125-125cc-12-5-cv-standart-2025",
        destination: "/araclar/honda-pcx-125-standart-2025",
        permanent: true,
      },
      {
        source: "/araclar/honda-forza-250-250cc-23-cv-standart-2025",
        destination: "/araclar/honda-forza-250-standart-2025",
        permanent: true,
      },
      {
        source: "/araclar/yamaha-xmax-250-250cc-23-cv-standart-2023",
        destination: "/araclar/yamaha-xmax-250-standart-2023",
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
          // Tam script-src/style-src CSP'si tüm dış kaynakların (Sentry, Vercel
          // Blob, Wikipedia görselleri, font sağlayıcıları vb.) denetimini
          // gerektiriyor — yanlış yapılandırılırsa siteyi kırma riski var, ayrı
          // bir denetim olarak backlog'da. frame-ancestors ise risksiz ve
          // X-Frame-Options ile aynı clickjacking korumasını sağlıyor.
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
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
