export interface FikapeScores {
  scoreFiyat:      number;
  scoreKalite:     number;
  scorePerformans: number;
  scoreOverall?:   number;
}

export const FIKAPE = [
  { key: "scoreFiyat",      short: "Fİ", label: "Fiyat",      color: "#0C447C", bg: "#E6F1FB", sub: "#4A80B5", weight: 0.30 },
  { key: "scoreKalite",     short: "KA", label: "Kalite",     color: "#27500A", bg: "#EAF3DE", sub: "#5A8A3A", weight: 0.35 },
  { key: "scorePerformans", short: "PE", label: "Performans", color: "#712B13", bg: "#FAECE7", sub: "#A05030", weight: 0.35 },
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
