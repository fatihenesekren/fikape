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

export const SOLD_TIME_SLOTS = [
  { key: "now",    label: "Bu ay",           monthsAgo: 0  },
  { key: "recent", label: "1–3 ay önce",     monthsAgo: 2  },
  { key: "mid",    label: "3–6 ay önce",     monthsAgo: 4  },
  { key: "far",    label: "6–12 ay önce",    monthsAgo: 9  },
  { key: "old",    label: "1 yıldan fazla",  monthsAgo: 18 },
] as const;

export const SOLD_TIME_MONTHS_AGO: Record<string, number> = Object.fromEntries(
  SOLD_TIME_SLOTS.map((s) => [s.key, s.monthsAgo])
);
