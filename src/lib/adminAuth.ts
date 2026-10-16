import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Yönetici oturumu: yetki JWT'den DEĞİL veritabanından okunur (JWT'deki trustLevel giriş anında donar;
 * yetkisi alınan/banlanan yönetici oturumu kapanana kadar erişmeye devam ederdi).
 * Geçerli yönetici yoksa null döner.
 */
export async function adminOturumu(): Promise<{ userId: number } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = Number(session.user.id);
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { trustLevel: true, isBanned: true } });
  if (!u || u.isBanned || u.trustLevel < 5) return null;
  return { userId };
}

/**
 * Admin SAYFALARI için veri erişiminden önce çağrılır. Layout kontrolü kısmi render'larda yeniden çalışmayabildiğinden
 * (Next.js veri güvenliği rehberi) her sayfa kendi yetkisini DB'den doğrular; yetkisizse ana sayfaya yönlendirir.
 */
export async function adminSayfaKorumasi(): Promise<{ userId: number }> {
  const oturum = await adminOturumu();
  if (!oturum) redirect("/");
  return oturum;
}
