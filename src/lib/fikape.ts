export const SCORE_LABELS: Record<number, string> = {
  1: "Berbat", 2: "Çok Kötü", 3: "Kötü", 4: "Vasat", 5: "Orta",
  6: "Fena Değil", 7: "İyi", 8: "Çok İyi", 9: "Mükemmel", 10: "Harika!",
};

export interface FikapeScores {
  scoreFiyat:      number;
  scoreKalite:     number;
  scorePerformans: number;
  scoreOverall?:   number;
}

// FI·KA·PE renk ailesi — src/app/globals.css'teki --fi/--fi-strong/--fi-soft ile
// AYNI değerler. CSS var'ları kullanılabildiği yerde token tercih edilir; bu
// sabitler yalnızca Satori (ImageResponse — OG / paylaşım kartı / badge /
// apple-icon) için, çünkü orada CSS custom property çözülmez.
export const FIKAPE_MID    = { fi: "#185FA5", ka: "#3B6D11", pe: "#993C1D" } as const; // beyaz üstünde
export const FIKAPE_STRONG = { fi: "#0C447C", ka: "#27500A", pe: "#712B13" } as const; // tint üstünde
export const FIKAPE_SOFT   = { fi: "#85B7EB", ka: "#97C459", pe: "#F0997B" } as const; // koyu (#111) üstünde
export const FIKAPE_BG     = { fi: "#E6F1FB", ka: "#EAF3DE", pe: "#FAECE7" } as const;

export const FIKAPE = [
  { key: "scoreFiyat",      short: "Fİ", label: "Fiyat",      color: FIKAPE_STRONG.fi, bg: FIKAPE_BG.fi, sub: "#4A80B5", weight: 0.30 },
  { key: "scoreKalite",     short: "KA", label: "Kalite",     color: FIKAPE_STRONG.ka, bg: FIKAPE_BG.ka, sub: "#5A8A3A", weight: 0.35 },
  { key: "scorePerformans", short: "PE", label: "Performans", color: FIKAPE_STRONG.pe, bg: FIKAPE_BG.pe, sub: "#A05030", weight: 0.35 },
] as const;

export function calcOverall({
  scoreFiyat,
  scoreKalite,
  scorePerformans,
}: {
  scoreFiyat: number;
  scoreKalite: number;
  scorePerformans: number;
}): number {
  return scoreFiyat * 0.30 + scoreKalite * 0.35 + scorePerformans * 0.35;
}
