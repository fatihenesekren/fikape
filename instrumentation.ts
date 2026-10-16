import * as Sentry from "@sentry/nextjs";

// Üretimde ayrı tanımlanması gereken sırlar/servisler. Eksikse uygulama çalışmaya devam eder (geri dönüş değerleri var) ama
// güvenlik zayıflar: AUTH_SECRET'tan türeyen tek sır (JWT + IP/telefon şifreleme + e-posta token) ya da örnek başına bellek içi rate limit.
function guvenlikYapilandirmasiniDenetle() {
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return;
  const eksik: string[] = [];
  for (const ad of ["PHONE_SHARE_KEY", "IP_LOG_KEY", "EMAIL_TOKEN_SECRET", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "CRON_SECRET", "BLOB_READ_WRITE_TOKEN"]) {
    if (!process.env[ad]) eksik.push(ad);
  }
  if (eksik.length > 0) console.warn(`[guvenlik-yapilandirma] Üretimde tanımsız ortam değişkenleri: ${eksik.join(", ")}`);
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    guvenlikYapilandirmasiniDenetle();
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
