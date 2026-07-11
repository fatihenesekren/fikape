const AVATAR_COLORS = ["#0C447C", "#27500A", "#712B13", "#6B3A8A", "#0D6E5A", "#185FA5", "#993C1D", "#3B6D11"];

// İnsan yüzlü, aileye uygun DiceBear stilleri — çeşitlilik bunların
// döngüsel karışımından geliyor, tek stilde sadece seed değişmiyor.
// "adventurer" çıkarıldı: mouth/eyes seçenekleri numaralandırılmış
// (variant01, variant02...) olduğu için hangisinin olumsuz göründüğü
// API şemasından doğrulanamıyor — yerine tamamı etiketli olan fun-emoji eklendi.
const DICEBEAR_STYLES = ["avataaars", "big-smile", "personas", "micah", "lorelei", "fun-emoji"];
const DICEBEAR_OPTION_COUNT = 100;

// Her stilin resmi DiceBear API şemasından (mouth/eyes enum listesi) doğrulanarak
// seçilmiş, sadece olumlu/nötr görünen seçenekler — üzgün/şaşkın/kızgın gibi
// olumsuz ifadeler tamamen dışarıda bırakılıyor (kullanıcı geri bildirimi).
const POSITIVE_FEATURES: Record<string, Record<string, string[]>> = {
  avataaars: {
    mouth: ["default", "eating", "smile", "tongue", "twinkle"],
    eyes:  ["default", "happy", "hearts", "side", "wink", "winkWacky", "squint"],
  },
  "big-smile": {
    mouth: ["openedSmile", "teethSmile", "gapSmile", "kawaii", "braces", "awkwardSmile"],
    eyes:  ["cheery", "normal", "winking", "starstruck"],
  },
  personas: {
    mouth: ["smile", "bigSmile", "lips", "smirk"],
    eyes:  ["open", "wink", "happy", "glasses", "sunglasses"],
  },
  micah: {
    mouth: ["laughing", "smile", "smirk", "pucker"],
  },
  lorelei: {
    // lorelei'de "happy01".."happy18" ve "sad01".."sad09" var — hepsini olumlu seç.
    mouth: Array.from({ length: 18 }, (_, i) => `happy${String(i + 1).padStart(2, "0")}`),
  },
  "fun-emoji": {
    mouth: ["plain", "lilSmile", "cute", "wideSmile", "smileTeeth", "smileLol", "tongueOut", "kissHeart", "drip"],
    eyes:  ["cute", "wink", "wink2", "love", "stars", "glasses", "shades", "plain"],
  },
};

export function getInitials(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(seed: string): string {
  return AVATAR_COLORS[hashSeed(seed) % AVATAR_COLORS.length];
}

export function dicebearUrl(seed: string, style: string): string {
  const params = new URLSearchParams({ seed });
  const features = POSITIVE_FEATURES[style];
  if (features) {
    for (const [key, values] of Object.entries(features)) {
      for (const value of values) params.append(`${key}[]`, value);
    }
  }
  return `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`;
}

export interface AvatarOption {
  index: number;
  seed: string;
  style: string;
}

// Kullanıcıya sunulan seçilebilir avatar seçenekleri — deterministik (aynı
// kullanıcı her zaman aynı seçenekleri görür), userId'ye bağlı. Stiller
// döngüsel karışıyor ki 100 seçenek aynı görünümün varyasyonu olmasın.
export function buildAvatarOptions(userId: number): AvatarOption[] {
  return Array.from({ length: DICEBEAR_OPTION_COUNT }, (_, i) => ({
    index: i,
    seed: `fikape-${userId}-${i + 1}`,
    style: DICEBEAR_STYLES[i % DICEBEAR_STYLES.length],
  }));
}
