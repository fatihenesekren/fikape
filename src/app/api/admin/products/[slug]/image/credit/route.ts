import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { adminIstek } from "@/lib/adminIstek";
import { commonsDosyaAdi, commonsKredisiGetir, krediDogrula } from "@/lib/gorselKredisi";

// Katalog görselinin atıf bilgisini kaydeder.
//  - { kaynakUrl: <Commons dosya adresi> , otomatik: true } → yazar/lisans Commons'tan okunur
//  - { yazar, lisans, lisansUrl?, kaynakUrl? }             → elle giriş (basın kiti, kendi çekimimiz vb.)
export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const k = await adminIstek(req, { anahtar: "gorsel-kredi", adet: 60, pencereMs: 60_000 });
  if ("hata" in k) return k.hata;
  const { slug } = await params;
  const urun = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!urun) return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });
  const govde = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!govde || typeof govde !== "object") return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  let kredi = null;
  if (govde.otomatik === true) {
    const dosya = typeof govde.kaynakUrl === "string" ? commonsDosyaAdi(govde.kaynakUrl) : null;
    if (!dosya) return NextResponse.json({ error: "Geçerli bir Wikimedia Commons dosya adresi giriniz (…/wiki/File:Ad.jpg)." }, { status: 422 });
    const r = await commonsKredisiGetir(dosya);
    if (!r) return NextResponse.json({ error: "Commons'tan yazar/lisans okunamadı; elle giriniz." }, { status: 422 });
    if (!r.ozgur) return NextResponse.json({ error: "Bu dosya özgür lisanslı değil (adil kullanım); kullanılamaz." }, { status: 422 });
    kredi = { yazar: r.yazar, lisans: r.lisans, lisansUrl: r.lisansUrl, kaynakUrl: r.kaynakUrl };
  } else {
    kredi = krediDogrula(govde);
    if (!kredi) return NextResponse.json({ error: "Yazar ve lisans zorunlu (https adresleri isteğe bağlı)." }, { status: 422 });
  }
  await prisma.product.update({ where: { id: urun.id }, data: { imageCredit: kredi as unknown as Prisma.InputJsonValue } });
  return NextResponse.json({ ok: true, kredi });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const k = await adminIstek(req, { anahtar: "gorsel-kredi", adet: 60, pencereMs: 60_000 });
  if ("hata" in k) return k.hata;
  const { slug } = await params;
  const r = await prisma.product.updateMany({ where: { slug }, data: { imageCredit: Prisma.DbNull } });
  if (r.count === 0) return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
