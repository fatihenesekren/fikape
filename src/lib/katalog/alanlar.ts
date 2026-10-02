// Araç kaydı alanları için tek kaynak (öneri, admin ekleme/düzeltme ve doğrulamalar aynı listeleri kullanır).
export const KATEGORILER = ["otomobil", "motosiklet", "e-scooter", "e-bisiklet", "karavan", "kamyonet"] as const;
export type Kategori = (typeof KATEGORILER)[number];
export const YAKITLAR = ["GASOLINE", "DIESEL", "EV", "PHEV", "HYBRID", "LPG"] as const;
export const VITESLER = ["Manuel", "Otomatik", "CVT", "Yarı Otomatik"] as const;
export const kategoriGecerli = (k: unknown): k is Kategori => typeof k === "string" && (KATEGORILER as readonly string[]).includes(k);
