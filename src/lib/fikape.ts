export interface FikapeScores {
  scoreFiyat: number;
  scoreKalite: number;
  scorePerformans: number;
  scoreOverall?: number;
}

// FI×0.30 + KA×0.35 + PE×0.35
export function calcOverall(scores: Omit<FikapeScores, "scoreOverall">): number {
  return (
    scores.scoreFiyat * 0.3 +
    scores.scoreKalite * 0.35 +
    scores.scorePerformans * 0.35
  );
}

export const FIKAPE = [
  { key: "scoreFiyat",      short: "FI", label: "Fiyat",      color: "#0C447C", sub: "#185FA5", bg: "#E6F1FB" },
  { key: "scoreKalite",     short: "KA", label: "Kalite",     color: "#27500A", sub: "#3B6D11", bg: "#EAF3DE" },
  { key: "scorePerformans", short: "PE", label: "Performans", color: "#712B13", sub: "#993C1D", bg: "#FAECE7" },
] as const;
