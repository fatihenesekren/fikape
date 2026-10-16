// Sentry'ye giden olaylardan kişisel/gizli veriyi ayıklar: sıfırlama/doğrulama token'ı taşıyan URL sorguları, kimlik başlıkları,
// çerezler, istek gövdesi ve kullanıcı e-postası/IP'si. sendDefaultPii kapalıdır; bu ek bir güvenlik ağıdır.

const GIZLI_BASLIKLAR = ["authorization", "cookie", "set-cookie", "x-forwarded-for", "x-real-ip", "x-vercel-forwarded-for", "referer"];
const GIZLI_SORGU = /([?&](?:token|code|key|secret|password|email)=)[^&#]*/gi;

export function urlTemizle(url: string | undefined): string | undefined {
  return url?.replace(GIZLI_SORGU, "$1[gizlendi]");
}

type Olay = {
  request?: { url?: string; query_string?: unknown; cookies?: unknown; data?: unknown; headers?: Record<string, unknown> };
  user?: { email?: string; ip_address?: string; username?: string; [k: string]: unknown };
  breadcrumbs?: Array<{ data?: Record<string, unknown> }>;
  [k: string]: unknown;
};

export function sentryOlayTemizle<T>(girdi: T): T {
  const olay = girdi as unknown as Olay;
  const r = olay.request;
  if (r) {
    r.url = urlTemizle(r.url);
    if (r.query_string) r.query_string = "[gizlendi]";
    delete r.cookies;
    delete r.data;
    if (r.headers) for (const k of Object.keys(r.headers)) if (GIZLI_BASLIKLAR.includes(k.toLowerCase())) delete r.headers[k];
  }
  if (olay.user) {
    delete olay.user.email;
    delete olay.user.ip_address;
    delete olay.user.username;
  }
  for (const b of olay.breadcrumbs ?? []) {
    if (!b.data) continue;
    // Tarayıcı gezinti breadcrumb'ları from/to, fetch/xhr url kullanır.
    for (const k of ["url", "from", "to"]) if (typeof b.data[k] === "string") b.data[k] = urlTemizle(b.data[k] as string);
  }
  return girdi;
}
