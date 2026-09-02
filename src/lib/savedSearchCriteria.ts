// SavedSearch'ün tüm kriterlerinin (city dahil, q HARİÇ) kanonik/sıralı
// serileştirmesi — array kolonları (fuelTypes/transmissions) üzerinde unique
// constraint kurmak yerine tek bir string üzerinden aynı kullanıcının aynı
// aramayı iki kez kaydetmesini engellemek için (bkz. prisma/schema.prisma
// SavedSearch.criteriaKey notu). Serbest metin (q) kasıtlı olarak dışarıda —
// SavedSearch'e hiç kaydedilmiyor (bkz. kullanıcı onayı).
export function buildSavedSearchCriteriaKey(c: {
  city: string;
  categoryId: number | null;
  brandId: number | null;
  paymentIntent: string | null;
  yearMin: number | null;
  yearMax: number | null;
  kmMin: number | null;
  kmMax: number | null;
  fuelTypes: string[];
  transmissions: string[];
}): string {
  return [
    c.city,
    c.categoryId ?? "",
    c.brandId ?? "",
    c.paymentIntent ?? "",
    c.yearMin ?? "",
    c.yearMax ?? "",
    c.kmMin ?? "",
    c.kmMax ?? "",
    [...c.fuelTypes].sort().join(","),
    [...c.transmissions].sort().join(","),
  ].join("|");
}
