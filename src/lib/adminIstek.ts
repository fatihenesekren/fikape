import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOturumu } from "@/lib/adminAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export interface AdminKimlik { userId: number; label: string }
type Sonuc = { admin: AdminKimlik } | { hata: NextResponse };

const hata = (mesaj: string, status: number): { hata: NextResponse } => ({ hata: NextResponse.json({ error: mesaj }, { status }) });

/** İstek aynı siteden mi (CSRF'e karşı Sec-Fetch-Site / Origin)? */
export function ayniKaynakMi(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = req.headers.get("origin");
  if (origin) {
    try { return new URL(origin).host === new URL(req.url).host; } catch { return false; }
  }
  return true;
}

/**
 * Katalog yönetimi uç noktaları için ortak kapı: DB'den yönetici yetkisi (banlı hariç), yazma isteklerinde aynı-kaynak ve JSON
 * zorunluluğu, isteğe bağlı kullanıcı başına hız sınırı. Hata varsa dönülecek yanıtı verir.
 */
export async function adminIstek(
  req: Request,
  limit?: { anahtar: string; adet: number; pencereMs: number },
): Promise<Sonuc> {
  const yazma = req.method !== "GET" && req.method !== "HEAD";
  if (yazma) {
    if (!ayniKaynakMi(req)) return hata("Geçersiz istek kaynağı.", 403);
    // Gövdesiz yıkıcı istekler de JSON bildirmeli: formla çapraz-site gönderilemesin
    if (!(req.headers.get("content-type") ?? "").includes("application/json")) return hata("İçerik türü application/json olmalı.", 415);
  }
  const oturum = await adminOturumu();
  if (!oturum) return hata("Yetkisiz.", 403);
  if (limit && !(await checkRateLimit(`katalog-${limit.anahtar}:${oturum.userId}`, limit.adet, limit.pencereMs))) {
    return hata("Çok fazla işlem yaptınız. Lütfen daha sonra tekrar deneyin.", 429);
  }
  const u = await prisma.user.findUnique({ where: { id: oturum.userId }, select: { displayName: true, email: true } });
  return { admin: { userId: oturum.userId, label: (u?.displayName || u?.email || `#${oturum.userId}`).slice(0, 160) } };
}
