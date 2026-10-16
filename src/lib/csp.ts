// İçerik Güvenlik Politikası üretimi (next.config.ts'teki zorlanan politika ve proxy.ts'teki nonce'lu aday ortak buradan beslenir).
//
// Zorlanan politika (nonce YOK): script-src 'unsafe-inline' içerir (Next.js hidratasyon satır içi scriptleri için).
// Aday politika (nonce VAR): script-src 'self' 'nonce-…' 'strict-dynamic' — 'unsafe-inline' yok, satır içi olay işleyicileri yasak.
// Kök layout her istekte auth() çağırdığı için siteler zaten dinamik; nonce ek bir statik-önbellek kaybı yaratmaz.

export interface CspSecenekleri {
  nonce?: string;
  uretim: boolean; // NODE_ENV === "production" (üretimde 'unsafe-eval' yok)
  onizleme: boolean; // Vercel önizleme dağıtımı (vercel.live araç çubuğu)
  blobHost: string; // Blob mağaza hostu (tam host) veya joker
}

export function cspOlustur({ nonce, uretim, onizleme, blobHost }: CspSecenekleri): string {
  const scriptKaynaklari = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "'self' 'unsafe-inline'";
  const yonergeler = [
    "default-src 'self'",
    `script-src ${scriptKaynaklari}${uretim ? "" : " 'unsafe-eval'"}${onizleme ? " https://vercel.live" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: https://upload.wikimedia.org https://thumb.wikimedia.org https://commons.wikimedia.org https://${blobHost} https://api.dicebear.com`,
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' https://${blobHost} https://vercel.com https://*.sentry.io https://*.ingest.sentry.io${onizleme ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
    // Usta profilindeki OpenStreetMap haritası iframe ile geliyor (usta/[slug]/page.tsx).
    `frame-src https://www.openstreetmap.org${onizleme ? " https://vercel.live" : ""}`,
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "report-uri /api/csp-report",
  ];
  if (nonce) yonergeler.push("script-src-attr 'none'");
  return yonergeler.join("; ");
}
