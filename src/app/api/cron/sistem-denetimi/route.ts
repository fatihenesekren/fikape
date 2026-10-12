import { cronYetkili } from "@/lib/cronAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cronHataIzle, sistemUyarisiGonder } from "@/lib/sistemUyarisi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SNAPSHOT_KIND = "admin-snapshot";

// Günlük sistem denetimi (06:30 UTC):
// 1) Yönetici (trustLevel>=5) kümesi önceki anlık görüntüden farklıysa uyarır —
//    yetki yükseltmesi uygulama dışından (DB) yapıldığı için tek tespit yolu budur.
// 2) Son 26 saatte başarısız biten rapor/uyarı kayıtları varsa uyarır.
async function calistir(req: Request) {
  if (!cronYetkili(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bugun = new Date().toISOString().slice(0, 10);
  const adminler = await prisma.user.findMany({
    where: { trustLevel: { gte: 5 }, isBanned: false },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  const simdiki = adminler.map((a) => a.id).join(",");

  const onceki = await prisma.reportRun.findFirst({
    where: { kind: SNAPSHOT_KIND, isoWeek: { not: bugun } },
    orderBy: { startedAt: "desc" },
    select: { summary: true },
  });

  let adminDegisti = false;
  if (onceki?.summary != null && onceki.summary !== simdiki) {
    adminDegisti = true;
    const eski = new Set(onceki.summary.split(",").filter(Boolean));
    const yeni = new Set(simdiki.split(",").filter(Boolean));
    const eklenen = [...yeni].filter((x) => !eski.has(x)).length;
    const cikan = [...eski].filter((x) => !yeni.has(x)).length;
    await sistemUyarisiGonder({
      anahtar: "admin-degisim",
      konu: "Yönetici yetkisi değişti",
      baslik: "Yönetici listesi değişti",
      mesaj: `Önceki denetimden bu yana ${eklenen} hesap yönetici yetkisi aldı, ${cikan} hesap yetkiyi kaybetti. Bu değişikliği siz yapmadıysanız hesapları ve veritabanı erişimini hemen kontrol edin.`,
    });
  }

  const mevcut = await prisma.reportRun.findUnique({
    where: { kind_isoWeek: { kind: SNAPSHOT_KIND, isoWeek: bugun } },
    select: { id: true },
  });
  if (mevcut) {
    await prisma.reportRun.update({ where: { id: mevcut.id }, data: { summary: simdiki, startedAt: new Date() } });
  } else {
    await prisma.reportRun.create({
      data: { kind: SNAPSHOT_KIND, isoWeek: bugun, status: "SENT", summary: simdiki, finishedAt: new Date() },
    });
  }

  const since = new Date(Date.now() - 26 * 60 * 60 * 1000);
  const basarisiz = await prisma.reportRun.count({ where: { status: "FAILED", startedAt: { gte: since } } });
  if (basarisiz > 0) {
    await sistemUyarisiGonder({
      anahtar: "rapor-hatasi",
      konu: "Başarısız görev kaydı",
      baslik: "Son 24 saatte başarısız görev var",
      mesaj: `${basarisiz} rapor/uyarı görevi başarısız olarak kaydedildi. Sunucu günlüklerini kontrol edin.`,
    });
  }

  return NextResponse.json({ ok: true, adminSayisi: adminler.length, adminDegisti, basarisiz });
}

export const GET = cronHataIzle("sistem-denetimi", calistir);
