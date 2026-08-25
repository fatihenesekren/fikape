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
