// Boyalı/Değişen Parça özelliği — sabit parça listesi + kuşbakışı şema
// üzerindeki dikdörtgen bölge koordinatları. Sadece gövde paneli olan
// kategorilerde (otomobil/kamyonet) anlamlı; diğer kategorilerde (motosiklet,
// e-scooter, karavan vb.) bu kavram uygulanamadığı için form/sekme hiç
// gösterilmiyor (bkz. takas/[id]/page.tsx, TradeToggleCard.tsx).
export const PART_CONDITION_CATEGORIES = ["otomobil", "kamyonet"] as const;

export interface CarPart {
  key: string;
  label: string;
  // Şema viewBox'ı 0 0 200 440 — kuşbakışı, ön taraf yukarıda.
  rect: { x: number; y: number; width: number; height: number };
  rx?: number; // köşe yuvarlama (sadece uç paneller — tampon)
}

export const CAR_PARTS: CarPart[] = [
  { key: "on_tampon",         label: "Ön Tampon",         rect: { x: 30,  y: 20,  width: 140, height: 35 }, rx: 16 },
  { key: "sol_on_camurluk",   label: "Sol Ön Çamurluk",   rect: { x: 30,  y: 55,  width: 28,  height: 100 } },
  { key: "kaput",             label: "Kaput",             rect: { x: 58,  y: 55,  width: 84,  height: 100 } },
  { key: "sag_on_camurluk",   label: "Sağ Ön Çamurluk",   rect: { x: 142, y: 55,  width: 28,  height: 100 } },
  { key: "sol_on_kapi",       label: "Sol Ön Kapı",       rect: { x: 30,  y: 155, width: 28,  height: 75 } },
  { key: "tavan",             label: "Tavan",             rect: { x: 58,  y: 155, width: 84,  height: 150 } },
  { key: "sag_on_kapi",       label: "Sağ Ön Kapı",       rect: { x: 142, y: 155, width: 28,  height: 75 } },
  { key: "sol_arka_kapi",     label: "Sol Arka Kapı",     rect: { x: 30,  y: 230, width: 28,  height: 75 } },
  { key: "sag_arka_kapi",     label: "Sağ Arka Kapı",     rect: { x: 142, y: 230, width: 28,  height: 75 } },
  { key: "sol_arka_camurluk", label: "Sol Arka Çamurluk", rect: { x: 30,  y: 305, width: 28,  height: 80 } },
  { key: "bagaj_kapagi",      label: "Bagaj Kapağı",      rect: { x: 58,  y: 305, width: 84,  height: 80 } },
  { key: "sag_arka_camurluk", label: "Sağ Arka Çamurluk", rect: { x: 142, y: 305, width: 28,  height: 80 } },
  { key: "arka_tampon",       label: "Arka Tampon",       rect: { x: 30,  y: 385, width: 140, height: 35 }, rx: 16 },
];

export type PartCondition = "ORIGINAL" | "LOCAL_PAINT" | "PAINTED" | "REPLACED";

export const PART_CONDITION_LABEL: Record<PartCondition, string> = {
  ORIGINAL: "Orijinal",
  LOCAL_PAINT: "Lokal Boyalı",
  PAINTED: "Boyalı",
  REPLACED: "Değişen",
};

export const PART_CONDITION_COLOR: Record<PartCondition, string> = {
  ORIGINAL: "#9CA3AF",
  LOCAL_PAINT: "#F97316",
  PAINTED: "#3B82F6",
  REPLACED: "#EF4444",
};
