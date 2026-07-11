const AVATAR_COLORS = ["#0C447C", "#27500A", "#712B13", "#6B3A8A", "#0D6E5A", "#185FA5", "#993C1D", "#3B6D11"];

// İnsan yüzlü, aileye uygun DiceBear stilleri — çeşitlilik bunların
// döngüsel karışımından geliyor, tek stilde sadece seed değişmiyor.
const DICEBEAR_STYLES = ["adventurer", "avataaars", "big-smile", "personas", "micah", "lorelei"];
const DICEBEAR_OPTION_COUNT = 100;

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
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
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
