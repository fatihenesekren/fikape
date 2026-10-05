// Ana sayfa "Öne çıkan araçlar" kürasyonu — DB'den bağımsız saf mantık (bkz. kurasyon.test.ts).
//
// Karar (kullanıcı): pin/elle seçim YOK; kural tabanlı. Zorunlu uygunluk: yayında + görselli + ONAYLI AI özeti
// + veri doluluğu eşiği. Sıralama: yorum puanı (yorum arttıkça ağırlık kazanır) + veri doluluğu + görüntülenme.
// "Yenilik" sinyali bilerek yok — toplu eklemenin vitrini ele geçirmesine yol açıyordu.
import { getCriticalFields } from "@/lib/specFields";
import { calcShrunkScore } from "@/lib/brandIndex";

export const VITRIN_LIMITI = 12;
export const KATEGORI_TAVANI = 3;
/** Kritik özelliklerin en az bu oranı dolu olmayan kart vitrine çıkmaz. */
export const MIN_KRITIK_DOLULUK = 0.5;
/** Yorum ağırlığı: model başına yayınlanmış yorum sayısı / bu değer (tavan 1). */
export const YORUM_DOYUM = 5;
const SHRINKAGE_M = 5;

export interface VitrinAday {
  id: number;
  modelId: number;
  categorySlug: string;
  attributes: Record<string, unknown>;
  year: number | null;
  /** Yayında (ACTIVE + isActive) */
  yayinda: boolean;
  imageUrl: string | null;
  /** Görsel atıf kaydı var mı (bilgi amaçlı, veri doluluğuna katkı) */
  atifVar: boolean;
  /** Onaylı (APPROVED) AI özeti var mı */
  aiOzetOnayli: boolean;
  yorumSayisi: number;
  /** 0–10 ortalama (yorum yoksa 0) */
  yorumOrtalamasi: number;
  /** Son 28 gün + bu hafta görüntülenme */
  goruntulenme: number;
}

const doluMu = (v: unknown) => v !== undefined && v !== null && v !== "";

/** Kritik özelliklerin dolu oranı (0–1). */
export function kritikDoluluk(categorySlug: string, attrs: Record<string, unknown>): number {
  const alanlar = getCriticalFields(categorySlug, String(attrs.fuel_type ?? ""), String(attrs.body_type ?? ""));
  if (!alanlar.length) return 1;
  return alanlar.filter((k) => doluMu(attrs[k])).length / alanlar.length;
}

/** Veri doluluğu D (0–1): kritik alanlar %60, genel özellik zenginliği %25, görsel atfı %15. */
export function veriDoluluk(a: Pick<VitrinAday, "categorySlug" | "attributes" | "atifVar">): number {
  const genel = Math.min(1, Object.values(a.attributes).filter(doluMu).length / 10);
  return 0.6 * kritikDoluluk(a.categorySlug, a.attributes) + 0.25 * genel + 0.15 * (a.atifVar ? 1 : 0);
}

export function vitrineUygun(a: VitrinAday): boolean {
  return (
    a.yayinda &&
    !!a.imageUrl &&
    a.aiOzetOnayli &&
    kritikDoluluk(a.categorySlug, a.attributes) >= MIN_KRITIK_DOLULUK
  );
}

/** Kararlı (rastgele olmayan) eşitlik bozucu: aynı id her zaman aynı değeri verir. */
export function kararliHash(id: number): number {
  let h = Math.imul(id, 2654435761) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  return (h % 10000) / 10000;
}

function logNorm(x: number, max: number): number {
  return max > 0 ? Math.log1p(x) / Math.log1p(max) : 0;
}

export interface KurasyonSonucu { id: number; skor: number }

/**
 * @param globalOrtalama Yorumlu ürünlerin genel puan ortalaması (Bayesçi küçültme için); yoksa 0
 */
export function kurasyonYap(
  adaylar: VitrinAday[],
  opts: { limit?: number; kategoriTavani?: number; globalOrtalama?: number } = {},
): KurasyonSonucu[] {
  const limit = opts.limit ?? VITRIN_LIMITI;
  const tavan = opts.kategoriTavani ?? KATEGORI_TAVANI;
  const uygunlar = adaylar.filter(vitrineUygun);
  if (!uygunlar.length) return [];

  const maxV = Math.max(0, ...uygunlar.map((a) => a.goruntulenme));
  type Puanli = { a: VitrinAday; skor: number };
  const puanli: Puanli[] = uygunlar.map((a) => {
    const D = veriDoluluk(a);
    const V = logNorm(a.goruntulenme, maxV);
    const w = Math.min(1, a.yorumSayisi / YORUM_DOYUM);
    const R = a.yorumSayisi > 0
      ? calcShrunkScore({ reviewCount: a.yorumSayisi, rawAvg: a.yorumOrtalamasi, categoryAvg: opts.globalOrtalama ?? a.yorumOrtalamasi, m: SHRINKAGE_M }) / 10
      : 0;
    // Yorum yokken (w=0) yalnız veri doluluğu + görüntülenme; yorum arttıkça yorum puanı belirleyici olur.
    const skor = w * (0.6 * R + 0.25 * D + 0.15 * V) + (1 - w) * (0.7 * D + 0.3 * V);
    return { a, skor };
  });
  const sirala = (x: Puanli, y: Puanli) =>
    y.skor - x.skor || kararliHash(x.a.id) - kararliHash(y.a.id) || x.a.id - y.a.id;
  puanli.sort(sirala);

  // Model başına tek temsilci (en yüksek puanlı)
  const gorulen = new Set<number>();
  const tekil = puanli.filter((p) => {
    if (gorulen.has(p.a.modelId)) return false;
    gorulen.add(p.a.modelId);
    return true;
  });

  // Kategori dengesi: önce her kategoriden en iyi 1, sonra tavanla doldur, kalan slotlar genel sıradan
  const secilen: Puanli[] = [];
  const sec = new Set<number>();
  const katSay = new Map<string, number>();
  const al = (p: Puanli) => {
    secilen.push(p);
    sec.add(p.a.id);
    katSay.set(p.a.categorySlug, (katSay.get(p.a.categorySlug) ?? 0) + 1);
  };
  for (const p of tekil) if (!katSay.has(p.a.categorySlug) && secilen.length < limit) al(p);
  for (const p of tekil) if (!sec.has(p.a.id) && (katSay.get(p.a.categorySlug) ?? 0) < tavan && secilen.length < limit) al(p);
  for (const p of tekil) if (!sec.has(p.a.id) && secilen.length < limit) al(p);

  return secilen.sort(sirala).map((p) => ({ id: p.a.id, skor: p.skor }));
}
