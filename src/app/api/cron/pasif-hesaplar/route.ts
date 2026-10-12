import { cronYetkili } from "@/lib/cronAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInactiveWarningEmail } from "@/lib/email";
import { askiEsigi, uyariEsigi, uyariSuresiDolduEsigi } from "@/lib/pasifHesap";
import { cronHataIzle } from "@/lib/sistemUyarisi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Pasif hesap otomasyonu (haftalık): 24 ay etkinlik yok → önce 30 gün önceden e-posta uyarısı,
// uyarıdan 30 gün sonra hâlâ etkinlik yoksa askıya alma. Silme YOK; askı şifre sıfırlamayla kalkar.
// Kural ve eşikler: lib/pasifHesap.ts. Her çalışmada en fazla PARTI hesap işlenir (e-posta kotası).
const PARTI = 100;

// lastActiveAt boşsa kayıt tarihi esas (yeni/eski hesaplar için dolgu SQL'i kaçırmış olsa bile).
const pasifKosulu = (esik: Date) => ({
  OR: [{ lastActiveAt: { lt: esik } }, { lastActiveAt: null, createdAt: { lt: esik } }],
});
const dokunulmaz = { trustLevel: { lt: 5 }, isBanned: false, inactiveSuspendedAt: null };

async function calistir(req: Request) {
  if (!cronYetkili(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const simdi = new Date();

  // 1) Uyarı: askı eşiğine 30 gün kalmış, henüz uyarılmamış hesaplar.
  const uyarilacak = await prisma.user.findMany({
    where: { ...dokunulmaz, inactiveWarnedAt: null, AND: [pasifKosulu(uyariEsigi(simdi))] },
    select: { id: true, email: true, displayName: true },
    orderBy: { id: "asc" },
    take: PARTI,
  });
  let uyarilan = 0;
  for (const u of uyarilacak) {
    try {
      await sendInactiveWarningEmail({ to: u.email, displayName: u.displayName });
      await prisma.user.update({ where: { id: u.id }, data: { inactiveWarnedAt: new Date() } });
      uyarilan++;
    } catch (e) {
      console.error("[cron/pasif-hesaplar] uyarı gönderilemedi:", u.id, e); // warnedAt yazılmaz → askıya ALINMAZ, sonraki hafta yeniden denenir
    }
  }

  // 2) Askı: 24 ayı aşmış VE uyarısı en az 30 gün önce gitmiş hesaplar.
  const askiya = await prisma.user.updateMany({
    where: {
      ...dokunulmaz,
      inactiveWarnedAt: { lte: uyariSuresiDolduEsigi(simdi) },
      AND: [pasifKosulu(askiEsigi(simdi))],
    },
    data: { inactiveSuspendedAt: simdi },
  });

  console.log(`[cron/pasif-hesaplar] uyarılan=${uyarilan}/${uyarilacak.length} askıya alınan=${askiya.count}`);
  return NextResponse.json({ ok: true, uyarilan, uyariAdayi: uyarilacak.length, askiyaAlinan: askiya.count });
}

export const GET = cronHataIzle("pasif-hesaplar", calistir);
