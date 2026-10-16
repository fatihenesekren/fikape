import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Gösterilen araç puanı = yorumlardaki düz ortalama (sayfada görünen yorum puanlarıyla birebir uyumlu, kullanıcıya açıklama gerektirmez).
// SIRALAMA (ana sayfa "en yüksek puanlı", vitrin seçimi) için ayrıca `siralamaPuani` hesaplanır: güvene göre ağırlıklı ve az yorumda
// sitenin genel ortalamasına çekilmiş (Bayes) puan. Kullanıcı görmez; az yorumlu aracın tek bir uç/sahte puanla zirveye çıkmasını önler.
//  - Ağırlık: yorumun güven skoru (Review.trustScore 0-100, bkz. trustScore.ts) → 0,7×–1,2×.
//  - Sönümleme: SANAL_YORUM kadar sanal yorum, genel ortalamada.
export const SANAL_YORUM = 3;
const AGIRLIK_MIN = 0.7;
const AGIRLIK_ARALIK = 0.5; // 0,7 + trustScore/100 × 0,5  →  0,7 … 1,2

export type Puanlar = Record<"scoreFiyat" | "scoreKalite" | "scorePerformans" | "scoreOverall", number>;

export interface UrunPuaniSatiri {
  productId: number;
  _count: { id: number };
  /** Gösterilen puan: düz ortalama. */
  _avg: Puanlar;
  /** Yalnız sıralama için: güven ağırlıklı + sönümlü genel puan. */
  siralamaPuani: number;
}

interface HamToplam { n: number; aFiyat: number; aKalite: number; aPerformans: number; aOverall: number; sw: number; swFiyat: number; swKalite: number; swPerformans: number; swOverall: number }

/** Saf hesap: ham ağırlıklı toplamlar + genel ortalama → sönümlenmiş puanlar. */
export function puanHesapla(t: Pick<HamToplam, "sw" | "swFiyat" | "swKalite" | "swPerformans" | "swOverall">, oncel: Puanlar): Puanlar {
  const payda = t.sw + SANAL_YORUM;
  return {
    scoreFiyat: (t.swFiyat + SANAL_YORUM * oncel.scoreFiyat) / payda,
    scoreKalite: (t.swKalite + SANAL_YORUM * oncel.scoreKalite) / payda,
    scorePerformans: (t.swPerformans + SANAL_YORUM * oncel.scorePerformans) / payda,
    scoreOverall: (t.swOverall + SANAL_YORUM * oncel.scoreOverall) / payda,
  };
}

const AGIRLIK_SQL = Prisma.raw(`(${AGIRLIK_MIN} + COALESCE("trustScore", 35) / 100.0 * ${AGIRLIK_ARALIK})`);
const TOPLAM_SQL = Prisma.sql`
  COUNT(*)::int AS n,
  COALESCE(AVG("scoreFiyat"), 0)::float8 AS "aFiyat",
  COALESCE(AVG("scoreKalite"), 0)::float8 AS "aKalite",
  COALESCE(AVG("scorePerformans"), 0)::float8 AS "aPerformans",
  COALESCE(AVG("scoreOverall"), 0)::float8 AS "aOverall",
  COALESCE(SUM(${AGIRLIK_SQL}), 0)::float8 AS sw,
  COALESCE(SUM(${AGIRLIK_SQL} * "scoreFiyat"), 0)::float8 AS "swFiyat",
  COALESCE(SUM(${AGIRLIK_SQL} * "scoreKalite"), 0)::float8 AS "swKalite",
  COALESCE(SUM(${AGIRLIK_SQL} * "scorePerformans"), 0)::float8 AS "swPerformans",
  COALESCE(SUM(${AGIRLIK_SQL} * "scoreOverall"), 0)::float8 AS "swOverall"`;

const VARSAYILAN_ONCEL: Puanlar = { scoreFiyat: 3, scoreKalite: 3, scorePerformans: 3, scoreOverall: 3 };

/** Sitenin genel (ağırlıklı) ortalaması; yorum yoksa tarafsız orta değer. */
async function genelOncel(): Promise<Puanlar> {
  const [g] = await prisma.$queryRaw<HamToplam[]>(Prisma.sql`SELECT ${TOPLAM_SQL} FROM reviews WHERE status = 'PUBLISHED'`);
  if (!g || !g.sw) return VARSAYILAN_ONCEL;
  return {
    scoreFiyat: g.swFiyat / g.sw, scoreKalite: g.swKalite / g.sw, scorePerformans: g.swPerformans / g.sw, scoreOverall: g.swOverall / g.sw,
  };
}

/** `review.groupBy({ by:["productId"], where:{status:"PUBLISHED", productId:{in}}, _avg, _count })` yerine. ids verilmezse tüm ürünler. */
export async function urunPuanlari(productIds?: number[]): Promise<UrunPuaniSatiri[]> {
  if (productIds && productIds.length === 0) return [];
  const filtre = productIds ? Prisma.sql`AND "productId" IN (${Prisma.join(productIds)})` : Prisma.empty;
  const [satirlar, oncel] = await Promise.all([
    prisma.$queryRaw<(HamToplam & { productId: number })[]>(
      Prisma.sql`SELECT "productId", ${TOPLAM_SQL} FROM reviews WHERE status = 'PUBLISHED' ${filtre} GROUP BY "productId"`,
    ),
    genelOncel(),
  ]);
  return satirlar.map((s) => ({
    productId: s.productId,
    _count: { id: s.n },
    _avg: { scoreFiyat: s.aFiyat, scoreKalite: s.aKalite, scorePerformans: s.aPerformans, scoreOverall: s.aOverall },
    siralamaPuani: puanHesapla(s, oncel).scoreOverall,
  }));
}

/** `review.aggregate({ where:{productId, status:"PUBLISHED"}, _avg, _count })` yerine (tek ürün). */
export async function tekUrunPuani(productId: number): Promise<Pick<UrunPuaniSatiri, "_count" | "_avg">> {
  const [satir] = await urunPuanlari([productId]);
  return satir ?? { _count: { id: 0 }, _avg: { scoreFiyat: 0, scoreKalite: 0, scorePerformans: 0, scoreOverall: 0 } };
}
