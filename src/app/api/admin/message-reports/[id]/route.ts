import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  // Admin yetkisi (trustLevel) JWT'de sadece login anında yazılıyor ve normal
  // isteklerde DB'den yenilenmiyor — bu ban işlemi geri döndürülemez bir aksiyon
  // olduğu için burada özellikle taze kontrol ediliyor (bkz. denetim raporu:
  // "yetkisi geri alınan bir admin, mevcut oturumu boyunca ban atmaya devam edebiliyordu").
  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const reportId = parseInt(id);
  const { action } = await req.json().catch(() => ({ action: null }));
  if (action !== "ban" && action !== "delete_message") {
    return NextResponse.json({ error: "Geçersiz aksiyon." }, { status: 400 });
  }

  const report = await prisma.messageReport.findUnique({
    where: { id: reportId },
    select: { id: true, reason: true, messageId: true, message: { select: { senderId: true } } },
  });
  if (!report) return NextResponse.json({ error: "Rapor bulunamadı." }, { status: 404 });

  // "Mesajı Sil" — önceden tek aksiyon kullanıcıyı tamamen banlamaktı (tüm aktif
  // ilanlarını da kapatıyordu), tek bir kötü mesaj için orantısız olabiliyordu
  // (bkz. boşluk raporu, ORTA madde). Bu aksiyon sadece mesaj metnini kaldırır,
  // kullanıcıya dokunmaz. Anonimleştirme cron'undakinden ayrı bir placeholder
  // kullanılıyor — biri KVKK saklama süresi, diğeri moderasyon kararı.
  if (action === "delete_message") {
    await prisma.$transaction([
      prisma.message.update({
        where: { id: report.messageId },
        data: { text: "[Bu mesaj moderasyon tarafından kaldırıldı]" },
      }),
      prisma.messageReport.update({ where: { id: reportId }, data: { status: "REVIEWED" } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const bannedUserId = report.message.senderId;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: bannedUserId },
      data: { isBanned: true, banReason: `Mesaj raporu: ${report.reason}`, bannedAt: new Date() },
    }),
    prisma.tradeListing.updateMany({
      where: { userId: bannedUserId, isActive: true },
      data: { isActive: false, closedAt: new Date() },
    }),
    prisma.messageReport.update({ where: { id: reportId }, data: { status: "REVIEWED" } }),
  ]);

  return NextResponse.json({ ok: true });
}
