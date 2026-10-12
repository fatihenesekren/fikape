import { NextResponse } from "next/server";
import { cronYetkili } from "@/lib/cronAuth";
import { cronHataIzle } from "@/lib/sistemUyarisi";
import { aylikOnerileriUret } from "@/lib/katalogOneri/uret";
import { AY_BICIMI, ilkPazartesiAyi } from "@/lib/katalogOneri/zaman";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Aylık "yeni araç adayı" üretimi — her Pazartesi 03:30 UTC tetiklenir, yalnız ayın ilk Pazartesi'sinde çalışır
 * (haftalık rapor 05:00'te sonucu okur). reset-weekly-views'ten bilinçli olarak AYRI: o cron kritik veri yazıyor.
 * Elle: Authorization başlığıyla ?ay=YYYY-MM (kapıyı atlar; aynı ay için satırı olan kırılımlar yeniden aranmaz).
 */
async function calistir(req: Request) {
  if (!cronYetkili(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const istenen = new URL(req.url).searchParams.get("ay");
  if (istenen !== null && !AY_BICIMI.test(istenen)) {
    return NextResponse.json({ error: "ay biçimi YYYY-MM olmalı" }, { status: 400 });
  }
  const ay = istenen ?? ilkPazartesiAyi();
  if (!ay) return NextResponse.json({ ok: true, skipped: "ayın ilk Pazartesi'si değil" });

  const baslangic = Date.now();
  const sonuclar = await aylikOnerileriUret(ay);
  const hatali = sonuclar.filter((s) => s.hata);
  console.log(
    `[cron/yeni-arac-adaylari] ay=${ay} yeni=${sonuclar.reduce((t, s) => t + s.yeni, 0)}` +
      ` var=${sonuclar.reduce((t, s) => t + s.var, 0)} hatali=${hatali.length} ms=${Date.now() - baslangic}`,
  );
  // Tüm kırılımlar çöktüyse (anahtar eksik, sağlayıcı kapalı) yöneticiye cron hatası e-postası gitsin
  if (hatali.length === sonuclar.length) {
    throw new Error(`Tüm kırılımlar başarısız: ${hatali[0]?.hata ?? "bilinmiyor"}`);
  }
  return NextResponse.json({ ok: true, ay, sonuclar });
}

export const GET = cronHataIzle("yeni-arac-adaylari", calistir);
