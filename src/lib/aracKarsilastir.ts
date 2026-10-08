import { slugify } from "@/lib/slugify";

// Prisma'ya bağımlı DEĞİL — hem sunucuda (src/app/api/oneriler/route.ts) hem
// istemcide (src/app/oner/page.tsx, "Aracı Öner" butonunu anlık aktif/pasif
// yapmak için) kullanılır. existingVehicle.ts'teki findExistingVehicles Prisma
// çağırdığı için o dosyayı client bundle'a hiç sokmamak adına bu ayrı dosyada.

/** Yakıt/vites yalnız motorlu kategorilerde araç kimliğinin parçasıdır (e-scooter, e-bisiklet, karavan için sorulmaz). */
export const YAKIT_VITES_KATEGORILERI = ["otomobil", "kamyonet", "motosiklet"] as const;

export interface AracKimlik {
  year: number | null;
  trimName: string | null;
  transmission: string | null;
  fuelType: string | null;
}

/**
 * Yeni bir araç önerisinin (yıl, donanım, yakıt, vites) dörtlüsü mevcut bir
 * eşleşmeyle BİREBİR aynı mı? — gerçek kopya olarak engellemek için tek kanıt
 * bu: client'tan gelen bir "onaylıyorum" bayrağına ASLA güvenilmez, çünkü
 * böyle bir tasarım denenmiş ve marka+model eşleştiği an her gönderiyi
 * (birebir kopyalar dahil) atlatmıştı (bkz. kullanıcı geri bildirimi,
 * 2026-09-27). Dörtlüden herhangi biri farklıysa (ör. farklı yıl/donanım)
 * gerçekten farklı bir varyanttır — eksik/null bir alan da "aynı olduğundan
 * emin değiliz" sayılır, kopya SAYILMAZ (yanlış-pozitif engellemektense
 * yanlış-negatifi tercih ederiz, moderatör panelindeki "olası kopya" rozeti
 * zaten ikinci bir güvenlik ağı).
 */
export function birebirAyniArac(mevcut: AracKimlik, yeni: AracKimlik, kategori?: string): boolean {
  const mevcutTrim = (mevcut.trimName ?? "").trim().toLowerCase();
  const yeniTrim = (yeni.trimName ?? "").trim().toLowerCase();
  // E-scooter / e-bisiklet / karavan: yakıt ve vites kimliğin parçası DEĞİL (formda sorulmaz, kayıtta yoktur) ve
  // donanımsız ("Standart") kayıt gerçek bir kimliktir → yıl + donanım (boş = boş) aynıysa kopyadır. Aksi hâlde bu
  // kategorilerde hiçbir kayıt "birebir aynı" sayılmaz, aynı araç tekrar tekrar önerilebilirdi.
  if (kategori && !(YAKIT_VITES_KATEGORILERI as readonly string[]).includes(kategori)) {
    return mevcut.year !== null && yeni.year !== null && mevcut.year === yeni.year && mevcutTrim === yeniTrim;
  }
  const mevcutVites = mevcut.transmission ? slugify(mevcut.transmission) : null;
  const yeniVites = yeni.transmission ? slugify(yeni.transmission) : null;
  return (
    mevcut.year !== null && yeni.year !== null && mevcut.year === yeni.year &&
    mevcutTrim === yeniTrim && // iki taraf da donanımsız (boş = boş) ise de aynı kimliktir; biri doluyken diğeri boşsa farklıdır
    mevcut.fuelType !== null && mevcut.fuelType === yeni.fuelType &&
    mevcutVites !== null && mevcutVites === yeniVites
  );
}
