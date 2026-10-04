// Admin katalog yönetimi — araç ekleme / düzeltme / pasife alma / silme iş mantığı.
// Route'lar yalnız kapı + doğrulama + yanıt çevirisi yapar; kurallar burada (test edilebilir).
import { prisma } from "@/lib/prisma";
import type { AdminKimlik } from "@/lib/adminIstek";
import { slugify } from "@/lib/slugify";
import { findExistingVehicles, birebirAyniArac } from "@/lib/existingVehicle";
import { trimAdi } from "@/lib/katalog/secim";
import { trimParcala } from "@/lib/katalog/ek";
import { benzerUyarilariGetir } from "@/lib/katalog/benzerSunucu";
import { aliasCoz, bagSayilari, denetimYaz, urunAdi, type Tx } from "@/lib/katalog/yonetim";
import { urunSlugTabani, type AracDuzelt, type AracEkle } from "@/lib/katalog/urunDogrula";

/** Route'un HTTP yanıtına çevireceği iş hatası (transaction'ı geri alır). */
export class IsHatasi extends Error {
  constructor(public status: number, public govde: Record<string, unknown>) {
    super(String(govde.error ?? "Hata"));
  }
}

const OPS = { timeout: 20_000, maxWait: 5_000 } as const;

type Nitelikler = Record<string, unknown>;
const nitelik = (a: unknown): Nitelikler => (a && typeof a === "object" && !Array.isArray(a) ? (a as Nitelikler) : {});

/** Marka: slug (ya da eski slug takma adı) ile mevcut kaydı bulur; yoksa null (oluşturma çağırana ait). */
async function markaBul(tx: Tx, ad: string) {
  const slug = slugify(ad);
  const var_ = await tx.brand.findUnique({ where: { slug } });
  if (var_) return var_;
  const hedef = await aliasCoz(tx, "BRAND", slug);
  return hedef ? tx.brand.findUnique({ where: { id: hedef } }) : null;
}

async function modelBul(tx: Tx, markaAdi: string, yazilanMarka: string, modelAdi: string) {
  const var_ = await tx.model.findUnique({ where: { slug: slugify(`${markaAdi}-${modelAdi}`) } });
  if (var_) return var_;
  const hedef = await aliasCoz(tx, "MODEL", slugify(`${yazilanMarka}-${modelAdi}`));
  return hedef ? tx.model.findUnique({ where: { id: hedef } }) : null;
}

type UrunOzetGirdisi = {
  name: string; slug: string; year: number | null; trimName: string | null; status: string; isActive: boolean;
  attributes: unknown; brand?: { name: string }; model?: { name: string };
};
const ozet = (p: UrunOzetGirdisi) => ({
  name: p.name, slug: p.slug, marka: p.brand?.name, model: p.model?.name, year: p.year, trimName: p.trimName,
  status: p.status, isActive: p.isActive,
  fuel_type: nitelik(p.attributes).fuel_type ?? null, transmission: nitelik(p.attributes).transmission ?? null,
});

// ─── Ekleme ──────────────────────────────────────────────────────────────────
export async function aracEkle(admin: AdminKimlik, g: AracEkle) {
  const trimName = trimAdi(g.versiyon ?? null, g.paket ?? null) || null;

  // Yazım benzerliği uyarısı sunucuda da zorunlu (arayüzü atlamak onayı atlatamaz)
  if (!g.benzerlikOnayi) {
    const benzerler = await benzerUyarilariGetir({ kategori: g.kategori, marka: g.marka, model: g.model, trim: trimName });
    if (benzerler.length) throw new IsHatasi(409, { error: "Benzer adlar bulundu", benzerler });
  }

  return prisma.$transaction(async (tx) => {
    // Aynı marka için eşzamanlı eklemeleri sıraya koy: kopya kontrolü + create tek kilit altında
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"katalog-ekle:" + slugify(g.marka)}))`;

    let brand = await markaBul(tx, g.marka);
    const bAdi = brand?.name ?? g.marka;
    let model = await modelBul(tx, bAdi, g.marka, g.model);
    if (brand && model && model.brandId !== brand.id) {
      throw new IsHatasi(409, { error: "Bu model adı başka bir markaya ait görünüyor; adı farklı yazın" });
    }
    const mAdi = model?.name ?? g.model;

    const mevcut = await findExistingVehicles(bAdi, mAdi, g.kategori, tx);
    const yeni = { year: g.yil, trimName, fuelType: g.yakit ?? null, transmission: g.vites ?? null };
    const kopya = mevcut.filter((m) => birebirAyniArac(m, yeni));
    if (kopya.length) throw new IsHatasi(409, { error: "Bu araç zaten katalogda mevcut", mevcut: kopya[0] });

    const kategori = await tx.category.findUnique({ where: { slug: g.kategori }, select: { id: true } });
    if (!kategori) throw new IsHatasi(422, { error: "Geçersiz kategori" });

    const yeniMarka = !brand;
    if (!brand) brand = await tx.brand.create({ data: { slug: slugify(g.marka), name: g.marka } });
    if (!model) {
      model = await tx.model.create({ data: { slug: slugify(`${bAdi}-${g.model}`), name: g.model, brandId: brand.id } });
    } else if (model.brandId !== brand.id) {
      throw new IsHatasi(409, { error: "Bu model adı başka bir markaya ait görünüyor; adı farklı yazın" });
    }

    const baz = urunSlugTabani(bAdi, mAdi, trimName, g.yil);
    if (!baz) throw new IsHatasi(422, { error: "Adlar en az bir harf veya rakam içermeli" });
    const slug = mevcut.length > 0 && g.vites ? `${baz}-${slugify(g.vites)}` : baz;
    // Sessiz zaman-soneki kopya üretme: çakışmayı açıkça bildir
    const cakisan = await tx.product.findUnique({ where: { slug }, select: { slug: true, name: true } });
    if (cakisan) throw new IsHatasi(409, { error: "Bu adreste (slug) bir araç zaten var", mevcut: cakisan });

    const attributes: Record<string, string | number> = {};
    if (g.yakit) attributes.fuel_type = g.yakit;
    if (g.vites) attributes.transmission = g.vites;
    if (g.beygir) attributes.power_hp = g.beygir;

    const urun = await tx.product.create({
      data: {
        slug, name: urunAdi(bAdi, mAdi, trimName, g.yil), year: g.yil, trimName, attributes,
        categoryId: kategori.id, brandId: brand.id, modelId: model.id, status: "ACTIVE", isActive: true,
      },
      include: { brand: { select: { name: true } }, model: { select: { name: true } } },
    });
    await denetimYaz(tx, {
      admin, action: "PRODUCT_CREATE", entityType: "PRODUCT", entityId: urun.id, entityLabel: urun.name,
      after: ozet(urun), meta: { kategori: g.kategori, yeniMarka, bildirimGonder: g.bildirimGonder },
    });
    return { id: urun.id, slug: urun.slug, name: urun.name };
  }, OPS);
}

// ─── Düzeltme ────────────────────────────────────────────────────────────────
export async function aracDuzelt(admin: AdminKimlik, id: number, g: AracDuzelt) {
  const adDegisiyor = g.marka !== undefined || g.model !== undefined || g.versiyon !== undefined || g.paket !== undefined;
  const onceki = await prisma.product.findUnique({ where: { id }, include: { brand: true, model: true, category: { select: { slug: true } } } });
  if (!onceki) throw new IsHatasi(404, { error: "Araç bulunamadı" });

  if (adDegisiyor && !g.benzerlikOnayi) {
    const t0 = trimParcala(onceki.trimName);
    const v = g.versiyon !== undefined ? g.versiyon : t0.v || null;
    const p = g.paket !== undefined ? g.paket : t0.p;
    const benzerler = await benzerUyarilariGetir({
      kategori: onceki.category?.slug ?? "otomobil", marka: g.marka ?? onceki.brand.name, model: g.model ?? onceki.model.name,
      trim: trimAdi(v ?? null, p ?? null) || null,
    });
    if (benzerler.length) throw new IsHatasi(409, { error: "Benzer adlar bulundu", benzerler });
  }

  return prisma.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id }, include: { brand: true, model: true, category: { select: { slug: true } } } });
    if (!p) throw new IsHatasi(404, { error: "Araç bulunamadı" });
    if (p.updatedAt.toISOString() !== g.beklenenGuncelleme) {
      throw new IsHatasi(409, { error: "Bu araç siz düzenlerken başka biri tarafından değiştirildi. Sayfayı yenileyin." });
    }

    let brand = p.brand;
    let model = p.model;
    if (g.marka !== undefined && g.marka !== p.brand.name) {
      brand = (await markaBul(tx, g.marka)) ?? (await tx.brand.create({ data: { slug: slugify(g.marka), name: g.marka } }));
    }
    if (g.model !== undefined || brand.id !== p.brand.id) {
      const mAdi = g.model ?? p.model.name;
      const bulunan = await modelBul(tx, brand.name, g.marka ?? brand.name, mAdi);
      if (bulunan && bulunan.brandId !== brand.id) throw new IsHatasi(409, { error: "Bu model adı başka bir markaya ait görünüyor; adı farklı yazın" });
      model = bulunan ?? (await tx.model.create({ data: { slug: slugify(`${brand.name}-${mAdi}`), name: mAdi, brandId: brand.id } }));
    }

    const t0 = trimParcala(p.trimName);
    const trimName = g.versiyon === undefined && g.paket === undefined
      ? p.trimName
      : trimAdi(g.versiyon !== undefined ? g.versiyon : t0.v || null, g.paket !== undefined ? g.paket : t0.p) || null;
    const yil = g.yil ?? p.year;
    const attrs: Nitelikler = { ...nitelik(p.attributes) };
    if (g.yakit !== undefined) { if (g.yakit) attrs.fuel_type = g.yakit; else delete attrs.fuel_type; }
    if (g.vites !== undefined) { if (g.vites) attrs.transmission = g.vites; else delete attrs.transmission; }

    // Düzeltme sonucu başka bir araçla birebir aynı olmasın
    const digerleri = await findExistingVehicles(brand.name, model.name, p.category?.slug, tx);
    const cakisan = digerleri.filter((m) => m.slug !== p.slug && birebirAyniArac(m, {
      year: yil, trimName, fuelType: (attrs.fuel_type as string) ?? null, transmission: (attrs.transmission as string) ?? null,
    }));
    if (cakisan.length) throw new IsHatasi(409, { error: "Bu değişiklik aracı mevcut başka bir araçla aynı yapıyor", mevcut: cakisan[0] });

    const ad = urunAdi(brand.name, model.name, trimName, yil);
    const sonuc = await tx.product.updateMany({
      where: { id, updatedAt: p.updatedAt },
      data: { brandId: brand.id, modelId: model.id, name: ad, year: yil, trimName, attributes: attrs as never },
    });
    if (sonuc.count === 0) throw new IsHatasi(409, { error: "Bu araç siz düzenlerken değiştirildi. Sayfayı yenileyin." });

    const sonra = await tx.product.findUniqueOrThrow({ where: { id }, include: { brand: { select: { name: true } }, model: { select: { name: true } } } });
    await denetimYaz(tx, {
      admin, action: "PRODUCT_UPDATE", entityType: "PRODUCT", entityId: id, entityLabel: ad,
      before: ozet({ ...p, brand: { name: p.brand.name }, model: { name: p.model.name } }), after: ozet(sonra),
    });
    return { id, slug: p.slug, name: ad, guncelleme: sonra.updatedAt.toISOString() };
  }, OPS);
}

// ─── Pasife alma / geri alma ─────────────────────────────────────────────────
export async function aracDurumDegistir(admin: AdminKimlik, id: number, islem: "pasif" | "aktif", neden: string | null) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id } });
    if (!p) throw new IsHatasi(404, { error: "Araç bulunamadı" });
    if (p.status !== "ACTIVE") throw new IsHatasi(409, { error: "Yalnızca yayındaki (ACTIVE) araçlar pasife alınabilir/geri alınabilir" });
    const hedef = islem === "aktif";
    if (p.isActive === hedef) throw new IsHatasi(409, { error: hedef ? "Araç zaten aktif" : "Araç zaten pasif" });
    const r = await tx.product.updateMany({ where: { id, isActive: !hedef, status: "ACTIVE" }, data: { isActive: hedef } });
    if (r.count === 0) throw new IsHatasi(409, { error: "Durum arada değişti, sayfayı yenileyin" });
    await denetimYaz(tx, {
      admin, action: hedef ? "PRODUCT_REACTIVATE" : "PRODUCT_DEACTIVATE", entityType: "PRODUCT", entityId: id, entityLabel: p.name,
      before: { isActive: p.isActive }, after: { isActive: hedef }, meta: neden ? { neden } : undefined,
    });
    return { id, isActive: hedef };
  }, OPS);
}

// ─── Gerçek silme (yalnız bağsız araç) ───────────────────────────────────────
export async function aracSil(admin: AdminKimlik, id: number, onayMetni: string) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.product.findUnique({ where: { id } });
    if (!p) throw new IsHatasi(404, { error: "Araç bulunamadı" });
    if (onayMetni.trim() !== p.slug) throw new IsHatasi(422, { error: "Onay metni aracın adresi (slug) ile birebir aynı olmalı", beklenen: p.slug });
    // Sayım ve silme aynı transaction'da (arada eklenen bağ FK ile de engellenir: P2003 → 409)
    const bag = await bagSayilari(tx, id);
    if (bag.toplam > 0) throw new IsHatasi(409, { error: "Bu araca bağlı kayıtlar var; silinemez. Pasife alabilirsiniz.", bag });
    await tx.aiVehicleSummary.deleteMany({ where: { productId: id } });
    await tx.product.delete({ where: { id } });
    await denetimYaz(tx, {
      admin, action: "PRODUCT_DELETE", entityType: "PRODUCT", entityId: id, entityLabel: p.name,
      before: p, meta: { not: "Geri alınamaz; satırın anlık görüntüsü before alanında" },
    });
    return { id, slug: p.slug, imageUrl: p.imageUrl };
  }, OPS).catch((e: unknown) => {
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2003") {
      throw new IsHatasi(409, { error: "Silme sırasında araca bir kayıt bağlandı; silinemedi. Pasife alabilirsiniz." });
    }
    throw e;
  });
}
