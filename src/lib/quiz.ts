import type { FikapeScores } from "./fikape";

export type QuizCat =
  | "oto"
  | "moto"
  | "scooter"
  | "karavan"
  | "kamyon"
  | "hepsi";

export interface QuizAnswers {
  cat: QuizCat;
  q2: string;
  q3: string;
  q4: string;
}

export interface QuizOption {
  key: string;
  label: string;
  icon: string;
  sub?: string;
}

export interface QuizStepDef {
  question: string;
  stepLabel: string;
  opts: QuizOption[];
}

export const CAT_TO_SLUG: Record<QuizCat, string | undefined> = {
  oto:     "otomobil",
  moto:    "motosiklet",
  scooter: "e-scooter",
  karavan: "karavan",
  kamyon:  "kamyonet",
  hepsi:   undefined,
};

export const SLUG_TO_CAT: Record<string, QuizCat> = {
  otomobil:    "oto",
  motosiklet:  "moto",
  "e-scooter": "scooter",
  karavan:     "karavan",
  kamyonet:    "kamyon",
};

export const CAT_LABELS: Record<QuizCat, string> = {
  oto:     "🚗 Otomobil",
  moto:    "🏍️ Motosiklet",
  scooter: "⚡ E-Scooter",
  karavan: "🏕️ Karavan",
  kamyon:  "🛻 Kamyonet",
  hepsi:   "🔍 Tümü",
};

export const ALL_CATS: { key: QuizCat; icon: string; label: string }[] = [
  { key: "oto",     icon: "🚗", label: "Otomobil" },
  { key: "moto",    icon: "🏍️", label: "Motosiklet" },
  { key: "scooter", icon: "⚡",  label: "E-Scooter" },
  { key: "karavan", icon: "🏕️", label: "Karavan" },
  { key: "kamyon",  icon: "🛻", label: "Kamyonet" },
  { key: "hepsi",   icon: "🤷", label: "Bilmiyorum" },
];

export const QUIZ_STEPS: Record<QuizCat, QuizStepDef[]> = {
  oto: [
    {
      question: "Aracını ağırlıklı nerede kullanacaksın?",
      stepLabel: "Kullanım",
      opts: [
        { key: "sehir", icon: "🏙️", label: "Şehir içi",  sub: "Trafik, kısa mesafe" },
        { key: "yol",   icon: "🛣️", label: "Uzun yol",    sub: "Otoyol, konfor" },
        { key: "karma", icon: "↔️",  label: "Karma",       sub: "İkisi de" },
        { key: "zorlu", icon: "🏔️", label: "Zorlu",       sub: "Kış, arazi" },
      ],
    },
    {
      question: "Seni en çok ne endişelendiriyor?",
      stepLabel: "Öncelik",
      opts: [
        { key: "bakim", icon: "🔧", label: "Bakım maliyeti", sub: "Servis, parça" },
        { key: "yakit", icon: "⛽", label: "Yakıt tüketimi", sub: "Gerçek mi?" },
        { key: "guven", icon: "🛡️", label: "Güvenilirlik",  sub: "Uzun vade" },
        { key: "keyif", icon: "🏎️", label: "Sürüş keyfi",   sub: "Performans" },
      ],
    },
    {
      question: "Yakıt tercihin var mı?",
      stepLabel: "Yakıt",
      opts: [
        { key: "benzin",   icon: "⛽", label: "Benzin / LPG", sub: "" },
        { key: "dizel",    icon: "🛢️", label: "Dizel",        sub: "Uzun yol ekonomisi" },
        { key: "hibrit",   icon: "🔋", label: "Hibrit",       sub: "Düşük tüketim" },
        { key: "elektrik", icon: "⚡", label: "Elektrikli",   sub: "Sıfır emisyon" },
        { key: "fark",     icon: "—",  label: "Farketmez",    sub: "" },
      ],
    },
  ],
  moto: [
    {
      question: "Motosikleti nasıl kullanacaksın?",
      stepLabel: "Kullanım",
      opts: [
        { key: "sehir",   icon: "🏙️", label: "Şehir içi", sub: "Komüt, trafik" },
        { key: "tur",     icon: "🛣️", label: "Tur / Yol", sub: "Uzun mesafe" },
        { key: "offroad", icon: "🏔️", label: "Off-road",  sub: "Arazi, enduro" },
        { key: "karma",   icon: "↔️",  label: "Karma",     sub: "Her ikisi de" },
      ],
    },
    {
      question: "Motor hacmi tercihin?",
      stepLabel: "Motor",
      opts: [
        { key: "kucuk", icon: "🐣", label: "125–250 cc", sub: "Başlangıç, şehir" },
        { key: "orta",  icon: "💪", label: "400–600 cc", sub: "Orta güç" },
        { key: "buyuk", icon: "🔥", label: "600 cc+",    sub: "Yüksek performans" },
        { key: "fark",  icon: "—",  label: "Farketmez",  sub: "" },
      ],
    },
    {
      question: "Nasıl bir tarz arıyorsun?",
      stepLabel: "Tip",
      opts: [
        { key: "naked",   icon: "🏍️", label: "Naked / Klasik", sub: "Şehir, günlük" },
        { key: "sport",   icon: "🏁", label: "Sport",           sub: "Hız, viraj" },
        { key: "scooter", icon: "🛵", label: "Scooter",         sub: "Pratik, komüt" },
        { key: "tur",     icon: "🧭", label: "Adventure / Tur", sub: "Uzun yol, arazi" },
        { key: "fark",    icon: "—",  label: "Farketmez",       sub: "" },
      ],
    },
  ],
  scooter: [
    {
      question: "Günlük ortalama mesafin ne kadar?",
      stepLabel: "Mesafe",
      opts: [
        { key: "kisa",       icon: "📍", label: "5–15 km",   sub: "Kısa mesafe" },
        { key: "orta",       icon: "📍", label: "15–30 km",  sub: "Orta mesafe" },
        { key: "uzun",       icon: "📍", label: "30 km+",    sub: "Uzun mesafe" },
        { key: "bilmiyorum", icon: "❓", label: "Bilmiyorum", sub: "" },
      ],
    },
    {
      question: "Evde şarj imkanın var mı?",
      stepLabel: "Şarj",
      opts: [
        { key: "rahat", icon: "🏠", label: "Evet, rahatça", sub: "Priz ulaşıyor" },
        { key: "bazen", icon: "🤔", label: "Bazen",          sub: "Kısıtlı imkan" },
        { key: "zor",   icon: "😰", label: "Çok kısıtlı",   sub: "Yok gibi" },
      ],
    },
    {
      question: "Motor gücü beklentin?",
      stepLabel: "Güç",
      opts: [
        { key: "eco",   icon: "🍃", label: "350W'a kadar", sub: "Hafif, düz yol" },
        { key: "orta",  icon: "💪", label: "350–500W",     sub: "Dengeli" },
        { key: "guclu", icon: "🔥", label: "500W+",        sub: "Yokuş, performans" },
        { key: "fark",  icon: "—",  label: "Farketmez",    sub: "" },
      ],
    },
  ],
  karavan: [
    {
      question: "Kaç kişilik kullanacaksın?",
      stepLabel: "Kapasite",
      opts: [
        { key: "iki",  icon: "👫",    label: "2 kişi",   sub: "Çift" },
        { key: "dort", icon: "👨‍👩‍👧",  label: "3–4 kişi", sub: "Küçük aile" },
        { key: "alti", icon: "👨‍👩‍👧‍👦", label: "5–6 kişi", sub: "Büyük aile" },
      ],
    },
    {
      question: "Banyo ve mutfak şart mı?",
      stepLabel: "Konfor",
      opts: [
        { key: "tamkonfor", icon: "🛁", label: "Tam konfor",  sub: "Banyo + mutfak şart" },
        { key: "temel",     icon: "🍳", label: "Temel yeter", sub: "Mutfak yeterli" },
        { key: "minimal",   icon: "🏕️", label: "Minimal",    sub: "Sadece uyku" },
      ],
    },
    {
      question: "Nasıl bir karavan?",
      stepLabel: "Tip",
      opts: [
        { key: "cekme",   icon: "🚙", label: "Çekme",      sub: "Araçla çekilir" },
        { key: "motorlu", icon: "🚐", label: "Motorlu",    sub: "Kendi motoru var" },
        { key: "kamper",  icon: "🚌", label: "Kamper-Van", sub: "Van dönüşüm" },
        { key: "fark",    icon: "—",  label: "Farketmez",  sub: "" },
      ],
    },
  ],
  kamyon: [
    {
      question: "Kamyoneti ne amaçla kullanacaksın?",
      stepLabel: "Amaç",
      opts: [
        { key: "is",     icon: "🔨", label: "İş / Yük",  sub: "Taşıma, saha" },
        { key: "aile",   icon: "👨‍👩‍👧", label: "Aile + iş", sub: "Çift kullanım" },
        { key: "macera", icon: "🏕️", label: "Macera",    sub: "Off-road, kamp" },
        { key: "karma",  icon: "↔️",  label: "Karma",     sub: "Hepsi biraz" },
      ],
    },
    {
      question: "Yük kapasitesi önemli mi?",
      stepLabel: "Kapasite",
      opts: [
        { key: "hafif", icon: "📦", label: "Hafif < 1t", sub: "Küçük yük" },
        { key: "orta",  icon: "📦", label: "Orta 1–2t",  sub: "Orta yük" },
        { key: "agir",  icon: "📦", label: "Ağır 2t+",   sub: "Ağır yük" },
        { key: "fark",  icon: "—",  label: "Farketmez",  sub: "" },
      ],
    },
    {
      question: "4x4 çekiş şart mı?",
      stepLabel: "Çekiş",
      opts: [
        { key: "dortcarpi", icon: "🏔️", label: "4x4 şart",   sub: "Arazi, zorlu koşul" },
        { key: "fark",      icon: "🛣️", label: "Şart değil", sub: "Asfalt ağırlıklı" },
      ],
    },
  ],
  hepsi: [
    {
      question: "Öncelikli kullanım şeklin?",
      stepLabel: "Kullanım",
      opts: [
        { key: "sehir",  icon: "🏙️", label: "Şehir içi",  sub: "Günlük komüt" },
        { key: "yol",    icon: "🛣️", label: "Uzun yol",    sub: "Seyahat, yol" },
        { key: "is",     icon: "💼", label: "İş amaçlı",  sub: "Yük, taşıma" },
        { key: "macera", icon: "🏕️", label: "Macera",     sub: "Off-road, kamp" },
      ],
    },
    {
      question: "Kaç kişilik bir araç?",
      stepLabel: "Kişi sayısı",
      opts: [
        { key: "bir_iki",  icon: "👤",    label: "1–2 kişilik", sub: "Tek veya çift" },
        { key: "dort",     icon: "👨‍👩‍👧",  label: "3–4 kişilik", sub: "Küçük aile" },
        { key: "bes_alti", icon: "👨‍👩‍👧‍👦", label: "5+ kişilik",  sub: "Büyük aile" },
      ],
    },
    {
      question: "Enerji tercihin?",
      stepLabel: "Enerji",
      opts: [
        { key: "elektrik", icon: "⚡", label: "Elektrikli",       sub: "Şarjlı" },
        { key: "yakitli",  icon: "⛽", label: "Benzinli / Dizel", sub: "" },
        { key: "fark",     icon: "—",  label: "Farketmez",        sub: "" },
      ],
    },
  ],
};

// ─── URL encode / decode ───────────────────────

export function encodeQuiz(answers: QuizAnswers): string {
  return `${answers.cat},${answers.q2},${answers.q3},${answers.q4}`;
}

export function decodeQuiz(param: string): QuizAnswers | null {
  const parts = param.split(",");
  if (parts.length < 3) return null;
  const [cat, q2, q3, q4] = parts;
  const valid: QuizCat[] = ["oto", "moto", "scooter", "karavan", "kamyon", "hepsi"];
  if (!valid.includes(cat as QuizCat)) return null;
  if (!q2 || !q3) return null;
  // Eski (3 parçalı) paylaşılan URL'ler kırılmasın — q4 yoksa "farketmez" varsayılır
  return { cat: cat as QuizCat, q2, q3, q4: q4 || "fark" };
}

// ─── Scoring ──────────────────────────────────

export interface ReviewExtData {
  usage_type?:       string;
  maintenance_cost?: string;
  home_charging?:    boolean;
  ev_range?:         string;
}

export interface QuizScoreResult {
  score:       number;
  matchCount:  number;
  isRealMatch: boolean;
}

const USAGE_MAP: Record<string, string> = {
  sehir:   "city",
  yol:     "highway",
  karma:   "mixed",
  zorlu:   "mixed",
  tur:     "highway",
  offroad: "mixed",
  is:      "mixed",
  aile:    "mixed",
  macera:  "mixed",
};

const LOW_MAINTENANCE = new Set(["affordable", "okay"]);

// Motosiklet "Motor hacmi" sorusu — sert filtre (attributes.engine_cc'ye uygulanır).
// "fark" (farketmez) filtre koymaz, elektrikli motosikletler (engine_cc yok) dahil kalır.
export const MOTO_CC_RANGES: Record<string, { min: number; max: number } | null> = {
  kucuk: { min: 125, max: 250 },
  orta:  { min: 400, max: 600 },
  buyuk: { min: 600, max: Infinity },
  fark:  null,
};

// ── 4. soru sert filtreleri ───────────────────────────
// Her kategorinin 4. sorusu gerçek bir attributes alanına bağlanır — MOTO_CC_RANGES ile
// aynı ilke: "fark" filtre koymaz, somut seçim aralık/liste dışını sonuçtan çıkarır.

export const OTO_FUEL_MAP: Record<string, string[] | null> = {
  benzin:   ["GASOLINE", "LPG"],
  dizel:    ["DIESEL"],
  hibrit:   ["HYBRID", "PHEV"],
  elektrik: ["EV"],
  fark:     null,
};

export const MOTO_TYPE_MAP: Record<string, string[] | null> = {
  naked:   ["naked", "retro", "cruiser"],
  sport:   ["sport"],
  scooter: ["scooter"],
  tur:     ["adventure", "touring", "enduro", "cross"],
  fark:    null,
};

export const SCOOTER_WATT_RANGES: Record<string, { min: number; max: number } | null> = {
  eco:   { min: 0,   max: 350 },
  orta:  { min: 350, max: 500 },
  guclu: { min: 500, max: Infinity },
  fark:  null,
};

export const KARAVAN_TYPE_MAP: Record<string, string[] | null> = {
  cekme:   ["cekme"],
  motorlu: ["motorlu"],
  kamper:  ["kamper-van"],
  fark:    null,
};

export function quizQ4Matches(
  answers: QuizAnswers,
  attrs: Record<string, unknown>,
  categorySlug: string | null,
): boolean {
  const q4 = answers.q4;
  if (!q4 || q4 === "fark") return true;

  switch (answers.cat) {
    case "oto": {
      const allowed = OTO_FUEL_MAP[q4];
      return !allowed || allowed.includes(String(attrs.fuel_type ?? ""));
    }
    case "moto": {
      const allowed = MOTO_TYPE_MAP[q4];
      return !allowed || allowed.includes(String(attrs.moto_type ?? ""));
    }
    case "scooter": {
      const range = SCOOTER_WATT_RANGES[q4];
      if (!range) return true;
      const watt = Number(attrs.motor_watt);
      return Number.isFinite(watt) && watt >= range.min && watt <= range.max;
    }
    case "karavan": {
      const allowed = KARAVAN_TYPE_MAP[q4];
      return !allowed || allowed.includes(String(attrs.karavan_type ?? ""));
    }
    case "kamyon": {
      // "Şart değil" = fark (filtre yok); sadece "4x4 şart" eleme yapar
      if (q4 === "dortcarpi") return attrs.four_wd === true || String(attrs.four_wd) === "true";
      return true;
    }
    case "hepsi": {
      const isElectric =
        String(attrs.fuel_type ?? "") === "EV" ||
        categorySlug === "e-scooter" ||
        categorySlug === "e-bisiklet";
      if (q4 === "elektrik") return isElectric;
      if (q4 === "yakitli")  return !isElectric;
      return true;
    }
  }
  return true;
}

function weightedScore(scores: FikapeScores, q3: string): number {
  const { scoreFiyat: fi, scoreKalite: ka, scorePerformans: pe } = scores;
  switch (q3) {
    case "bakim": return fi * 0.50 + ka * 0.50;
    case "yakit": return fi * 0.70 + pe * 0.30;
    case "guven": return ka * 0.70 + pe * 0.30;
    case "keyif": return pe * 0.70 + ka * 0.30;
    default:      return fi * 0.30 + ka * 0.35 + pe * 0.35;
  }
}

export function calcQuizScore(
  generalScores: FikapeScores,
  reviewExtData: ReviewExtData[],
  answers: QuizAnswers,
): QuizScoreResult {
  const base = weightedScore(generalScores, answers.q3);

  // Review-level matching only makes sense for otomobil (usage_type, maintenance_cost)
  if (answers.cat !== "oto" || reviewExtData.length === 0) {
    return { score: base, matchCount: 0, isRealMatch: false };
  }

  const expectedUsage = USAGE_MAP[answers.q2];
  const matching = reviewExtData.filter((ext) => {
    if (expectedUsage && ext.usage_type && ext.usage_type !== expectedUsage) return false;
    if (answers.q3 === "bakim" && ext.maintenance_cost && !LOW_MAINTENANCE.has(ext.maintenance_cost)) return false;
    return true;
  });

  return {
    score:       base,
    matchCount:  matching.length,
    isRealMatch: matching.length >= 3,
  };
}
