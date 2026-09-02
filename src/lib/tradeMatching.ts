import type { DamageStatus } from "@/lib/damageStatus";
import type { LocationScope, TradeFuelType } from "@/lib/tradeExpectations";

// Bir ilanın "aradığım" kriterleri — kategori/marka boşsa fark etmez anlamına
// gelir (bkz. TradeToggleCard.tsx'teki aynı ilke).
export interface WantCriteria {
  wantCategoryId: number | null;
  wantBrandId: number | null;
  wantLocationScope: LocationScope;
  wantDamageStatuses: DamageStatus[];
  city: string; // ilan sahibinin KENDİ şehri — konum beklentisi buna göre değerlendirilir
  // Yıl/km aralığı + yakıt/vites tercihi — hepsi boş/null ise o kritere göre
  // kısıtlama yok (bkz. kullanıcı geri bildirimi: "Aradığınız Araç" bölümü
  // bunları hiç sormuyordu).
  wantYearMin: number | null;
  wantYearMax: number | null;
  wantKmMin: number | null;
  wantKmMax: number | null;
  wantFuelTypes: TradeFuelType[];
  wantTransmissions: string[];
}

// Bir aracın (karşı taraf ilanının) somut nitelikleri — WantCriteria'ya karşı test edilir.
export interface VehicleFacts {
  categoryId: number;
  brandId: number;
  city: string;
  damageStatus: DamageStatus | null;
  year: number | null;
  km: number | null;
  fuelType: string | null;
  transmission: string | null;
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
// Yıl/km/yakıt/vites: aynı "bilinmeyen veriyi eleme" ilkesi — adayın year/km/
//   fuelType/transmission alanı null ise (veri yok) o kriter atlanır, dışlanmaz.
export function matchesWant(want: WantCriteria, vehicle: VehicleFacts): boolean {
  if (want.wantCategoryId != null && want.wantCategoryId !== vehicle.categoryId) return false;
  if (want.wantBrandId != null && want.wantBrandId !== vehicle.brandId) return false;
  if (want.wantLocationScope === "SAME_CITY" && want.city !== vehicle.city) return false;
  if (want.wantDamageStatuses.length > 0 && vehicle.damageStatus != null) {
    if (!want.wantDamageStatuses.includes(vehicle.damageStatus)) return false;
  }
  if (vehicle.year != null) {
    if (want.wantYearMin != null && vehicle.year < want.wantYearMin) return false;
    if (want.wantYearMax != null && vehicle.year > want.wantYearMax) return false;
  }
  if (vehicle.km != null) {
    if (want.wantKmMin != null && vehicle.km < want.wantKmMin) return false;
    if (want.wantKmMax != null && vehicle.km > want.wantKmMax) return false;
  }
  if (want.wantFuelTypes.length > 0 && vehicle.fuelType != null) {
    if (!want.wantFuelTypes.includes(vehicle.fuelType as TradeFuelType)) return false;
  }
  if (want.wantTransmissions.length > 0 && vehicle.transmission != null) {
    if (!want.wantTransmissions.includes(vehicle.transmission)) return false;
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

// Product.attributes (JSON) içinden yakıt/vites bilgisini çıkarır — VehicleFacts
// inşa eden her yerde (api/trades, takas/page.tsx, garajim/page.tsx) aynı
// mantığın tekrarlanmaması için tek bir yerde (bkz. specFields.ts: "fuel_type"/
// "transmission" anahtarları, kategoriye göre olmayabilir — o zaman null döner).
export function fuelTransmissionFromAttributes(attrs: unknown): { fuelType: string | null; transmission: string | null } {
  const a = attrs && typeof attrs === "object" ? (attrs as Record<string, unknown>) : {};
  return {
    fuelType: typeof a.fuel_type === "string" ? a.fuel_type : null,
    transmission: typeof a.transmission === "string" ? a.transmission : null,
  };
}
