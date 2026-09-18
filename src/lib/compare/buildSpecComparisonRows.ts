// /karsilastir'in spec tablosu için: her ürünün kategoriye özel spec listesini
// (buildSpecList — /araclar ve /takas ile paylaşılan TEK KAYNAK) üretip, aynı
// label'ları satır olarak birleştiren pivot. Ayrı bir "specSchema" tanımlamak
// yerine mevcut buildSpecList reuse ediliyor — kategori bazlı alan mantığı zaten
// orada, iki yerde bakımı gerektiren bir kopya oluşturmamak için.
import { buildSpecList } from "@/lib/buildSpecList";

export interface SpecComparisonRow {
  label: string;
  values: (string | null)[];
  // "Daha çoğu/azı daha iyi" anlamı net olan, dar bir alan kümesi için hesaplanıyor.
  // Ağırlık, yakıt deposu, motor hacmi gibi yönü belirsiz alanlarda vurgu YAPILMIYOR
  // — yanlış yöne vurgu yapmak (örn. en ağır aracı "en iyi" göstermek) susmaktan kötü.
  bestIndices: number[];
  // "numeric" = yönü belli (bestIndices anlamlı olabilir), "categorical" = yön yok
  // (metin değeri VEYA yönü belirsiz sayısal alan — örn. ağırlık, motor hacmi).
  // UI bu ayrıma göre iki farklı vurgu sistemi kullanıyor: numeric'te yeşil "en iyi"
  // tiki, categorical'da (sadece değerler gerçekten farklıysa) nötr amber "fark var"
  // rozeti — ikisi kasıtlı olarak farklı renk+ikon, kullanıcı "kazanan" ile "sadece
  // farklı" durumunu karıştırmasın diye (bkz. kullanıcı geri bildirimi: Hibrit vs
  // Plug-in Hibrit farkı fark edilmiyordu).
  kind: "numeric" | "categorical";
  hasDifference: boolean;
  // Amber "farklı" rozetinin uygulanacağı hücre index'leri. Satırda 3+ araç varsa
  // TÜM farklı hücreleri değil, sadece ÇOĞUNLUKTAN SAPAN değerleri işaretler —
  // örn. 3 araç "Hatchback", 1 araç "SUV" ise sadece SUV işaretlenir, 3 Hatchback
  // birbirinden farklı değil ki hepsi amber olsun (canlıda bulunan gerçek hata,
  // 4 araçlı karşılaştırmada tüm hücreleri amber'e boyuyordu).
  differentIndices: number[];
}

const HIGHER_IS_BETTER = new Set([
  "Güç", "Tork", "Menzil", "Batarya", "Bagaj", "Yatak Kap.", "Yük Kap.",
  "Çekme Kap.", "Çekme Ağ.", "Azami Hız", "Maks. Hız", "Maks. Yük",
  "Taze Su Tankı", "Gri/Pis Su Tankı",
]);
const LOWER_IS_BETTER = new Set(["0–100 km/s", "Şarj Süresi"]);

function parseLeadingNumber(value: string): number | null {
  const m = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

// Net bir çoğunluk değeri varsa (örn. 3 "Hatchback" + 1 "SUV") sadece azınlıktaki
// (çoğunluktan sapan) hücreler işaretlenir. En sık geçen değerde EŞİTLİK varsa
// (örn. 2 "B Segment" + 2 "C Segment", net bir "normal" yok) tüm dolu hücreler
// işaretlenir — 2 araçlı karşılaştırmada (her zaman 1'e 1 eşitlik) bu, önceki
// davranışla birebir aynı sonucu verir.
function computeDifferentIndices(values: (string | null)[]): number[] {
  const freq = new Map<string, number>();
  values.forEach((v) => {
    if (v !== null) freq.set(v, (freq.get(v) ?? 0) + 1);
  });
  if (freq.size <= 1) return [];

  const maxFreq = Math.max(...freq.values());
  const modes = [...freq.entries()].filter(([, f]) => f === maxFreq);

  if (modes.length === 1) {
    const majorityValue = modes[0][0];
    return values.flatMap((v, i) => (v !== null && v !== majorityValue ? [i] : []));
  }
  return values.flatMap((v, i) => (v !== null ? [i] : []));
}

export function buildSpecComparisonRows(categorySlug: string, attributesList: unknown[]): SpecComparisonRow[] {
  const perProduct = attributesList.map((attrs) => buildSpecList(categorySlug, attrs));

  const labelOrder: string[] = [];
  const seen = new Set<string>();
  for (const list of perProduct) {
    for (const item of list) {
      if (!seen.has(item.label)) {
        seen.add(item.label);
        labelOrder.push(item.label);
      }
    }
  }

  return labelOrder.map((label) => {
    const values = perProduct.map((list) => list.find((i) => i.label === label)?.value ?? null);

    let bestIndices: number[] = [];
    const direction = HIGHER_IS_BETTER.has(label) ? "higher" : LOWER_IS_BETTER.has(label) ? "lower" : null;
    if (direction) {
      const nums = values.map((v) => (v ? parseLeadingNumber(v) : null));
      const present = nums.filter((n): n is number => n !== null);
      if (present.length >= 2) {
        const target = direction === "higher" ? Math.max(...present) : Math.min(...present);
        const isTie = present.filter((n) => n === target).length > 1;
        if (!isTie) {
          bestIndices = nums.flatMap((n, i) => (n === target ? [i] : []));
        }
      }
    }

    const kind: "numeric" | "categorical" = direction ? "numeric" : "categorical";
    const differentIndices = computeDifferentIndices(values);
    const hasDifference = differentIndices.length > 0;

    return { label, values, bestIndices, kind, hasDifference, differentIndices };
  });
}
