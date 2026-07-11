const AVATAR_COLORS = ["#0C447C", "#27500A", "#712B13", "#6B3A8A", "#0D6E5A", "#185FA5", "#993C1D", "#3B6D11"];

const DICEBEAR_STYLE = "adventurer";
const DICEBEAR_OPTION_COUNT = 40;

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

export function dicebearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;
}

// Kullanıcıya sunulan seçilebilir avatar seçenekleri — deterministik (aynı
// kullanıcı her zaman aynı seçenekleri görür), userId'ye bağlı.
export function buildAvatarOptionSeeds(userId: number): string[] {
  return Array.from({ length: DICEBEAR_OPTION_COUNT }, (_, i) => `fikape-${userId}-${i + 1}`);
}
