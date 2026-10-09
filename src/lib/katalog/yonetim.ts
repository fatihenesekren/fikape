import { revalidateTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { EK_ETIKET } from "@/lib/katalog/ekSunucu";
import { ARAC_HAVUZU_ETIKETI, GORSEL_KAYNAK_ETIKETI } from "@/lib/cacheEtiketleri";
import type { AdminKimlik } from "@/lib/adminIstek";

export type Tx = Prisma.TransactionClient;

export type DenetimEylemi =
  | "PRODUCT_CREATE" | "PRODUCT_UPDATE" | "PRODUCT_DEACTIVATE" | "PRODUCT_REACTIVATE" | "PRODUCT_DELETE"
  | "BRAND_RENAME" | "BRAND_MERGE" | "MODEL_RENAME" | "MODEL_MERGE"
  | "OVERRIDE_HIDE" | "OVERRIDE_RESTORE";

/** Denetim satırı — asıl işlemle AYNI transaction içinde çağrılır (yazılamazsa işlem geri alınır). */
export async function denetimYaz(
  tx: Tx,
  g: {
    admin: AdminKimlik;
    action: DenetimEylemi;
    entityType: "PRODUCT" | "BRAND" | "MODEL" | "OVERRIDE";
    entityId?: number | null;
    entityLabel?: string | null;
    before?: unknown;
    after?: unknown;
    meta?: unknown;
  },
) {
  const json = (v: unknown) => (v === undefined || v === null ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue));
  await tx.catalogAuditLog.create({
    data: {
      adminId: g.admin.userId,
      adminLabel: g.admin.label,
      action: g.action,
      entityType: g.entityType,
      entityId: g.entityId ?? null,
      entityLabel: g.entityLabel?.slice(0, 240) ?? null,
      before: json(g.before),
      after: json(g.after),
      meta: json(g.meta),
    },
  });
}

/** Form/katalog önbelleğini hemen geçersiz kıl (commit'ten SONRA çağrılmalı). */
export function katalogOnbellekTemizle() {
  revalidateTag(EK_ETIKET, { expire: 0 });
  revalidateTag(ARAC_HAVUZU_ETIKETI, { expire: 0 }); // /araclar kategori havuzu
  revalidateTag(GORSEL_KAYNAK_ETIKETI, { expire: 0 }); // ürün pasife alma/silme/yeniden adlandırma atıf listesini de etkiler
}

/** Product.name üretimi (öneri onayı ve /api/oneriler ile aynı biçim). */
export function urunAdi(marka: string, model: string, trimName: string | null | undefined, yil: number | null | undefined): string {
  return `${marka} ${model}${trimName ? ` ${trimName}` : ""}${yil ? ` ${yil}` : ""}`;
}

/** Eski slug → güncel kayıt (marka/model yeniden adlandırma ve birleştirme sonrası). Yoksa null. */
export async function aliasCoz(tx: Tx, kind: "BRAND" | "MODEL", slug: string): Promise<number | null> {
  const a = await tx.catalogSlugAlias.findUnique({ where: { kind_oldSlug: { kind, oldSlug: slug } }, select: { targetId: true } });
  return a?.targetId ?? null;
}

export async function aliasEkle(tx: Tx, kind: "BRAND" | "MODEL", oldSlug: string, targetId: number) {
  await tx.catalogSlugAlias.upsert({
    where: { kind_oldSlug: { kind, oldSlug } },
    update: { targetId },
    create: { kind, oldSlug, targetId },
  });
}

/** Aracın "adı eski önek + devamı" biçimindeki Product.name değerinde öneki yenisiyle değiştirir; uymayanı atlar. */
export function onekDegistir(ad: string, eskiOnek: string, yeniOnek: string): string | null {
  return ad.startsWith(eskiOnek) ? yeniOnek + ad.slice(eskiOnek.length) : null;
}

/** Silmeyi engelleyen (kullanıcı verisi taşıyan) bağlar: hepsi 0 ise araç "bağsız"dır. */
export async function bagSayilari(tx: Tx, productId: number) {
  const [yorum, garaj, favori, takas, soru, foto, rapor, sigorta, satis, bekleyenOneri] = await Promise.all([
    tx.review.count({ where: { productId } }),
    tx.userProduct.count({ where: { productId } }),
    tx.favorite.count({ where: { productId } }),
    tx.tradeListing.count({ where: { productId } }),
    tx.question.count({ where: { productId } }),
    tx.productPhoto.count({ where: { productId } }),
    tx.contentReport.count({ where: { productId } }),
    tx.insuranceLead.count({ where: { productId } }),
    tx.saleLead.count({ where: { productId } }),
    tx.vehicleSuggestion.count({ where: { productId, status: "PENDING" } }),
  ]);
  const sayilar = { yorum, garaj, favori, takas, soru, foto, rapor, sigorta, satis, bekleyenOneri };
  const toplam = Object.values(sayilar).reduce((a, b) => a + b, 0);
  return { ...sayilar, toplam };
}
