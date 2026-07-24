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

export const SALE_TYPES = [
  { key: "CASH",  label: "Sattım (nakit)" },
  { key: "TRADE", label: "Takas ettim" },
] as const;

export const TRADE_EXTRA_DIRECTIONS = [
  { key: "PAID_EXTRA",     label: "Üstüne para verdim" },
  { key: "RECEIVED_EXTRA", label: "Üstüne para aldım" },
  { key: "EVEN",           label: "Denk takas (para yok)" },
] as const;
