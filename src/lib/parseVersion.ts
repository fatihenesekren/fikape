// Araç Öner katalogundaki (src/data/vehicles.json) versiyon metinlerini
// parçalarına ayırır. Kürate edilmiş liste seçim kolaylığı için beygir gücünü
// ve EV batarya/güç rakamlarını metne gömüyor ("1.4 Boosterjet 129 AWD",
// "Extended Range 204 72.8kWh") — dropdown'da bunlar okunaklı gösterilmeli,
// ama ürünün kalıcı adına (trimName) sızmamalı; güç ayrıca power_hp'ye gider.

export type ParsedVersion = {
  /** HP çıkarılmış versiyon metni ("1.4 Boosterjet AWD"). */
  base: string;
  /** Otomobil/kamyonet için tespit edilen beygir gücü, yoksa null. */
  hp: number | null;
};

// Beygir gücünün hemen ardından gelebilen, gücün kendisini belirten birim
// ("Elektrik 155 CV") — HP ile birlikte düşer.
const HP_UNIT = /^(cv|hp|ps|bg)$/i;
// Sayının ardından bu birimler geliyorsa sayı beygir gücü değildir.
const NON_HP_UNIT = /^(km|kw|kwh|v|ah|wh|cc|nm|kg|koltuk|kapı)$/i;

// Audi/AMG model kodları ("Sportback 50 quattro", "AMG C 63 S", "AMG GT 55
// 4MATIC+") çıplak sayı + çekiş/performans eki şeklinde geliyor; 100'ün
// altındaki bir sayının ardından bunlardan biri geliyorsa HP değil, koddur.
const MODEL_CODE_SUFFIX = /^(quattro|4matic\+?|4motion|xdrive|s)$/i;

const HP_MIN = 40;
const HP_MAX = 2000;

/**
 * Otomobil/kamyonet versiyonundaki beygir gücünü bulur: metindeki SON çıplak
 * 2-4 haneli sayı (konumu fark etmez — "1.4 Boosterjet 129 AWD" ortada,
 * "1.4 T-Jet 135" sonda). İlk token hiçbir zaman HP sayılmaz ("595
 * Competizione" model kodu). Diğer kategorilerde aynı konumdaki sayı model/
 * uzunluk kodu ("Atlas 24") veya motor hacmi ("V-Strom 1000") olabildiği için
 * dokunulmaz.
 */
export function parseVersion(version: string, categorySlug: string): ParsedVersion {
  const text = version.replace(/\s+/g, " ").trim();
  if (categorySlug !== "otomobil" && categorySlug !== "kamyonet") {
    return { base: text, hp: null };
  }

  const tokens = text.split(" ");
  let idx = -1;
  for (let i = tokens.length - 1; i > 0; i--) {
    if (/^\d{2,4}$/.test(tokens[i])) { idx = i; break; }
  }
  if (idx === -1) return { base: text, hp: null };

  const hp = Number(tokens[idx]);
  const next = tokens[idx + 1];
  if (
    hp < HP_MIN || hp > HP_MAX ||
    (next && NON_HP_UNIT.test(next)) ||
    (hp < 100 && next && MODEL_CODE_SUFFIX.test(next)) ||
    // "AMG A 45", "AMG G 63" — AMG'den sonraki sınıf harfini izleyen sayı koddur.
    (hp < 100 && tokens[idx - 2] === "AMG")
  ) {
    return { base: text, hp: null };
  }

  const drop = next && HP_UNIT.test(next) ? 2 : 1;
  const base = [...tokens.slice(0, idx), ...tokens.slice(idx + drop)].join(" ");
  return { base, hp };
}

/**
 * Dropdown etiketi: "1.4 Boosterjet AWD(4x4) · 129 HP". Sadece GÖRÜNÜMDE —
 * option value, form state ve trimsByVersion eşleşmeleri orijinal string kalır.
 */
export function formatVersionLabel(version: string, categorySlug: string): string {
  const { base, hp } = parseVersion(version, categorySlug);
  const label = base
    .replace(/\bRWD\b/g, "RWD(4x2)")
    .replace(/\bAWD\b/g, "AWD(4x4)");
  return hp ? `${label} · ${hp} HP` : label;
}

/**
 * Ürünün kalıcı adına (trimName) girecek versiyon metni: HP'ye ek olarak EV/
 * e-mobilite rakamları (kW/kWh/V/Ah/Wh/km) da temizlenir — bunlar ayrı
 * attributes alanlarında tutuluyor. Otomobil yakıt motorlarının "cc"/"16V"
 * gibi değerlerine dokunulmaz, o gerçek versiyon kimliği.
 */
export function versionForTrimName(version: string, categorySlug: string): string {
  const isMotorluTasit = categorySlug === "otomobil" || categorySlug === "kamyonet";
  return parseVersion(version, categorySlug).base
    .replace(/(?:^|\s)\d+(\.\d+)?\s*(kw)?\s+\d+(\.\d+)?\s*kwh\b/i, "")
    .replace(/\d+(\.\d+)?\s*(kwh|ah)\b/gi, "")
    // "kW" her kategoride temizlenir, ama "V"/"W" tek başına SADECE otomobil/
    // kamyonet DIŞINDA — otomobilde "V" supap sayısı olabilir ("1.4 16V").
    .replace(isMotorluTasit ? /\d+(\.\d+)?\s*kw\b/gi : /\d+(\.\d+)?\s*(kw|wh|w|v)\b/gi, "")
    .replace(/\d+(\.\d+)?\s*km(\/h|\/s|\s*menzil)?\b/gi, "")
    .replace(/(?<=^|\s)Çift\s+(Motor|Batarya|Bat\.)(?=\s|$)/giu, "")
    .replace(/(?<=^|\s)Çift(?=\s|$)/giu, "")
    .replace(/(?<=^|\s)\+(?=\s|$)/g, "")
    .replace(/\bElektrik(li)?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
