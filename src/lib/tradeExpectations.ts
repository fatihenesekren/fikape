// Takas ilanı — "aradığım araç nerede olmalı / hangi hasar durumlarını kabul
// ederim" beklentileri. wantCategoryId/wantBrandId gibi bunlar da otomatik
// bir filtre/eşleştirme uygulamıyor, sadece diğer kullanıcıya gösterilen bir
// beklenti bilgisi (bkz. kullanıcı geri bildirimi: ilan sadece kendi
// aracının nerede olduğunu söylüyordu, aradığı aracın konum/hasar
// beklentisini hiç belirtemiyordu).

export type LocationScope = "SAME_CITY" | "SAME_REGION" | "NATIONWIDE";

export const LOCATION_SCOPES: LocationScope[] = ["SAME_CITY", "SAME_REGION", "NATIONWIDE"];

export const LOCATION_SCOPE_LABEL: Record<LocationScope, string> = {
  SAME_CITY: "Aynı Şehirde",
  SAME_REGION: "Aynı Bölgede",
  NATIONWIDE: "Türkiye Genelinde",
};

// Yakıt tipi — Product.attributes.fuel_type ile aynı sözlük (bkz. lib/fuel.ts
// FUEL_LABELS). Takas'a özel bir enum yerine oradaki değerler yeniden kullanılıyor.
export type TradeFuelType = "GASOLINE" | "DIESEL" | "EV" | "PHEV" | "HYBRID" | "LPG";
export const TRADE_FUEL_TYPES: TradeFuelType[] = ["GASOLINE", "DIESEL", "EV", "PHEV", "HYBRID", "LPG"];

// Vites tipi — Product.attributes.transmission'daki serbest metin seçenekleriyle
// aynı (bkz. specFields.ts, otomobil/karavan). Sabit bir enum değil, kategoriye
// göre yeni bir değer eklenmesi migration gerektirmesin diye.
export const TRANSMISSION_OPTIONS = ["Manuel", "Otomatik", "CVT", "Yarı Otomatik"];
