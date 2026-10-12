import type { FikapeScores } from "./fikape";

export type QuizCat =
  | "oto"
  | "moto"
  | "scooter"
  | "ebike"
  | "karavan"
  | "kamyon"
  | "hepsi";

export interface QuizAnswers {
  cat: QuizCat;
  q2: string;
  q3: string;
  q4: string;
  /** 5. adım (kategori + 4 soru). Eski 3/4 parçalı paylaşılan adreslerde "fark" varsayılır. */
  q5: string;
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
  ebike:   "e-bisiklet",
  karavan: "karavan",
  kamyon:  "kamyonet",
  hepsi:   undefined,
};

export const SLUG_TO_CAT: Record<string, QuizCat> = {
  otomobil:    "oto",
  motosiklet:  "moto",
  "e-scooter": "scooter",
  "e-bisiklet": "ebike",
  karavan:     "karavan",
  kamyonet:    "kamyon",
};

export const CAT_LABELS: Record<QuizCat, string> = {
  oto:     "🚗 Otomobil",
  moto:    "🏍️ Motosiklet",
  scooter: "⚡ E-Scooter",
  ebike:   "🚲 E-Bisiklet",
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
  { key: "ebike",   icon: "🚲", label: "E-Bisiklet" },
  { key: "hepsi",   icon: "🤔", label: "Kararsızım" },
];

const BASE_STEPS: Record<QuizCat, QuizStepDef[]> = {
  oto: [
    {
      question: "Aracını ağırlıklı nerede kullanacaksın?",
      stepLabel: "Kullanım",
      opts: [
        { key: "sehir", icon: "🏙️", label: "Şehir içi",  sub: "Kompakt modeller (A/B segment)" },
        { key: "yol",   icon: "🛣️", label: "Uzun yol",    sub: "Geniş depo, yüksek menzil" },
        { key: "karma", icon: "↔️",  label: "Karma",       sub: "İkisi de, filtre yok" },
        { key: "zorlu", icon: "🏔️", label: "Zorlu",       sub: "4 çeker (AWD / 4WD)" },
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
        { key: "fark",     icon: "—",  label: "Fark etmez",    sub: "" },
      ],
    },
  ],
  moto: [
    {
      question: "Motosikleti nasıl kullanacaksın?",
      stepLabel: "Kullanım",
      opts: [
        { key: "sehir",   icon: "🏙️", label: "Şehir içi", sub: "Hafif, çevik (200 kg'a kadar)" },
        { key: "tur",     icon: "🛣️", label: "Tur / Yol", sub: "Geniş depo, uzun menzil" },
        { key: "offroad", icon: "🏔️", label: "Off-road",  sub: "Adventure, enduro, yüksek şasi" },
        { key: "karma",   icon: "↔️",  label: "Karma",     sub: "Her ikisi de, filtre yok" },
      ],
    },
    {
      question: "Motor hacmi tercihin?",
      stepLabel: "Motor",
      opts: [
        { key: "kucuk", icon: "🐣", label: "125–250 cc", sub: "Başlangıç, şehir" },
        { key: "orta",  icon: "💪", label: "400–600 cc", sub: "Orta güç" },
        { key: "buyuk", icon: "🔥", label: "600 cc+",    sub: "Yüksek performans" },
        { key: "fark",  icon: "—",  label: "Fark etmez",  sub: "" },
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
        { key: "fark",    icon: "—",  label: "Fark etmez",       sub: "" },
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
        { key: "bilmiyorum", icon: "❓", label: "Emin değilim", sub: "" },
      ],
    },
    {
      question: "Evde şarj imkanın var mı?",
      stepLabel: "Şarj",
      opts: [
        { key: "rahat", icon: "🏠", label: "Evet, rahatça", sub: "Priz ulaşıyor, filtre yok" },
        { key: "bazen", icon: "🤔", label: "Bazen",          sub: "Tam şarj 9 saate kadar" },
        { key: "zor",   icon: "😰", label: "Çok kısıtlı",   sub: "Hızlı şarj (7 saate kadar)" },
      ],
    },
    {
      question: "Motor gücü beklentin?",
      stepLabel: "Güç",
      opts: [
        { key: "eco",   icon: "🍃", label: "350W'a kadar", sub: "Hafif, düz yol" },
        { key: "orta",  icon: "💪", label: "350–500W",     sub: "Dengeli" },
        { key: "guclu", icon: "🔥", label: "500W+",        sub: "Yokuş, performans" },
        { key: "fark",  icon: "—",  label: "Fark etmez",    sub: "" },
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
      ],
    },
    {
      question: "Banyo ve mutfak şart mı?",
      stepLabel: "Konfor",
      opts: [
        { key: "tamkonfor", icon: "🛁", label: "Tam konfor",  sub: "Banyo, duş ve mutfak şart" },
        { key: "temel",     icon: "🍳", label: "Temel yeter", sub: "Mutfak yeterli" },
        { key: "minimal",   icon: "🏕️", label: "Minimal",    sub: "Sadece uyku, filtre yok" },
      ],
    },
    {
      question: "Nasıl bir karavan?",
      stepLabel: "Tip",
      opts: [
        { key: "cekme",   icon: "🚙", label: "Çekme",      sub: "Araçla çekilir" },
        { key: "motorlu", icon: "🚐", label: "Motorlu",    sub: "Kendi motoru var" },
        { key: "fark",    icon: "—",  label: "Fark etmez",  sub: "" },
      ],
    },
  ],
  kamyon: [
    {
      question: "Kamyoneti ne amaçla kullanacaksın?",
      stepLabel: "Amaç",
      opts: [
        { key: "is",     icon: "🔨", label: "İş / Yük",  sub: "800 kg ve üstü yük" },
        { key: "aile",   icon: "👨‍👩‍👧", label: "Aile + iş", sub: "5 ve üstü koltuk" },
        { key: "macera", icon: "🏕️", label: "Macera",    sub: "4×4 çekiş" },
        { key: "karma",  icon: "↔️",  label: "Karma",     sub: "Hepsi biraz, filtre yok" },
      ],
    },
    {
      question: "Yük kapasitesi önemli mi?",
      stepLabel: "Kapasite",
      opts: [
        { key: "hafif", icon: "📦", label: "Hafif ≤ 800 kg", sub: "Küçük yük" },
        { key: "orta",  icon: "📦", label: "Orta 800–1200 kg", sub: "Orta yük" },
        { key: "agir",  icon: "📦", label: "Ağır 1200 kg+", sub: "Ağır yük" },
        { key: "fark",  icon: "—",  label: "Fark etmez",  sub: "" },
      ],
    },
    {
      question: "Nasıl bir araç arıyorsun?",
      stepLabel: "Tip",
      opts: [
        { key: "yuk",    icon: "📦", label: "Panelvan / kapalı kasa", sub: "Yük, kargo, esnaf" },
        { key: "pickup", icon: "🛻", label: "Pickup / açık kasa",     sub: "Çift kabin + kasa" },
        { key: "fark",   icon: "—",  label: "Fark etmez",             sub: "" },
      ],
    },
  ],
  ebike: [
    {
      question: "Günlük ortalama mesafin ne kadar?",
      stepLabel: "Mesafe",
      opts: [
        { key: "kisa",       icon: "📍", label: "5–15 km",   sub: "Kısa mesafe" },
        { key: "orta",       icon: "📍", label: "15–30 km",  sub: "Orta mesafe" },
        { key: "uzun",       icon: "📍", label: "30 km+",    sub: "Uzun mesafe" },
        { key: "bilmiyorum", icon: "❓", label: "Emin değilim", sub: "" },
      ],
    },
    {
      question: "Motor gücü beklentin?",
      stepLabel: "Güç",
      opts: [
        { key: "eco",   icon: "🍃", label: "250 W'a kadar",  sub: "Standart pedelec" },
        { key: "guclu", icon: "🔥", label: "250 W üstü",     sub: "Yokuş, performans" },
        { key: "fark",  icon: "—",  label: "Fark etmez",    sub: "" },
      ],
    },
    {
      question: "Nasıl bir bisiklet arıyorsun?",
      stepLabel: "Tip",
      opts: [
        { key: "sehir",    icon: "🏙️", label: "Şehir",        sub: "Günlük komüt" },
        { key: "mtb",      icon: "⛰️", label: "MTB",           sub: "Dağ, arazi" },
        { key: "katlanir", icon: "🧳", label: "Katlanabilir",  sub: "Taşınabilir" },
        { key: "fark",     icon: "—",  label: "Fark etmez",     sub: "" },
      ],
    },
  ],
  hepsi: [
    {
      question: "Öncelikli kullanım şeklin?",
      stepLabel: "Kullanım",
      opts: [
        { key: "sehir",  icon: "🏙️", label: "Şehir içi",  sub: "Kompakt ve hafif araçlar" },
        { key: "yol",    icon: "🛣️", label: "Uzun yol",    sub: "Otomobil, karavan, tur motoru" },
        { key: "is",     icon: "💼", label: "İş amaçlı",  sub: "Yük taşıyan kamyonetler" },
        { key: "macera", icon: "🏕️", label: "Macera",     sub: "Karavan, 4×4, arazi araçları" },
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
        { key: "fark",     icon: "—",  label: "Fark etmez",        sub: "" },
      ],
    },
  ],
};

// 5. adım (kategori + 4 soru): her kategoride gerçek bir attributes alanına bağlı sert filtre (bkz. STEP_RULES).
const SON_ADIM: Record<QuizCat, QuizStepDef> = {
  oto: {
    question: "Hangi gövde tipini düşünüyorsun?",
    stepLabel: "Gövde",
    opts: [
      { key: "suv",       icon: "🚙", label: "SUV / Crossover",  sub: "Yüksek oturuş" },
      { key: "hatchback", icon: "🚗", label: "Hatchback",         sub: "Kompakt, pratik" },
      { key: "sedan",     icon: "🚘", label: "Sedan / Station",   sub: "Klasik, geniş bagaj" },
      { key: "fark",      icon: "—",  label: "Fark etmez",         sub: "" },
    ],
  },
  moto: {
    question: "Vites tercihin?",
    stepLabel: "Vites",
    opts: [
      { key: "manuel",   icon: "🦶", label: "Manuel",   sub: "Vitesi ben değiştiririm" },
      { key: "otomatik", icon: "🛵", label: "Otomatik", sub: "Scooter, DCT, CVT" },
      { key: "fark",     icon: "—",  label: "Fark etmez", sub: "" },
    ],
  },
  scooter: {
    question: "Azami hız beklentin?",
    stepLabel: "Hız",
    opts: [
      { key: "dusuk", icon: "🚶", label: "25 km/s'ye kadar", sub: "Yaya yoğun alan, hafif" },
      { key: "orta",  icon: "🚲", label: "26–45 km/s",       sub: "Şehir içi dengeli" },
      { key: "hizli", icon: "⚡", label: "45 km/s +",        sub: "Hızlı ve güçlü" },
      { key: "fark",  icon: "—",  label: "Fark etmez",        sub: "" },
    ],
  },
  karavan: {
    question: "Karavan boyu ne olsun?",
    stepLabel: "Uzunluk",
    opts: [
      { key: "kompakt", icon: "🚙", label: "Kompakt ≤ 6,5 m", sub: "Kolay çekilir, park" },
      { key: "orta",    icon: "🚐", label: "Orta 6,5–7,5 m",  sub: "Dengeli" },
      { key: "buyuk",   icon: "🚌", label: "Büyük 7,5 m +",   sub: "Geniş yaşam alanı" },
      { key: "fark",    icon: "—",  label: "Fark etmez",       sub: "" },
    ],
  },
  kamyon: {
    question: "Çekiş sistemi önemli mi?",
    stepLabel: "Çekiş",
    opts: [
      { key: "dortcek", icon: "🏔️", label: "4×4 olsun", sub: "Arazi, kar, çamur" },
      { key: "ikicek",  icon: "🛣️", label: "2 çeker yeter", sub: "Asfalt, şehir" },
      { key: "fark",    icon: "—",  label: "Fark etmez", sub: "" },
    ],
  },
  ebike: {
    question: "Motor tipi tercihin?",
    stepLabel: "Motor tipi",
    opts: [
      { key: "mid",  icon: "⚙️", label: "Orta motor",   sub: "Doğal pedal hissi, yokuş" },
      { key: "hub",  icon: "🔘", label: "Göbek motoru", sub: "Sade, uygun fiyatlı" },
      { key: "fark", icon: "—",  label: "Fark etmez",    sub: "" },
    ],
  },
  hepsi: {
    question: "Hangi tür araca bakalım?",
    stepLabel: "Araç türü",
    opts: [
      { key: "dort_teker", icon: "🚗", label: "4 tekerlekli", sub: "Otomobil, kamyonet" },
      { key: "iki_teker",  icon: "🏍️", label: "2 tekerlekli", sub: "Motosiklet, scooter, bisiklet" },
      { key: "yasam",      icon: "🏕️", label: "Karavan",      sub: "Seyahat, konaklama" },
      { key: "fark",       icon: "—",  label: "Fark etmez",    sub: "" },
    ],
  },
};

export const QUIZ_STEPS: Record<QuizCat, QuizStepDef[]> = Object.fromEntries(
  (Object.keys(BASE_STEPS) as QuizCat[]).map((cat) => [cat, [...BASE_STEPS[cat], SON_ADIM[cat]]]),
) as Record<QuizCat, QuizStepDef[]>;

// ─── URL encode / decode ───────────────────────

export function encodeQuiz(answers: QuizAnswers): string {
  return `${answers.cat},${answers.q2},${answers.q3},${answers.q4},${answers.q5}`;
}

export function decodeQuiz(param: string): QuizAnswers | null {
  const parts = param.split(",");
  if (parts.length < 3) return null;
  const [cat, q2, q3, q4, q5] = parts;
  const valid: QuizCat[] = ["oto", "moto", "scooter", "ebike", "karavan", "kamyon", "hepsi"];
  if (!valid.includes(cat as QuizCat)) return null;
  if (!q2 || !q3) return null;
  // Eski (3 ve 4 parçalı) paylaşılan adresler kırılmasın — eksik adımlar "fark etmez" sayılır
  return { cat: cat as QuizCat, q2, q3, q4: q4 || "fark", q5: q5 || "fark" };
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

// ── Sert filtre tabloları ─────────────────────────────
// Her cevap gerçek bir attributes alanına bağlanır: "fark" (ve "bilmiyorum" gibi bağlanmayan cevaplar) filtre koymaz,
// somut seçim aralık/liste dışını sonuçtan çıkarır; ilgili alanı boş olan kayıt somut seçimde elenir.

// Motosiklet "Motor hacmi" — elektrikli motosikletler (engine_cc yok) "fark etmez"de dahil kalır.
export const MOTO_CC_RANGES: Record<string, { min: number; max: number } | null> = {
  kucuk: { min: 125, max: 250 },
  orta:  { min: 400, max: 600 },
  buyuk: { min: 600, max: Infinity },
  fark:  null,
};

export const OTO_FUEL_MAP: Record<string, string[] | null> = {
  benzin:   ["GASOLINE", "LPG"],
  dizel:    ["DIESEL"],
  hibrit:   ["HYBRID", "PHEV"],
  elektrik: ["EV"],
  fark:     null,
};

export const OTO_BODY_MAP: Record<string, string[] | null> = {
  suv:       ["suv"],
  hatchback: ["hatchback"],
  sedan:     ["sedan", "station"],
  fark:      null,
};

export const MOTO_TYPE_MAP: Record<string, string[] | null> = {
  naked:   ["naked", "retro", "cruiser"],
  sport:   ["sport"],
  scooter: ["scooter", "uc-tekerlekli"],
  tur:     ["adventure", "touring", "enduro", "cross"],
  fark:    null,
};

export const MOTO_GEAR_MAP: Record<string, string[] | null> = {
  manuel:   ["Manuel"],
  otomatik: ["Otomatik", "CVT", "Yarı Otomatik"],
  fark:     null,
};

export const SCOOTER_WATT_RANGES: Record<string, { min: number; max: number } | null> = {
  eco:   { min: 0,   max: 350 },
  orta:  { min: 350, max: 500 },
  guclu: { min: 500, max: Infinity },
  fark:  null,
};

export const SCOOTER_SPEED_RANGES: Record<string, { min: number; max: number } | null> = {
  dusuk: { min: 0,  max: 25 },
  orta:  { min: 26, max: 45 },
  hizli: { min: 46, max: Infinity },
  fark:  null,
};

// E-bisiklet "Motor gücü" sert filtresi.
// Not: yasal pedelec sınırı 250 W; katalogda 250 W ve 750 W var, 251–500 W arası boş olduğu için "orta" kademe kaldırıldı
// (eski adreslerdeki q3=orta artık filtre koymaz).
export const EBIKE_WATT_RANGES: Record<string, { min: number; max: number } | null> = {
  eco:   { min: 0,   max: 250 },
  guclu: { min: 251, max: Infinity },
  fark:  null,
};

// E-bisiklet/e-scooter "Günlük mesafe": üreticinin verdiği azami menzil gerçek kullanımda çoğunlukla ~yarıya düşer;
// bu yüzden aracın menzili günlük mesafenin yaklaşık iki katı olmalı (kisa: 15 km menzil yeter, orta: 30, uzun: 60).
export const MESAFE_MIN_MENZIL_KM: Record<string, number | null> = {
  kisa: 15,
  orta: 30,
  uzun: 60,
  bilmiyorum: null,
};

export const BIKE_TYPE_MAP: Record<string, string[] | null> = {
  sehir:    ["sehir"],
  mtb:      ["mtb"],
  yol:      ["yol"],
  kargo:    ["kargo"],
  katlanir: ["katlanabilir"],
  fark:     null,
};

export const EBIKE_MOTOR_MAP: Record<string, string[] | null> = {
  mid:  ["mid-drive"],
  hub:  ["hub-drive"],
  fark: null,
};

export const KARAVAN_TYPE_MAP: Record<string, string[] | null> = {
  cekme:   ["cekme"],
  motorlu: ["motorlu"],
  kamper:  ["kamper-van"],
  fark:    null,
};

// Karavan "Kaç kişilik": en az bu kadar yatak (berth).
export const KARAVAN_MIN_BERTH: Record<string, number | null> = {
  iki:  2,
  dort: 3,
  alti: 5,
};

// Karavan boyu (length_cm).
export const KARAVAN_LENGTH_RANGES: Record<string, { min: number; max: number } | null> = {
  kompakt: { min: 0,   max: 650 },
  orta:    { min: 651, max: 750 },
  buyuk:   { min: 751, max: Infinity },
  fark:    null,
};

// Kamyonet yük kapasitesi (payload_kg) — /araclar'daki Yük Kapasitesi filtresiyle aynı kovalar.
export const KAMYON_PAYLOAD_RANGES: Record<string, { min: number; max: number } | null> = {
  hafif: { min: 0,    max: 800 },
  orta:  { min: 801,  max: 1200 },
  agir:  { min: 1201, max: Infinity },
  fark:  null,
};

type Attrs = Record<string, unknown>;
type Kural = (attrs: Attrs, slug: string | null) => boolean;

const sayi = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const aralikta = (v: unknown, r: { min: number; max: number }) => {
  const n = sayi(v);
  return n != null && n >= r.min && n <= r.max;
};
const listede = (v: unknown, liste: string[]) => liste.includes(String(v ?? ""));
const dogruMu = (v: unknown) => v === true || String(v) === "true";
const yanlisMi = (v: unknown) => v === false || String(v) === "false";

/** "Hepsi" 2. adım: aracın taşıyabileceği kişi sayısı. İki tekerleklilerde alan yok: motosiklet 2, e-scooter/e-bisiklet 1 kabul edilir. */
export function kisiKapasitesi(attrs: Attrs, categorySlug: string | null): number | null {
  if (categorySlug === "motosiklet") return 2;
  if (categorySlug === "e-scooter" || categorySlug === "e-bisiklet") return 1;
  if (categorySlug === "karavan") return sayi(attrs.berth);
  return sayi(attrs.seat_count);
}
export const HEPSI_MIN_KISI: Record<string, number | null> = {
  bir_iki:  null,
  dort:     3,
  bes_alti: 5,
};

// "Hepsi" son adım: hangi araç türü? (kategori slug'ı üzerinden)
export const HEPSI_TUR_SLUGLARI: Record<string, string[] | null> = {
  dort_teker: ["otomobil", "kamyonet"],
  iki_teker:  ["motosiklet", "e-scooter", "e-bisiklet"],
  yasam:      ["karavan"],
  fark:       null,
};

const listeKurali = (map: Record<string, string[] | null>, attrKey: string): Record<string, Kural> => {
  const out: Record<string, Kural> = {};
  for (const [k, v] of Object.entries(map)) if (v) out[k] = (a) => listede(a[attrKey], v);
  return out;
};
const aralikKurali = (map: Record<string, { min: number; max: number } | null>, attrKey: string): Record<string, Kural> => {
  const out: Record<string, Kural> = {};
  for (const [k, v] of Object.entries(map)) if (v) out[k] = (a) => aralikta(a[attrKey], v);
  return out;
};
const enAzKurali = (map: Record<string, number | null>, deger: (a: Attrs, slug: string | null) => number | null): Record<string, Kural> => {
  const out: Record<string, Kural> = {};
  for (const [k, min] of Object.entries(map)) {
    if (min != null) out[k] = (a, slug) => {
      const d = deger(a, slug);
      return d != null && d >= min;
    };
  }
  return out;
};
const menzil = (a: Attrs) => sayi(a.range_km);
const elektrikliMi = (a: Attrs, slug: string | null) => String(a.fuel_type ?? "") === "EV" || slug === "e-scooter" || slug === "e-bisiklet";

// ── Kullanım / amaç / şarj / konfor adımlarının veri kuralları ──
// Bu adımlar daha önce yalnız yönlendiriciydi; artık gerçek alanlara bağlı. Alanı boş kayıt somut seçimde elenir
// ("karma", "rahat", "minimal" gibi kısıtlamayan cevaplar filtre koymaz).
const OTO_KOMPAKT_SEGMENTLER = ["A", "B"];
const oto = {
  // Şehir içi: küçük segmentler (A/B) — park ve trafik için kompakt gövde
  sehir: ((a) => listede(a.segment, OTO_KOMPAKT_SEGMENTLER)) as Kural,
  // Uzun yol: yakıtlıda en az 50 L depo, elektrikte en az 400 km menzil
  yol: ((a) => {
    const menzilEv = sayi(a.ev_range_km), depo = sayi(a.tank_l);
    return String(a.fuel_type ?? "") === "EV" ? menzilEv != null && menzilEv >= 400 : depo != null && depo >= 50;
  }) as Kural,
  // Zorlu (kış, arazi): dört tekerden çekiş
  zorlu: ((a) => listede(a.drivetrain, ["AWD", "4WD"])) as Kural,
};
const moto = {
  // Şehir içi: hafif ve çevik (≤ 200 kg)
  sehir: ((a) => { const w = sayi(a.weight_kg); return w != null && w <= 200; }) as Kural,
  // Tur: yakıtlıda en az 14 L depo, elektrikte en az 150 km menzil
  tur: ((a) => {
    const depo = sayi(a.tank_l), menzilEv = sayi(a.ev_range_km);
    return String(a.fuel_type ?? "") === "EV" ? menzilEv != null && menzilEv >= 150 : depo != null && depo >= 14;
  }) as Kural,
  // Off-road: adventure/enduro/cross tipi ya da en az 190 mm yerden yükseklik
  offroad: ((a) => listede(a.moto_type, ["adventure", "enduro", "cross"]) || (sayi(a.ground_clearance_mm) ?? 0) >= 190) as Kural,
};
const kamyon = {
  is: ((a) => { const p = sayi(a.payload_kg); return p != null && p >= 800; }) as Kural,
  aile: ((a) => { const k = sayi(a.seat_count); return k != null && k >= 5; }) as Kural,
  macera: ((a) => dogruMu(a.four_wd)) as Kural,
};
// E-scooter şarj imkânı: kısıtlıysa kısa şarj süresi (ya da çıkarılabilir batarya) gerekir
const scooterSarj = (enFazlaSaat: number): Kural => (a) => {
  const h = sayi(a.charge_hours);
  return dogruMu(a.removable_battery) || (h != null && h <= enFazlaSaat);
};
// Karavan konfor: tam konfor = banyo + duş + mutfak, temel = mutfak
const karavanKonfor: Record<string, Kural> = {
  tamkonfor: (a) => dogruMu(a.has_bathroom) && dogruMu(a.has_shower) && dogruMu(a.has_kitchen),
  temel: (a) => dogruMu(a.has_kitchen),
};

/**
 * Adım kuralları — TEK GERÇEK KAYNAK (sert filtre + çip görünürlüğü).
 *   • tablo  : cevap anahtarı → kural. Tabloda olmayan anahtar ("fark" vb.) filtre koymaz.
 *   • "rank" : filtre değil, sıralama ağırlığı (otomobil önceliği) — sonucu etkiler ama kimseyi elemez.
 *   • null   : bu adım hiçbir şeyi etkilemez (yalnız kullanıcıyı yönlendirir).
 * Dizi indeksi = QUIZ_STEPS indeksi: 0 → q2, 1 → q3, 2 → q4, 3 → q5.
 */
type AdimKurali = Record<string, Kural> | "rank" | null;
export const STEP_RULES: Record<QuizCat, AdimKurali[]> = {
  oto: [
    { sehir: oto.sehir, yol: oto.yol, zorlu: oto.zorlu },
    "rank",
    listeKurali(OTO_FUEL_MAP, "fuel_type"),
    listeKurali(OTO_BODY_MAP, "body_type"),
  ],
  moto: [
    { sehir: moto.sehir, tur: moto.tur, offroad: moto.offroad },
    aralikKurali(MOTO_CC_RANGES, "engine_cc"),
    listeKurali(MOTO_TYPE_MAP, "moto_type"),
    listeKurali(MOTO_GEAR_MAP, "transmission"),
  ],
  scooter: [
    enAzKurali(MESAFE_MIN_MENZIL_KM, menzil),
    { bazen: scooterSarj(9), zor: scooterSarj(7) },
    aralikKurali(SCOOTER_WATT_RANGES, "motor_watt"),
    aralikKurali(SCOOTER_SPEED_RANGES, "max_speed_kmh"),
  ],
  karavan: [
    enAzKurali(KARAVAN_MIN_BERTH, (a) => sayi(a.berth)),
    karavanKonfor,
    listeKurali(KARAVAN_TYPE_MAP, "karavan_type"),
    aralikKurali(KARAVAN_LENGTH_RANGES, "length_cm"),
  ],
  kamyon: [
    { is: kamyon.is, aile: kamyon.aile, macera: kamyon.macera },
    aralikKurali(KAMYON_PAYLOAD_RANGES, "payload_kg"),
    {
      // Kasa tipi: "yuk" = kapalı kasa (van/panelvan), "pickup" = açık kasa.
      // Minivan/insan taşıma ile veri eksiği her ikisinde de elenir; "fark" hepsi.
      yuk:    (a) => listede(String(a.body_type ?? "").toLowerCase(), ["van", "panelvan"]),
      pickup: (a) => String(a.body_type ?? "").toLowerCase() === "pickup",
    },
    {
      dortcek: (a) => dogruMu(a.four_wd),
      ikicek:  (a) => yanlisMi(a.four_wd),
    },
  ],
  ebike: [
    enAzKurali(MESAFE_MIN_MENZIL_KM, menzil),
    aralikKurali(EBIKE_WATT_RANGES, "motor_watt"),
    listeKurali(BIKE_TYPE_MAP, "bike_type"),
    listeKurali(EBIKE_MOTOR_MAP, "motor_type"),
  ],
  hepsi: [
    {
      // Kategoriler arası: her kategori kendi kuralıyla değerlendirilir (otomobil/motosiklet/kamyonet yukarıdaki kurallar)
      sehir: (a, slug) =>
        slug === "e-scooter" || slug === "e-bisiklet" ||
        (slug === "motosiklet" && moto.sehir(a, slug)) ||
        (slug === "otomobil" && oto.sehir(a, slug)),
      yol: (a, slug) =>
        slug === "karavan" ||
        (slug === "otomobil" && oto.yol(a, slug)) ||
        (slug === "motosiklet" && moto.tur(a, slug)),
      is: (a, slug) => slug === "kamyonet" && kamyon.is(a, slug),
      macera: (a, slug) =>
        slug === "karavan" ||
        (slug === "kamyonet" && kamyon.macera(a, slug)) ||
        (slug === "otomobil" && oto.zorlu(a, slug)) ||
        (slug === "motosiklet" && moto.offroad(a, slug)),
    },
    enAzKurali(HEPSI_MIN_KISI, kisiKapasitesi),
    {
      elektrik: (a, slug) => elektrikliMi(a, slug),
      yakitli:  (a, slug) => !elektrikliMi(a, slug),
    },
    (() => {
      const out: Record<string, Kural> = {};
      for (const [k, v] of Object.entries(HEPSI_TUR_SLUGLARI)) if (v) out[k] = (_a, slug) => !!slug && v.includes(slug);
      return out;
    })(),
  ],
};

const ADIM_ANAHTARI = ["q2", "q3", "q4", "q5"] as const;

/** Tüm sert filtreler (adım 1–4) birlikte: bir ürün quiz cevaplarının hepsine uyuyor mu? */
export function quizMatches(answers: QuizAnswers, attrs: Attrs, categorySlug: string | null): boolean {
  const kurallar = STEP_RULES[answers.cat];
  return ADIM_ANAHTARI.every((anahtar, i) => {
    const adim = kurallar[i];
    if (!adim || adim === "rank") return true;
    const kural = adim[answers[anahtar]];
    return !kural || kural(attrs, categorySlug);
  });
}

/** Yalnız 3. soru (q4) filtresi — geriye uyumluluk ve birim testleri için. */
export function quizQ4Matches(answers: QuizAnswers, attrs: Attrs, categorySlug: string | null): boolean {
  const adim = STEP_RULES[answers.cat][2];
  if (!adim || adim === "rank") return true;
  const kural = adim[answers.q4];
  return !kural || kural(attrs, categorySlug);
}

// Bir quiz cevabı ana sayfa sonuç ızgarasını GERÇEKTEN etkiliyor mu? (sert filtre VEYA sıralama ağırlığı).
// Sonuç şeridinde yalnız bunlar çip olarak gösterilir — "Fark etmez" / "Emin değilim" ya da hiç okunmayan
// adımlar anlamsız çip üretmesin. Karar STEP_RULES'tan türer: kural tablosunda olan cevap etkiler.
//   step: 1 → q2, 2 → q3, 3 → q4, 4 → q5
export function answerAffectsResults(cat: QuizCat, step: 1 | 2 | 3 | 4, key: string): boolean {
  if (!key || key === "fark") return false;
  const adim = STEP_RULES[cat][step - 1];
  if (!adim) return false;
  if (adim === "rank") return true;
  return key in adim;
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

// ─── Seçenek sayıları ("Araç Bul" ölü uçları) ─────────────────────────
// Tarayıcıda her seçeneğin kaç araç getireceği hesaplanır; sonuç vermeyen seçenek pasif gösterilir.
// Havuz, kuralların okuduğu alanlarla sınırlandırılmış küçük bir kopyadır (bkz. quizHavuzu.ts, testte alan listesi doğrulanır).

export interface QuizHavuzUrunu {
  /** kategori slug'ı */
  c: string;
  /** yalnız QUIZ_ATTR_KEYS alanları */
  a: Record<string, unknown>;
}

export const QUIZ_ATTR_KEYS = [
  "fuel_type", "segment", "ev_range_km", "tank_l", "drivetrain", "body_type", "engine_cc", "moto_type", "transmission",
  "weight_kg", "ground_clearance_mm", "range_km", "charge_hours", "removable_battery", "motor_watt", "max_speed_kmh",
  "berth", "length_cm", "has_bathroom", "has_shower", "has_kitchen", "karavan_type", "payload_kg", "seat_count",
  "four_wd", "bike_type", "motor_type",
] as const;

/** Bir ürünün özelliklerinden yalnız kuralların okuduğu alanları (boş olmayanları) alır. */
export function quizAlanlariniKirp(attrs: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of QUIZ_ATTR_KEYS) if (attrs[k] != null && attrs[k] !== "") out[k] = attrs[k];
  return out;
}

export type QuizKismiCevap = Partial<Pick<QuizAnswers, "q2" | "q3" | "q4" | "q5">>;

const tamCevap = (cat: QuizCat, c: QuizKismiCevap): QuizAnswers => ({
  cat, q2: c.q2 || "fark", q3: c.q3 || "fark", q4: c.q4 || "fark", q5: c.q5 || "fark",
});

/** Verilen cevapların (boş olanlar "fark etmez" sayılır) getireceği araç sayısı. */
export function quizSonucSayisi(havuz: QuizHavuzUrunu[], cat: QuizCat, cevaplar: QuizKismiCevap): number {
  const slug = CAT_TO_SLUG[cat];
  const a = tamCevap(cat, cevaplar);
  return havuz.filter((p) => (!slug || p.c === slug) && quizMatches(a, p.a, p.c)).length;
}

/** Bu seçenek sonucu kısıtlar mı? (kural tablosunda olan cevap; "fark/karma/rahat…" kısıtlamaz, sıralama adımı kısıtlamaz) */
export function secenekKisitlarMi(cat: QuizCat, adim: 1 | 2 | 3 | 4, key: string): boolean {
  const kural = STEP_RULES[cat][adim - 1];
  return !!kural && kural !== "rank" && key in kural;
}

/**
 * Bir adımdaki her seçenek için, ÖNCEKİ adımların cevapları korunarak o seçeneğin getireceği araç sayısı.
 * Daha sonraki adımların cevapları sayıya katılmaz: geri dönüp bir adımı değiştiren kullanıcı, yalnızca sonraki
 * cevabıyla çakıştığı için seçeneği kaybetmesin; çakışan sonraki cevaplar seçimden sonra temizlenir
 * (bkz. uyumsuzSonrakiCevaplariTemizle).
 */
export function adimSecenekSayilari(
  havuz: QuizHavuzUrunu[], cat: QuizCat, mevcut: QuizKismiCevap, adim: 1 | 2 | 3 | 4,
): Record<string, number> {
  const anahtar = ADIM_ANAHTARI[adim - 1];
  const onceki: QuizKismiCevap = {};
  for (let j = 0; j < adim - 1; j++) onceki[ADIM_ANAHTARI[j]] = mevcut[ADIM_ANAHTARI[j]];
  const out: Record<string, number> = {};
  for (const opt of QUIZ_STEPS[cat][adim - 1].opts) out[opt.key] = quizSonucSayisi(havuz, cat, { ...onceki, [anahtar]: opt.key });
  return out;
}

/**
 * `adim` adımındaki cevap değiştikten sonra, sonuç vermeyen DAHA SONRAKİ adımların cevaplarını temizler
 * (ör. geri dönüp 2. soruyu değiştirince eski 4. cevap boş sonuç üretecekse boşaltılır; kullanıcı ona yeniden sorulur).
 */
export function uyumsuzSonrakiCevaplariTemizle(
  havuz: QuizHavuzUrunu[], cat: QuizCat, cevaplar: QuizKismiCevap, adim: 1 | 2 | 3 | 4,
): QuizKismiCevap {
  const sonuc: QuizKismiCevap = { ...cevaplar };
  for (let j = adim + 1; j <= 4; j++) {
    const anahtar = ADIM_ANAHTARI[j - 1];
    const deger = sonuc[anahtar];
    if (deger && secenekKisitlarMi(cat, j as 1 | 2 | 3 | 4, deger) && quizSonucSayisi(havuz, cat, sonuc) === 0) delete sonuc[anahtar];
  }
  return sonuc;
}
