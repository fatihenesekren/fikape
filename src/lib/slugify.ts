// Marka / model / ürün slug'ı — TEK KAYNAK.
//
// seed (prisma/seed-otomobil-bulk.ts), /api/oneriler ve /api/vehicle-suggest
// AYNI kuralı kullanmak zorunda: "bu araç zaten katalogda var mı?" kontrolü
// marka+model slug eşleşmesine dayanıyor (bkz. findExistingVehicles). Route
// başına kopya slugify implementasyonları zamanla birbirinden kayıp sessiz
// kopya ürünlere yol açıyordu.
export function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
