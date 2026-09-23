// Araç Öner'in otomobil/kamyonet kataloğu (public/katalog/<kategori>/<marka>.json).
// Üreten: scripts/vehicle-data/tsb/katalog.ts — TSB Kasko Değer Listesi (2012+)
// + eski el yapımı katalogdaki nesiller (2012 öncesi ve nesil adları).
//
// Her "tip" gerçekte satılmış bir kombinasyondur (TSB satırı). Form seçimleri
// tipleri adım adım süzer; böylece var olmayan bir kombinasyon seçilemez.

export type KatalogKategori = "otomobil" | "kamyonet";

export type KatalogYakit = "GASOLINE" | "DIESEL" | "HYBRID" | "PHEV" | "EV" | "LPG";
/** Araç Öner'in vites seçenekleriyle aynı değerler. */
export type KatalogVites = "Manuel" | "Otomatik" | "CVT" | "Yarı Otomatik";

export interface KatalogTip {
  /** Versiyon: motor (+ çekiş) — "1.6 E-Torq", "320d 2.0 xDrive". Boş olabilir. */
  v: string;
  /** Beygir gücü, kaynakta yazmıyorsa null. */
  hp: number | null;
  /** Donanım paketi; kaynakta yoksa null. */
  p: string | null;
  /** Kasa/yapılandırma ("Sedan", "Van · L2"); yoksa null. */
  k: string | null;
  /** Satıldığı model yılları. */
  y: number[];
  /** Kaynak kesin söylüyorsa yakıt; değilse null → kullanıcıya sorulur. */
  f: KatalogYakit | null;
  /** Kaynak kesin söylüyorsa vites; değilse null → kullanıcıya sorulur. */
  t: KatalogVites | null;
}

/** Eski katalogdan gelen nesil: DB model adı (ör. "Clio 5 (2019-)") ve 2012 öncesi seçenekler. */
export interface KatalogNesil {
  ad: string;
  bas: number;
  /** Açık uçlu nesilde null ("2019-"). */
  bit: number | null;
  /**
   * 2012 öncesi yıllar için el yapımı seçenekler (TSB 2012'den başlıyor).
   * Yalnızca nesil 2012'den önce başlıyorsa dolu.
   */
  el?: { versiyonlar: string[]; paketler: string[]; paketlerVersiyona?: Record<string, string[]> };
}

export interface KatalogModel {
  ad: string;
  nesiller: KatalogNesil[];
  tipler: KatalogTip[];
}

export interface KatalogMarkaDosyasi {
  marka: string;
  kategori: KatalogKategori;
  /** Kaynak listesinin adı ("Eylül 2026"). */
  kaynak: string;
  modeller: KatalogModel[];
}

/** src/data/katalogIndex.json — marka listesi ve dosya yolları (form ilk açılışta bunu okur). */
export type KatalogIndex = Record<KatalogKategori, { marka: string; dosya: string; modeller: string[] }[]>;
