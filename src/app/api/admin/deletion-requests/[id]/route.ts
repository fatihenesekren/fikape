import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Hesap silme talebinin işlenmesi — TAKAS VERİSİ özel olarak ele alınıyor
// (bkz. denetim raporu: "bu akış nasılsa yazılacaksa, takas özel durumu ilk
// günden dahil edilmeli"). Kapsam bilinçli olarak sınırlandı: hesap KVKK'nın
// "unutulma hakkı" ilkesine uygun şekilde ANONİMLEŞTİRİLİYOR (kullanıcı FK'leri
// site genelinde RESTRICT — bkz. TradeListing/Review/vb. — bu yüzden gerçek
// satır silme yapılamaz/yapılmamalı, referans bütünlüğü bozulur). Yorumlar/
// fotoğraflar/garaj gibi diğer içerik türlerine DOKUNULMUYOR — bu, site
// genelinde çok daha büyük bir kapsam (skor yeniden hesaplama, foto silme vb.)
// gerektiriyor ve Takasa Aç denetiminin kapsamı dışında bırakıldı.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const requestId = parseInt(id);
  const { action } = await req.json().catch(() => ({ action: null }));

  const deletionRequest = await prisma.dataDeletionRequest.findUnique({
    where: { id: requestId },
    select: { id: true, userId: true, status: true },
  });
  if (!deletionRequest) return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  if (deletionRequest.status !== "PENDING") {
    return NextResponse.json({ error: "Bu talep zaten işleme alınmış." }, { status: 409 });
  }

  if (action === "reject") {
    await prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", completedAt: new Date(), completedBy: Number(session.user.id) },
    });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  if (action !== "approve") {
    return NextResponse.json({ error: "Geçersiz aksiyon." }, { status: 400 });
  }

  const deletedUserId = deletionRequest.userId;
  const anonEmail = `silinmis-kullanici-${deletedUserId}-${Date.now()}@fikape.deleted`;
  // Rastgele, kimsenin bilemeyeceği bir şifre hash'i — hesabı fiilen kilitler.
  const lockPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: deletedUserId },
      data: {
        displayName: "Silinmiş Kullanıcı",
        email: anonEmail,
        avatarUrl: null,
        passwordHash: lockPasswordHash,
        emailVerifiedAt: null,
      },
    }),
    // Takas ilanları: aktif olanlar kapatılıyor, notu (serbest metin, PII riski
    // taşıyabilir) temizleniyor — 6 aylık bekleme olmadan, talep anında.
    prisma.tradeListing.updateMany({
      where: { userId: deletedUserId, isActive: true },
      data: { isActive: false, closedAt: new Date() },
    }),
    prisma.tradeListing.updateMany({
      where: { userId: deletedUserId },
      data: { note: null, anonymizedAt: new Date() },
    }),
    // Bu kullanıcının gönderdiği TÜM takas mesajları (thread'in kapalı/6 ay
    // koşulu beklenmeden) anonimleştiriliyor.
    prisma.message.updateMany({
      where: { senderId: deletedUserId, text: { not: "[Bu mesaj silinmiştir]" } },
      data: { text: "[Bu mesaj silinmiştir]" },
    }),
    prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED", completedAt: new Date(), completedBy: Number(session.user.id) },
    }),
  ]);

  return NextResponse.json({ ok: true, status: "COMPLETED" });
}
