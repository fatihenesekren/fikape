import type { DamageStatus } from "@/lib/damageStatus";
import type { LocationScope } from "@/lib/tradeExpectations";

// Bir ilanın "aradığım" kriterleri — kategori/marka boşsa fark etmez anlamına
// gelir (bkz. TradeToggleCard.tsx'teki aynı ilke).
export interface WantCriteria {
  wantCategoryId: number | null;
  wantBrandId: number | null;
  wantLocationScope: LocationScope;
  wantDamageStatuses: DamageStatus[];
  city: string; // ilan sahibinin KENDİ şehri — konum beklentisi buna göre değerlendirilir
}

// Bir aracın (karşı taraf ilanının) somut nitelikleri — WantCriteria'ya karşı test edilir.
export interface VehicleFacts {
  categoryId: number;
  brandId: number;
  city: string;
  damageStatus: DamageStatus | null;
}

// Adayın aracı, ilan sahibinin "aradığım" kriterlerini karşılıyor mu?
// Kategori/marka: boşsa (null) her şey kabul; doluysa birebir eşleşmeli.
// Konum: SAME_CITY ilan sahibinin kendi şehriyle birebir eşleşme ister;
//   SAME_REGION için gerçek bir il→bölge haritalaması YOK (bkz. kullanıcı
//   geri bildirimi, tradeExpectations.ts notu) — bilinçli olarak NATIONWIDE
//   ile aynı (lenient) davranıyor, ileride gerçek bölge verisiyle sıkılaştırılabilir.
// Hasar durumu: liste boşsa tümü kabul; adayın hasar durumu hiç beyan
//   edilmemişse (null — moto/karavan gibi kategorilerde hep böyledir) bu
//   kriteri karşılıyor sayılır, dışlanmaz.
export function matchesWant(want: WantCriteria, vehicle: VehicleFacts): boolean {
  if (want.wantCategoryId != null && want.wantCategoryId !== vehicle.categoryId) return false;
  if (want.wantBrandId != null && want.wantBrandId !== vehicle.brandId) return false;
  if (want.wantLocationScope === "SAME_CITY" && want.city !== vehicle.city) return false;
  if (want.wantDamageStatuses.length > 0 && vehicle.damageStatus != null) {
    if (!want.wantDamageStatuses.includes(vehicle.damageStatus)) return false;
  }
  return true;
}

export interface ListingMatchInput {
  want: WantCriteria;
  vehicle: VehicleFacts;
}

// Karşılıklı eşleşme: A'nın aracı B'nin aradığına uyuyor VE B'nin aracı
// A'nın aradığına uyuyor.
export function isMutualMatch(a: ListingMatchInput, b: ListingMatchInput): boolean {
  return matchesWant(a.want, b.vehicle) && matchesWant(b.want, a.vehicle);
}
