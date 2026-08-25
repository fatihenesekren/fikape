// Boyalı/Değişen Parça özelliği — sabit parça listesi + kuşbakışı şema
// üzerindeki dikdörtgen bölge koordinatları. Sadece gövde paneli olan
// kategorilerde (otomobil/kamyonet) anlamlı; diğer kategorilerde (motosiklet,
// e-scooter, karavan vb.) bu kavram uygulanamadığı için form/sekme hiç
// gösterilmiyor (bkz. takas/[id]/page.tsx, TradeToggleCard.tsx).
export const PART_CONDITION_CATEGORIES = ["otomobil", "kamyonet"] as const;

export interface CarPart {
  key: string;
  label: string;
  // Şema viewBox'ı 0 0 200 440 — kuşbakışı, ön taraf yukarıda. Her parça bir
  // SVG path'i (13 parça yan yana geldiğinde boşluksuz/çakışmasız bir araç
  // silüeti oluşturacak şekilde elle koordinatlanmış) — önceden düz
  // dikdörtgenlerdi, kullanıcı geri bildirimiyle (referans görsel) gerçekçi
  // bir siluete geçirildi: sivri/daralan burun-kuyruk, çamurluk kabartması,
  // pah kırılmış tavan köşeleri. Kenarlar bilerek düz çizgilerle (bezier
  // eğrisi değil) tarif edildi — komşu parçalarla ortak kenarın piksel piksel
  // eşleşmesi garanti olsun diye; yuvarlatılmış/eğrisel bir sonraki tur
  // ince ayarı bu path'ler üzerinden yapılabilir.
  d: string;
}

export const CAR_PARTS: CarPart[] = [
  { key: "on_tampon",         label: "Ön Tampon",         d: "M12,45 L188,45 L178,15 L100,0 L22,15 Z" },
  { key: "sol_on_camurluk",   label: "Sol Ön Çamurluk",   d: "M12,45 L8,90 L22,140 L48,140 L40,45 Z" },
  { key: "kaput",             label: "Kaput",             d: "M40,45 L160,45 L152,140 L48,140 Z" },
  { key: "sag_on_camurluk",   label: "Sağ Ön Çamurluk",   d: "M188,45 L192,90 L178,140 L152,140 L160,45 Z" },
  { key: "sol_on_kapi",       label: "Sol Ön Kapı",       d: "M22,140 L50,140 L50,220 L22,220 Z" },
  { key: "tavan",             label: "Tavan",             d: "M60,140 L140,140 L150,150 L150,290 L140,300 L60,300 L50,290 L50,150 Z" },
  { key: "sag_on_kapi",       label: "Sağ Ön Kapı",       d: "M178,140 L150,140 L150,220 L178,220 Z" },
  { key: "sol_arka_kapi",     label: "Sol Arka Kapı",     d: "M22,220 L50,220 L50,300 L22,300 Z" },
  { key: "sag_arka_kapi",     label: "Sağ Arka Kapı",     d: "M178,220 L150,220 L150,300 L178,300 Z" },
  { key: "sol_arka_camurluk", label: "Sol Arka Çamurluk", d: "M22,300 L8,350 L12,395 L40,395 L48,300 Z" },
  { key: "bagaj_kapagi",      label: "Bagaj Kapağı",      d: "M48,300 L152,300 L160,395 L40,395 Z" },
  { key: "sag_arka_camurluk", label: "Sağ Arka Çamurluk", d: "M178,300 L192,350 L188,395 L160,395 L152,300 Z" },
  { key: "arka_tampon",       label: "Arka Tampon",       d: "M12,395 L188,395 L178,425 L100,440 L22,425 Z" },
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
