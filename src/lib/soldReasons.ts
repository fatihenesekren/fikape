export const SOLD_REASONS = [
  { key: "UPGRADE",      label: "Daha iyi araca geçtim" },
  { key: "MAINTENANCE",  label: "Bakım masrafları arttı" },
  { key: "LIFESTYLE",    label: "İhtiyacım değişti" },
  { key: "RELIABILITY",  label: "Güvenilirlik sorunları" },
  { key: "FINANCIAL",    label: "Ekonomik nedenler" },
  { key: "OTHER",        label: "Diğer" },
] as const;

export const SOLD_REASON_LABEL: Record<string, string> = Object.fromEntries(
  SOLD_REASONS.map((r) => [r.key, r.label])
);
