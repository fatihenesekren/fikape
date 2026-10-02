import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminIstek } from "@/lib/adminIstek";
import { pozitifTamsayiId } from "@/lib/validateId";
import { overrideSema, zodMesaji } from "@/lib/katalog/urunDogrula";
import { overrideAnahtarlari } from "@/lib/katalog/override";
import { denetimYaz, katalogOnbellekTemizle } from "@/lib/katalog/yonetim";
import { hataYaniti, jsonGovde } from "@/lib/katalog/rotaYardimci";

// Resmi katalog gizleme listesi (yönetici)
export async function GET(req: Request) {
  const k = await adminIstek(req, { anahtar: "okuma", adet: 60, pencereMs: 60_000 });
  if ("hata" in k) return k.hata;
  const kayitlar = await prisma.catalogOverride.findMany({ where: { isActive: true }, orderBy: { id: "desc" }, take: 500 });
  return NextResponse.json({ kayitlar });
}

// Gizle: marka / model / versiyon(+paket). Marka gizleme geniş etkili → açık onay ister.
export async function POST(req: Request) {
  const k = await adminIstek(req, { anahtar: "yazma", adet: 30, pencereMs: 60_000 });
  if ("hata" in k) return k.hata;
  const g = overrideSema.safeParse(await jsonGovde(req));
  if (!g.success) return NextResponse.json({ error: zodMesaji(g.error) }, { status: 422 });
  const d = g.data;
  if (d.scope !== "BRAND" && !d.model) return NextResponse.json({ error: "Model gerekli" }, { status: 422 });
  if (d.scope === "TRIM" && !d.versiyon && !d.paket) return NextResponse.json({ error: "Versiyon veya donanım gerekli" }, { status: 422 });
  if (d.scope === "BRAND" && !d.onay) {
    return NextResponse.json({ error: "Markanın tüm resmi modelleri formlardan kalkacak; açıkça onaylayın (onay: true)." }, { status: 422 });
  }
  const a = overrideAnahtarlari({
    marka: d.marka, model: d.scope === "BRAND" ? null : d.model,
    versiyon: d.scope === "TRIM" ? d.versiyon : null, paket: d.scope === "TRIM" ? d.paket : null,
  });
  if (!a.brandKey || (d.scope !== "BRAND" && !a.modelKey) || (d.scope === "TRIM" && !a.versiyonKey && !a.paketKey)) {
    return NextResponse.json({ error: "Ad en az bir harf veya rakam içermeli" }, { status: 422 });
  }
  const etiket = [d.marka, d.scope !== "BRAND" ? d.model : null, d.scope === "TRIM" ? [d.versiyon, d.paket].filter(Boolean).join(" · ") : null].filter(Boolean).join(" / ");
  try {
    const kayit = await prisma.$transaction(async (tx) => {
      const where = { kategori_scope_brandKey_modelKey_versiyonKey_paketKey: { kategori: d.kategori, scope: d.scope, ...a } };
      const labels = { marka: d.marka, model: d.model ?? null, versiyon: d.versiyon ?? null, paket: d.paket ?? null };
      const r = await tx.catalogOverride.upsert({
        where,
        update: { isActive: true, labels, note: d.note ?? null, orphanedAt: null },
        create: { kategori: d.kategori, scope: d.scope, ...a, labels, note: d.note ?? null, createdById: k.admin.userId },
      });
      await denetimYaz(tx, {
        admin: k.admin, action: "OVERRIDE_HIDE", entityType: "OVERRIDE", entityId: r.id, entityLabel: `${d.kategori}: ${etiket}`,
        after: { kategori: d.kategori, scope: d.scope, ...a }, meta: d.note ? { not: d.note } : undefined,
      });
      return r;
    });
    katalogOnbellekTemizle();
    return NextResponse.json({ ok: true, id: kayit.id }, { status: 201 });
  } catch (e) {
    return hataYaniti(e);
  }
}

// Geri al (gizlemeyi kaldır)
export async function DELETE(req: Request) {
  const k = await adminIstek(req, { anahtar: "yazma", adet: 30, pencereMs: 60_000 });
  if ("hata" in k) return k.hata;
  const govde = (await jsonGovde(req)) as { id?: unknown } | null;
  const id = pozitifTamsayiId(govde?.id);
  if (id === null) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  try {
    await prisma.$transaction(async (tx) => {
      const r = await tx.catalogOverride.findUnique({ where: { id } });
      if (!r || !r.isActive) return;
      await tx.catalogOverride.update({ where: { id }, data: { isActive: false } });
      const l = r.labels as Record<string, string | null>;
      await denetimYaz(tx, {
        admin: k.admin, action: "OVERRIDE_RESTORE", entityType: "OVERRIDE", entityId: id,
        entityLabel: `${r.kategori}: ${[l.marka, l.model, [l.versiyon, l.paket].filter(Boolean).join(" · ")].filter(Boolean).join(" / ")}`,
      });
    });
    katalogOnbellekTemizle();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return hataYaniti(e);
  }
}
