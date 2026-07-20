// Yerli/milli kabul edilen marka adları — VehicleCard'da kırmızı kenar şeridi +
// marka adının yanına bayrak rozeti eklemek için kullanılır. Web araştırmasıyla
// tek tek doğrulanmış (üretici Türkiye'de kurulu ve/veya kendi fabrikası var):
// TOGG (otomobil), BMC/Karsan (kamyonet), Arora/Asya/Kanuni/Küba Motor/Mondial (TR)
// (motosiklet). E-scooter, e-bisiklet ve karavan kategorilerinde yerli marka yok.
// Yeni bir yerli marka kataloğa (vehicles.json) eklenirse buraya da eklenmeli.
const DOMESTIC_BRAND_NAMES = [
  "TOGG",
  "BMC",
  "Karsan",
  "Arora",
  "Asya",
  "Kanuni",
  "Küba Motor",
  "Mondial (TR)",
];

// Marka adı hem vehicles.json'da hem DB'de (seed/oluşturma yoluna göre) farklı
// harf biçimiyle bulunabiliyor (örn. "TOGG" vs "Togg") — büyük/küçük harf
// duyarsız karşılaştırıyoruz.
const DOMESTIC_BRANDS = new Set(DOMESTIC_BRAND_NAMES.map((n) => n.toLocaleLowerCase("tr")));

export function isDomesticBrand(brandName: string): boolean {
  return DOMESTIC_BRANDS.has(brandName.toLocaleLowerCase("tr"));
}
