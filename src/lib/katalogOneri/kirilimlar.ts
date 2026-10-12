// Aylık "yeni araç adayı" kırılımları. Rapor ve admin "Önerilenler" ekranı aynı tanımı kullanır.
// Katalogda 6 kategori var; elektrikli motosiklet (motosiklet + yakıt EV), pick-up/van (kamyonet + gövde)
// ve çekme/motorlu karavan (karavan_type) ayrı KIRILIM olarak izlenir ama eklenirken ilgili kategoriye düşer.

export const KIRILIM_ANAHTARLARI = [
  "otomobil", "motosiklet", "elektrikli-motosiklet", "e-scooter", "e-bisiklet",
  "motorlu-karavan", "cekme-karavan", "pickup", "van",
] as const;
export type KirilimAnahtari = (typeof KIRILIM_ANAHTARLARI)[number];

export interface Kirilim {
  key: KirilimAnahtari;
  etiket: string;
  /** Katalog kategorisi (Category.slug) — "var mı" kontrolü ve ekleme formu için. */
  kategori: "otomobil" | "motosiklet" | "e-scooter" | "e-bisiklet" | "karavan" | "kamyonet";
  /** Ekleme formunu bu kırılıma göre ön dolduran yakıt (yalnız elektrikli motosiklet). */
  yakit?: "EV";
  /** Gemini'ye verilen kapsam tanımı. */
  tanim: string;
  /** Yalnız A kademesi (resmî marka sayfası) kabul edilir: Türkiye'ye gelmeyen ürün çok. */
  sadeceResmi: boolean;
  /** {yil} ve {ay} yer tutucuları doldurulur. */
  sorgular: string[];
}

export const KIRILIMLAR: readonly Kirilim[] = [
  {
    key: "otomobil", etiket: "Otomobil", kategori: "otomobil", sadeceResmi: false,
    tanim: "binek otomobil (hatchback, sedan, SUV, crossover, station wagon; elektrikli/hibrit dahil)",
    sorgular: [
      "Türkiye'de satışa çıkan yeni otomobil modelleri {ay} {yil}",
      "Türkiye lansman yeni model otomobil yetkili satıcı fiyat listesi {yil}",
    ],
  },
  {
    key: "motosiklet", etiket: "Motosiklet", kategori: "motosiklet", sadeceResmi: false,
    tanim: "benzinli motosiklet ve scooter (elektrikli olanlar HARİÇ)",
    sorgular: [
      "Türkiye'de satışa sunulan yeni motosiklet modelleri {ay} {yil}",
      "Türkiye lansman yeni motosiklet fiyatı {yil}",
    ],
  },
  {
    key: "elektrikli-motosiklet", etiket: "Elektrikli motosiklet", kategori: "motosiklet", yakit: "EV", sadeceResmi: true,
    tanim: "elektrikli motosiklet ve elektrikli motor-scooter (plakalı, ehliyet gerektiren)",
    sorgular: [
      "Türkiye'de satışa çıkan elektrikli motosiklet yeni model {yil}",
      "elektrikli motosiklet Türkiye lansman yetkili bayi {yil}",
    ],
  },
  {
    key: "e-scooter", etiket: "E-scooter", kategori: "e-scooter", sadeceResmi: true,
    tanim: "elektrikli scooter (ayakta binilen, katlanabilir kick-scooter)",
    sorgular: [
      "Türkiye'de satışa çıkan yeni elektrikli scooter modeli {yil}",
      "elektrikli scooter Türkiye lansman yeni model fiyat {yil}",
    ],
  },
  {
    key: "e-bisiklet", etiket: "E-bisiklet", kategori: "e-bisiklet", sadeceResmi: true,
    tanim: "elektrikli bisiklet (pedelec; şehir, dağ, katlanır, kargo)",
    sorgular: [
      "Türkiye'de satışa çıkan yeni elektrikli bisiklet modeli {yil}",
      "e-bisiklet Türkiye lansman yeni model distribütör {yil}",
    ],
  },
  {
    key: "motorlu-karavan", etiket: "Motorlu karavan", kategori: "karavan", sadeceResmi: false,
    tanim: "motorlu karavan ve kamper van (kendi motoru olan, yaşanabilir araç)",
    sorgular: [
      "Türkiye'de satışa çıkan yeni motokaravan kamper van modeli {yil}",
      "motokaravan Türkiye yeni model satış {yil}",
    ],
  },
  {
    key: "cekme-karavan", etiket: "Çekme karavan", kategori: "karavan", sadeceResmi: false,
    tanim: "çekme karavan (araca bağlanarak çekilen, kendi motoru olmayan)",
    sorgular: [
      "Türkiye'de satışa çıkan yeni çekme karavan modeli {yil}",
      "çekme karavan Türkiye yeni model satış fiyat {yil}",
    ],
  },
  {
    key: "pickup", etiket: "Pick-up", kategori: "kamyonet", sadeceResmi: false,
    tanim: "pick-up (açık kasalı kamyonet; çift/tek kabin)",
    sorgular: [
      "Türkiye'de satışa çıkan yeni pick-up modelleri {ay} {yil}",
      "Türkiye lansman yeni pickup kamyonet fiyat {yil}",
    ],
  },
  {
    key: "van", etiket: "Van", kategori: "kamyonet", sadeceResmi: false,
    tanim: "ticari van, panelvan, camlı van, minivan ve minibüs (pick-up HARİÇ)",
    sorgular: [
      "Türkiye'de satışa çıkan yeni hafif ticari van panelvan modelleri {ay} {yil}",
      "Türkiye lansman yeni ticari van minivan fiyat {yil}",
    ],
  },
];

export const kirilimBul = (key: string): Kirilim | undefined => KIRILIMLAR.find((k) => k.key === key);

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** "2026-11" → { ay: "Kasım", yil: 2026 } */
export function ayParcala(ay: string): { ay: string; yil: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(ay);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) throw new Error(`Geçersiz ay: ${ay}`);
  return { ay: AYLAR[Number(m[2]) - 1], yil: Number(m[1]) };
}

export const sorguHazirla = (k: Kirilim, ay: string): string[] => {
  const p = ayParcala(ay);
  return k.sorgular.map((s) => s.replace("{ay}", p.ay).replace("{yil}", String(p.yil)));
};

/** Kırılımdan eklenen araca yazılan tür alanı (pick-up/van gövde filtreleri, karavan tipi). Diğerleri için boş. */
export function kirilimOzellikleri(key: KirilimAnahtari): Record<string, string> {
  switch (key) {
    case "pickup": return { body_type: "pickup" };
    case "van": return { body_type: "van" };
    case "motorlu-karavan": return { karavan_type: "motorlu" };
    case "cekme-karavan": return { karavan_type: "cekme" };
    default: return {};
  }
}
