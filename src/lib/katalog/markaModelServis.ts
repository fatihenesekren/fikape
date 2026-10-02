// Admin katalog yönetimi — marka/model yeniden adlandırma ve birleştirme.
//
// Değişmezler (bkz. mimari inceleme):
//  - Product.slug ASLA değişmez (yorum bağlantıları, skor API/rozet, karşılaştırma adresleri, e-postalar).
//  - Brand.slug = slugify(Brand.name) ve Model.slug = slugify(marka-model) eşleşme anahtarlarıdır (kopya kontrolü,
//    /api/katalog/ek, öner formu). Ad değişince slug da değişir; eski slug "catalog_slug_aliases" tablosuna yazılır.
//  - Product.name denormalize: yalnız "eski önek ile başlıyorsa" yeni önekle değiştirilir; uymayanlar atlanır ve raporlanır.
//  - Birleştirme geri alınamaz; önizleme (dryRun) + açık onay zorunludur. Kaynak kayıt silinir, slug'ı takma ada döner.
import { prisma } from "@/lib/prisma";
import type { AdminKimlik } from "@/lib/adminIstek";
import { slugify } from "@/lib/slugify";
import { buildSavedSearchCriteriaKey } from "@/lib/savedSearchCriteria";
import { birebirAyniArac } from "@/lib/existingVehicle";
import { aliasEkle, denetimYaz, onekDegistir, type Tx } from "@/lib/katalog/yonetim";
import { IsHatasi } from "@/lib/katalog/urunServis";

const OPS = { timeout: 30_000, maxWait: 5_000, isolationLevel: "Serializable" as const };

const nitelik = (a: unknown): Record<string, unknown> => (a && typeof a === "object" && !Array.isArray(a) ? (a as Record<string, unknown>) : {});

/** Ürün adlarında önek değiştirir; değişemeyenlerin (formüle uymayan adlar) id'lerini döndürür. */
async function urunAdlariniGuncelle(tx: Tx, urunler: { id: number; name: string }[], eski: string, yeni: string) {
  const atlanan: number[] = [];
  let guncellenen = 0;
  for (const u of urunler) {
    const yeniAd = onekDegistir(u.name, eski, yeni);
    if (yeniAd === null) { atlanan.push(u.id); continue; }
    if (yeniAd !== u.name) {
      await tx.product.update({ where: { id: u.id }, data: { name: yeniAd } });
      guncellenen++;
    }
  }
  return { guncellenen, atlanan };
}

// ─── Yeniden adlandırma ──────────────────────────────────────────────────────
export async function markaYenidenAdlandir(admin: AdminKimlik, id: number, yeniAd: string, beklenenEskiAd: string) {
  return prisma.$transaction(async (tx) => {
    const marka = await tx.brand.findUnique({ where: { id }, include: { models: true } });
    if (!marka) throw new IsHatasi(404, { error: "Marka bulunamadı" });
    if (marka.name !== beklenenEskiAd) throw new IsHatasi(409, { error: "Marka siz düzenlerken değişti. Sayfayı yenileyin." });
    if (marka.name === yeniAd) throw new IsHatasi(422, { error: "Yeni ad mevcut adla aynı" });

    const eskiSlug = marka.slug;
    const yeniSlug = slugify(yeniAd);
    if (yeniSlug !== eskiSlug) {
      const baska = await tx.brand.findUnique({ where: { slug: yeniSlug }, select: { id: true, name: true } });
      if (baska) throw new IsHatasi(409, { error: `"${baska.name}" markası zaten var; yeniden adlandırma yerine birleştirmeyi kullanın`, birlestir: baska });
    }

    // Alt modellerin slug'ları marka adından türetilir: önce çakışmaları denetle
    const modelPlani = marka.models.map((m) => ({ m, yeniSlug: slugify(`${yeniAd}-${m.name}`) }));
    for (const p of modelPlani) {
      if (p.yeniSlug === p.m.slug) continue;
      const c = await tx.model.findUnique({ where: { slug: p.yeniSlug }, select: { id: true, brandId: true } });
      if (c && c.id !== p.m.id) throw new IsHatasi(409, { error: `"${p.m.name}" modelinin yeni adresi (${p.yeniSlug}) başka bir modelle çakışıyor` });
    }

    const r = await tx.brand.updateMany({ where: { id, name: beklenenEskiAd }, data: { name: yeniAd, slug: yeniSlug } });
    if (r.count === 0) throw new IsHatasi(409, { error: "Marka siz düzenlerken değişti. Sayfayı yenileyin." });
    if (yeniSlug !== eskiSlug) {
      await tx.catalogSlugAlias.deleteMany({ where: { kind: "BRAND", oldSlug: yeniSlug } }); // eski adına geri dönülüyorsa takma ad temizlenir
      await aliasEkle(tx, "BRAND", eskiSlug, id);
    }
    for (const p of modelPlani) {
      if (p.yeniSlug === p.m.slug) continue;
      await tx.catalogSlugAlias.deleteMany({ where: { kind: "MODEL", oldSlug: p.yeniSlug } });
      await tx.model.update({ where: { id: p.m.id }, data: { slug: p.yeniSlug } });
      await aliasEkle(tx, "MODEL", p.m.slug, p.m.id);
    }

    const urunler = await tx.product.findMany({ where: { brandId: id }, select: { id: true, name: true } });
    const adlar = await urunAdlariniGuncelle(tx, urunler, `${marka.name} `, `${yeniAd} `);
    await denetimYaz(tx, {
      admin, action: "BRAND_RENAME", entityType: "BRAND", entityId: id, entityLabel: `${marka.name} → ${yeniAd}`,
      before: { name: marka.name, slug: eskiSlug }, after: { name: yeniAd, slug: yeniSlug },
      meta: { modelSayisi: marka.models.length, urunSayisi: urunler.length, adiGuncellenen: adlar.guncellenen, adiAtlananUrunIdleri: adlar.atlanan },
    });
    return { id, name: yeniAd, slug: yeniSlug, modelSayisi: marka.models.length, urunSayisi: urunler.length, adlar };
  }, OPS);
}

export async function modelYenidenAdlandir(admin: AdminKimlik, id: number, yeniAd: string, beklenenEskiAd: string) {
  return prisma.$transaction(async (tx) => {
    const model = await tx.model.findUnique({ where: { id }, include: { brand: true } });
    if (!model) throw new IsHatasi(404, { error: "Model bulunamadı" });
    if (model.name !== beklenenEskiAd) throw new IsHatasi(409, { error: "Model siz düzenlerken değişti. Sayfayı yenileyin." });
    if (model.name === yeniAd) throw new IsHatasi(422, { error: "Yeni ad mevcut adla aynı" });

    const eskiSlug = model.slug;
    const yeniSlug = slugify(`${model.brand.name}-${yeniAd}`);
    if (yeniSlug !== eskiSlug) {
      const baska = await tx.model.findUnique({ where: { slug: yeniSlug }, select: { id: true, name: true, brandId: true } });
      if (baska && baska.brandId !== model.brandId) throw new IsHatasi(409, { error: "Bu ad başka bir markanın modeliyle çakışıyor; farklı yazın" });
      if (baska) throw new IsHatasi(409, { error: `"${baska.name}" modeli zaten var; yeniden adlandırma yerine birleştirmeyi kullanın`, birlestir: baska });
    }
    const r = await tx.model.updateMany({ where: { id, name: beklenenEskiAd }, data: { name: yeniAd, slug: yeniSlug } });
    if (r.count === 0) throw new IsHatasi(409, { error: "Model siz düzenlerken değişti. Sayfayı yenileyin." });
    if (yeniSlug !== eskiSlug) {
      await tx.catalogSlugAlias.deleteMany({ where: { kind: "MODEL", oldSlug: yeniSlug } });
      await aliasEkle(tx, "MODEL", eskiSlug, id);
    }
    const urunler = await tx.product.findMany({ where: { modelId: id }, select: { id: true, name: true } });
    const adlar = await urunAdlariniGuncelle(tx, urunler, `${model.brand.name} ${model.name}`, `${model.brand.name} ${yeniAd}`);
    await denetimYaz(tx, {
      admin, action: "MODEL_RENAME", entityType: "MODEL", entityId: id, entityLabel: `${model.brand.name} ${model.name} → ${yeniAd}`,
      before: { name: model.name, slug: eskiSlug }, after: { name: yeniAd, slug: yeniSlug },
      meta: { urunSayisi: urunler.length, adiGuncellenen: adlar.guncellenen, adiAtlananUrunIdleri: adlar.atlanan },
    });
    return { id, name: yeniAd, slug: yeniSlug, urunSayisi: urunler.length, adlar };
  }, OPS);
}

// ─── Birleştirme ─────────────────────────────────────────────────────────────
export interface BirlestirOnizleme {
  tur: "MARKA" | "MODEL";
  kaynak: { id: number; ad: string };
  hedef: { id: number; ad: string };
  tasinacak: Record<string, number>;
  kategoriler: string[];
  /** Model birleştirmede: birleşince (yıl, donanım, yakıt, vites) aynı olacak ürün çiftleri */
  yinelenenCiftler: { kaynakSlug: string; hedefSlug: string }[];
  /** Marka birleştirmede: hedef markada aynı adresli model olan kaynak modeller (önce tek tek birleştirilmeli) */
  cakisanModeller: string[];
  engeller: string[];
}

async function modelOnizle(tx: Tx, kaynakId: number, hedefId: number): Promise<BirlestirOnizleme> {
  const [s, t] = await Promise.all([
    tx.model.findUnique({ where: { id: kaynakId }, include: { brand: true } }),
    tx.model.findUnique({ where: { id: hedefId }, include: { brand: true } }),
  ]);
  if (!s || !t) throw new IsHatasi(404, { error: "Model bulunamadı" });
  if (s.id === t.id) throw new IsHatasi(422, { error: "Kaynak ve hedef aynı olamaz" });
  const engeller: string[] = [];
  if (s.brandId !== t.brandId) engeller.push("Modeller aynı markaya ait olmalı (farklı marka için önce markaları birleştirin)");
  const [sUrun, tUrun, notlar] = await Promise.all([
    tx.product.findMany({ where: { modelId: s.id }, select: { id: true, slug: true, year: true, trimName: true, attributes: true, category: { select: { name: true } } } }),
    tx.product.findMany({ where: { modelId: t.id }, select: { slug: true, year: true, trimName: true, attributes: true } }),
    tx.expertNote.count({ where: { modelId: s.id } }),
  ]);
  const ciftler: { kaynakSlug: string; hedefSlug: string }[] = [];
  for (const k of sUrun) {
    const ka = nitelik(k.attributes);
    for (const h of tUrun) {
      const ha = nitelik(h.attributes);
      const hedefMatch = { slug: h.slug, name: "", year: h.year, trimName: h.trimName, transmission: (ha.transmission as string) ?? null, fuelType: (ha.fuel_type as string) ?? null, reviewCount: 0 };
      if (birebirAyniArac(hedefMatch, { year: k.year, trimName: k.trimName, fuelType: (ka.fuel_type as string) ?? null, transmission: (ka.transmission as string) ?? null })) {
        ciftler.push({ kaynakSlug: k.slug, hedefSlug: h.slug });
      }
    }
  }
  return {
    tur: "MODEL",
    kaynak: { id: s.id, ad: `${s.brand.name} ${s.name}` }, hedef: { id: t.id, ad: `${t.brand.name} ${t.name}` },
    tasinacak: { urun: sUrun.length, ustaNotu: notlar },
    kategoriler: [...new Set(sUrun.map((u) => u.category?.name ?? ""))].filter(Boolean),
    yinelenenCiftler: ciftler, cakisanModeller: [], engeller,
  };
}

async function markaOnizle(tx: Tx, kaynakId: number, hedefId: number): Promise<BirlestirOnizleme> {
  const [s, t] = await Promise.all([
    tx.brand.findUnique({ where: { id: kaynakId }, include: { models: true } }),
    tx.brand.findUnique({ where: { id: hedefId }, include: { models: true } }),
  ]);
  if (!s || !t) throw new IsHatasi(404, { error: "Marka bulunamadı" });
  if (s.id === t.id) throw new IsHatasi(422, { error: "Kaynak ve hedef aynı olamaz" });
  const engeller: string[] = [];
  const hedefSluglar = new Set(t.models.map((m) => m.slug));
  const cakisan = s.models.filter((m) => hedefSluglar.has(slugify(`${t.name}-${m.name}`))).map((m) => m.name);
  if (cakisan.length) engeller.push("Hedef markada aynı adlı modeller var: önce bu modelleri tek tek birleştirin");
  const [urunler, takas, aramalar] = await Promise.all([
    tx.product.findMany({ where: { brandId: s.id }, select: { category: { select: { name: true } } } }),
    tx.tradeListing.count({ where: { wantBrandId: s.id } }),
    tx.savedSearch.count({ where: { brandId: s.id } }),
  ]);
  return {
    tur: "MARKA",
    kaynak: { id: s.id, ad: s.name }, hedef: { id: t.id, ad: t.name },
    tasinacak: { model: s.models.length, urun: urunler.length, takasBeklentisi: takas, kayitliArama: aramalar },
    kategoriler: [...new Set(urunler.map((u) => u.category?.name ?? ""))].filter(Boolean),
    yinelenenCiftler: [], cakisanModeller: cakisan, engeller,
  };
}

export async function birlestirOnizle(tur: "MARKA" | "MODEL", kaynakId: number, hedefId: number) {
  return prisma.$transaction((tx) => (tur === "MODEL" ? modelOnizle(tx, kaynakId, hedefId) : markaOnizle(tx, kaynakId, hedefId)), { timeout: 15_000 });
}

export async function birlestir(admin: AdminKimlik, tur: "MARKA" | "MODEL", kaynakId: number, hedefId: number) {
  return prisma.$transaction(async (tx) => {
    const on = tur === "MODEL" ? await modelOnizle(tx, kaynakId, hedefId) : await markaOnizle(tx, kaynakId, hedefId);
    if (on.engeller.length) throw new IsHatasi(409, { error: on.engeller[0], onizleme: on });

    if (tur === "MODEL") {
      const s = await tx.model.findUniqueOrThrow({ where: { id: kaynakId }, include: { brand: true } });
      const t = await tx.model.findUniqueOrThrow({ where: { id: hedefId }, include: { brand: true } });
      const urunler = await tx.product.findMany({ where: { modelId: s.id }, select: { id: true, name: true } });
      const notlar = await tx.expertNote.findMany({ where: { modelId: s.id }, select: { id: true } });
      await tx.product.updateMany({ where: { modelId: s.id }, data: { modelId: t.id } });
      await tx.expertNote.updateMany({ where: { modelId: s.id }, data: { modelId: t.id } });
      await tx.$executeRaw`UPDATE "expert_sponsorships" SET "scopeModelIds" = (SELECT COALESCE(array_agg(DISTINCT x), '{}') FROM unnest(array_replace("scopeModelIds", ${s.id}, ${t.id})) AS x) WHERE ${s.id} = ANY("scopeModelIds")`;
      const adlar = await urunAdlariniGuncelle(tx, urunler, `${s.brand.name} ${s.name}`, `${t.brand.name} ${t.name}`);
      await tx.catalogSlugAlias.updateMany({ where: { kind: "MODEL", targetId: s.id }, data: { targetId: t.id } });
      await tx.catalogSlugAlias.deleteMany({ where: { kind: "MODEL", oldSlug: s.slug } });
      await aliasEkle(tx, "MODEL", s.slug, t.id);
      await tx.model.delete({ where: { id: s.id } });
      await denetimYaz(tx, {
        admin, action: "MODEL_MERGE", entityType: "MODEL", entityId: t.id, entityLabel: `${on.kaynak.ad} → ${on.hedef.ad}`,
        before: { kaynak: { id: s.id, name: s.name, slug: s.slug } }, after: { hedef: { id: t.id, name: t.name, slug: t.slug } },
        meta: { tasinanUrunIdleri: urunler.map((u) => u.id), tasinanUstaNotuIdleri: notlar.map((n) => n.id), yinelenenCiftler: on.yinelenenCiftler, adiAtlananUrunIdleri: adlar.atlanan },
      });
      return { onizleme: on, adlar };
    }

    // MARKA
    const s = await tx.brand.findUniqueOrThrow({ where: { id: kaynakId }, include: { models: true } });
    const t = await tx.brand.findUniqueOrThrow({ where: { id: hedefId } });
    const urunler = await tx.product.findMany({ where: { brandId: s.id }, select: { id: true, name: true } });
    for (const m of s.models) {
      const yeniSlug = slugify(`${t.name}-${m.name}`);
      await tx.catalogSlugAlias.deleteMany({ where: { kind: "MODEL", oldSlug: yeniSlug } });
      await tx.model.update({ where: { id: m.id }, data: { brandId: t.id, slug: yeniSlug } });
      if (yeniSlug !== m.slug) await aliasEkle(tx, "MODEL", m.slug, m.id);
    }
    await tx.product.updateMany({ where: { brandId: s.id }, data: { brandId: t.id } });
    const adlar = await urunAdlariniGuncelle(tx, urunler, `${s.name} `, `${t.name} `);
    await tx.tradeListing.updateMany({ where: { wantBrandId: s.id }, data: { wantBrandId: t.id } });
    const aramalar = await tx.savedSearch.findMany({ where: { brandId: s.id } });
    let silinenArama = 0;
    for (const a of aramalar) {
      const yeniKey = buildSavedSearchCriteriaKey({
        city: a.city, categoryId: a.categoryId, brandId: t.id, paymentIntent: a.paymentIntent, yearMin: a.yearMin, yearMax: a.yearMax,
        kmMin: a.kmMin, kmMax: a.kmMax, fuelTypes: a.fuelTypes as string[], transmissions: a.transmissions,
      });
      const ayni = await tx.savedSearch.findUnique({ where: { userId_criteriaKey: { userId: a.userId, criteriaKey: yeniKey } }, select: { id: true } });
      if (ayni) { await tx.savedSearch.delete({ where: { id: a.id } }); silinenArama++; } // aynı kullanıcının birebir aynı araması zaten var
      else await tx.savedSearch.update({ where: { id: a.id }, data: { brandId: t.id, criteriaKey: yeniKey } });
    }
    await tx.catalogSlugAlias.updateMany({ where: { kind: "BRAND", targetId: s.id }, data: { targetId: t.id } });
    await tx.catalogSlugAlias.deleteMany({ where: { kind: "BRAND", oldSlug: s.slug } });
    await aliasEkle(tx, "BRAND", s.slug, t.id);
    await tx.brand.delete({ where: { id: s.id } });
    await denetimYaz(tx, {
      admin, action: "BRAND_MERGE", entityType: "BRAND", entityId: t.id, entityLabel: `${s.name} → ${t.name}`,
      before: { kaynak: { id: s.id, name: s.name, slug: s.slug } }, after: { hedef: { id: t.id, name: t.name, slug: t.slug } },
      meta: { tasinanModelIdleri: s.models.map((m) => m.id), tasinanUrunIdleri: urunler.map((u) => u.id), silinenKayitliArama: silinenArama, adiAtlananUrunIdleri: adlar.atlanan },
    });
    return { onizleme: on, adlar };
  }, OPS);
}
