import { FUEL_LABELS } from "@/lib/fuel";
import { formatRange } from "@/lib/formatRange";
import { buildSavedSearchCriteriaKey } from "@/lib/savedSearchCriteria";

// Kayıtlı aramanın kullanıcıya gösterimi: özet satırı (aramanın "adı"), /takas bağlantısı, eşleşme bildirimi metni.
// Önceden SavedSearchPanel içinde gömülüydü; çubuk, liste sayfası ve bildirim aynı metni üretsin diye ortak, saf (sunucu
// ve istemciden güvenle kullanılır).
//
// Aramalara ayrıca bir "isim" alanı YOK (şema değişikliği gerekirdi): her aramanın kriterleri benzersiz (criteriaKey) ve
// özet satırı tüm kriterleri içerdiği için iki arama aynı başlığı taşıyamaz; bildirim de hangi aramanın eşleştiğini söyler.

export interface SavedSearchRow {
  id: number;
  city: string;
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
  paymentIntent: string | null;
  yearMin: number | null;
  yearMax: number | null;
  kmMin: number | null;
  kmMax: number | null;
  fuelTypes: string[];
  transmissions: string[];
  /** Kategori/marka numaraları ("zaten kayıtlı mı" karşılaştırması için; veritabanı satırında zaten var). */
  categoryId?: number | null;
  brandId?: number | null;
  createdAt?: string | Date;
}

export const PAYMENT_LABEL: Record<string, string> = {
  SWAP_ONLY: "Sadece takas",
  PAYS_EXTRA: "Üstüne para verir",
  WANTS_EXTRA: "Üstüne para bekliyor",
};

// Kayıtlı bir aramaya tıklayınca aynı filtrelerle /takas'a dönmek için (kayıtlı aramalar eskiden yalnız silinebiliyordu).
export function searchHref(s: SavedSearchRow): string {
  const qs = new URLSearchParams();
  qs.set("il", s.city);
  if (s.category) qs.set("kategori", s.category.slug);
  if (s.brand) qs.set("marka", s.brand.slug);
  if (s.paymentIntent) qs.set("odeme", s.paymentIntent);
  if (s.yearMin != null) qs.set("yilMin", String(s.yearMin));
  if (s.yearMax != null) qs.set("yilMax", String(s.yearMax));
  if (s.kmMin != null) qs.set("kmMin", String(s.kmMin));
  if (s.kmMax != null) qs.set("kmMax", String(s.kmMax));
  if (s.fuelTypes.length === 1) qs.set("yakit", s.fuelTypes[0]);
  if (s.transmissions.length === 1) qs.set("vites", s.transmissions[0]);
  return `/takas?${qs.toString()}`;
}

/** Aramanın parçaları (il, kategori, marka, ödeme, yıl, km, yakıt, vites) — liste sayfasında çip olarak da kullanılır. */
export function searchParcalari(s: SavedSearchRow): string[] {
  const parts = [s.city];
  if (s.category) parts.push(s.category.name);
  if (s.brand) parts.push(s.brand.name);
  if (s.paymentIntent) parts.push(PAYMENT_LABEL[s.paymentIntent] ?? s.paymentIntent);
  if (s.yearMin != null || s.yearMax != null) parts.push(formatRange(s.yearMin, s.yearMax, (n) => String(n)));
  if (s.kmMin != null || s.kmMax != null) {
    parts.push(`${formatRange(s.kmMin, s.kmMax, (n) => n.toLocaleString("tr-TR"))} km`);
  }
  if (s.fuelTypes.length > 0) parts.push(s.fuelTypes.map((f) => FUEL_LABELS[f] ?? f).join("/"));
  if (s.transmissions.length > 0) parts.push(s.transmissions.join("/"));
  return parts;
}

export function searchSummary(s: SavedSearchRow): string {
  return searchParcalari(s).join(" · ");
}

/** Kaydedilmek istenen arama (formdaki/adresteki filtreler). */
export interface AramaAdayi {
  city: string;
  categoryId: number | null;
  brandId: number | null;
  paymentIntent: string | null;
  yearMin: number | null;
  yearMax: number | null;
  kmMin: number | null;
  kmMax: number | null;
  fuelTypes: string[];
  transmissions: string[];
}

/**
 * Aday arama zaten kayıtlı mı? Sunucunun tekilleştirmede kullandığı kriter anahtarıyla (buildSavedSearchCriteriaKey) aynı
 * karşılaştırma: böylece kayıtlı bir aramaya bağlantıyla gelen kullanıcıya "Bu aramayı kaydet" düğmesi gösterilip tıklayınca
 * "zaten kayıtlı" hatası verilmez; durum önceden bilinir.
 */
export function aramaKayitliMi(kayitlilar: SavedSearchRow[], aday: AramaAdayi): boolean {
  const anahtar = buildSavedSearchCriteriaKey(aday);
  return kayitlilar.some((s) =>
    buildSavedSearchCriteriaKey({
      city: s.city,
      categoryId: s.categoryId ?? null,
      brandId: s.brandId ?? null,
      paymentIntent: s.paymentIntent ?? null,
      yearMin: s.yearMin, yearMax: s.yearMax, kmMin: s.kmMin, kmMax: s.kmMax,
      fuelTypes: s.fuelTypes, transmissions: s.transmissions,
    }) === anahtar,
  );
}

/** Bir ilan birden çok aramaya uyabilir: kullanıcı başına TEK bildirim (aynı ilan için üç bildirim yağmasın). */
export function kullaniciyaGoreGrupla<T extends { userId: number }>(rows: T[]): Map<number, T[]> {
  const out = new Map<number, T[]>();
  for (const r of rows) {
    const list = out.get(r.userId);
    if (list) list.push(r);
    else out.set(r.userId, [r]);
  }
  return out;
}

/** Eşleşme bildirimi: hangi aramaya uyduğunu söyler (önceden yalnız "kayıtlı aramanızla eşleşen yeni ilan var" yazıyordu). */
export function savedSearchBildirimMesaji(args: { aramalar: SavedSearchRow[]; aracAdi: string; city: string }): string {
  const { aramalar, aracAdi, city } = args;
  if (aramalar.length === 1) {
    return `Kayıtlı aramanıza (${searchSummary(aramalar[0])}) uyan yeni bir takas ilanı var: ${aracAdi}`;
  }
  return `${aramalar.length} kayıtlı aramanıza uyan yeni bir takas ilanı var: ${aracAdi} · ${city}`;
}
