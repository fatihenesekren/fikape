import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Dosya yükleme uçları için hesap kontrolü: banlı ya da e-postasını doğrulamamış hesap depolama kullanamaz
 * (çok sayıda sahte hesapla depolama/fatura şişirme yolunu daraltır). Uygun değilse dönülecek yanıtı verir, uygunsa null.
 */
export async function yuklemeYetkisiYoksaYanit(userId: number): Promise<NextResponse | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { isBanned: true, emailVerifiedAt: true } });
  if (!u || u.isBanned) return NextResponse.json({ error: "Bu işlem şu an yapılamıyor." }, { status: 403 });
  if (!u.emailVerifiedAt) return NextResponse.json({ error: "Dosya yüklemek için e-posta adresinizi doğrulamanız gerekiyor." }, { status: 403 });
  return null;
}
