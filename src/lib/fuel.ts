export const FUEL_ICONS: Record<string, string> = {
  EV:       "⚡",
  HYBRID:   "🔋",
  GASOLINE: "⛽",
  DIESEL:   "🛢️",
  LPG:      "🔵",
};

export const FUEL_LABELS: Record<string, string> = {
  EV:       "Elektrikli",
  HYBRID:   "Hibrit",
  GASOLINE: "Benzin",
  DIESEL:   "Dizel",
  LPG:      "LPG",
};

export const FUEL_COLORS: Record<string, { bg: string; text: string }> = {
  EV:       { bg: "#C0DD97", text: "#27500A" },
  HYBRID:   { bg: "#B5D4F4", text: "#0C447C" },
  GASOLINE: { bg: "#D3D1C7", text: "#444441" },
  DIESEL:   { bg: "#FAC775", text: "#412402" },
  LPG:      { bg: "#F4C0D1", text: "#4B1528" },
};

export const FUEL_FILTERS = [
  { key: "hepsi",    label: "Tüm Araçlar" },
  { key: "EV",       label: `${FUEL_ICONS.EV} Elektrikli` },
  { key: "HYBRID",   label: `${FUEL_ICONS.HYBRID} Hibrit` },
  { key: "GASOLINE", label: `${FUEL_ICONS.GASOLINE} Benzin` },
  { key: "DIESEL",   label: `${FUEL_ICONS.DIESEL} Dizel` },
];
