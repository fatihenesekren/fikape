/** İstek aynı siteden mi (CSRF'e karşı Sec-Fetch-Site / Origin)? Başlıkların ikisi de yoksa (eski istemci, sunucudan sunucuya) geçer. */
export function ayniKaynakMi(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = req.headers.get("origin");
  if (origin) {
    try { return new URL(origin).host === new URL(req.url).host; } catch { return false; }
  }
  return true;
}

const GUVENLI_METOTLAR = new Set(["GET", "HEAD", "OPTIONS"]);
// Kendi kimlik/imza doğrulamasını yapan uçlar: Auth.js (kendi CSRF jetonu), cron (Bearer sır), CSP raporları (tarayıcı gönderir)
const MUAF_ONEKLER = ["/api/auth/", "/api/cron/", "/api/csp-report"];

/** Durum değiştiren bir /api isteği çapraz-siteden geliyorsa reddedilmelidir (SameSite=Lax'a ek savunma katmanı). */
export function capraziSiteApiIstegiMi(req: Request, pathname: string): boolean {
  if (GUVENLI_METOTLAR.has(req.method.toUpperCase())) return false;
  if (MUAF_ONEKLER.some((o) => pathname === o || pathname.startsWith(o))) return false;
  return !ayniKaynakMi(req);
}
