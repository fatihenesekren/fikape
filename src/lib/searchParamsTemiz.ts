/**
 * searchParams değerlerini tek, kısaltılmış string'e indirger. Aynı anahtar birden çok kez gelirse (?a=1&a=2) Next.js dizi verir;
 * bu diziyi string bekleyen kod (.split/.trim) 500 hatası fırlatırdı. İlk değer alınır; uzunluk sınırlanır.
 */
export function temizSearchParams<T extends object>(params: T, maxUzunluk = 200): { [K in keyof T]: Extract<T[K], string> | undefined } {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    const ilk = Array.isArray(v) ? v[0] : v;
    out[k] = typeof ilk === "string" ? ilk.slice(0, maxUzunluk) : undefined;
  }
  return out as { [K in keyof T]: Extract<T[K], string> | undefined };
}

/** Aralık içinde tamsayıya çevirir; geçersiz/aralık dışıysa undefined (Prisma int32 taşmasını önler). */
export function guvenliTamsayi(v: string | undefined, min = 0, max = 10_000_000): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}
