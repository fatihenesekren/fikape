import { stripModelGenRange, splitTrimName } from "@/lib/modelDisplay";

// Site genelinde (VehicleCard, araç detay H1 vb.) trimName "versiyon – donanım"
// kalıbındaysa model adı bilinçli olarak gösterimden düşürülüyor (örn. "E 220d",
// bkz. modelDisplay.ts) — Mercedes gibi markalarda bu kendi başına anlamlı çünkü
// versiyon zaten model bilgisini taşıyor. Ama Ford Fiesta/VW Golf gibi araçlarda
// trimName sadece motor kodu ("1.4", "1.4 TSI") — model adı olmadan hiçbir şey
// ifade etmiyor. Karşılaştır sayfasında (arama dropdown'ı, chip'ler, kart
// başlıkları — hepsi düz metin, görsel bağlam sınırlı) bu "Ford 1.4" gibi
// belirsiz adlara yol açıyordu (bkz. kullanıcı geri bildirimi). Bu yüzden SADECE
// karşılaştırma bağlamında model adı HER ZAMAN korunuyor — site genelindeki
// (VehicleCard vb.) davranışa dokunulmadı, bilinçli geçmiş bir karardı.
export function formatCompareVehicleName(
  modelName: string,
  trimName: string | null | undefined
): { displayName: string; subtitle: string | null } {
  const cleanModel = stripModelGenRange(modelName);
  const trimSplit = splitTrimName(trimName);
  if (trimSplit) {
    return { displayName: `${cleanModel} ${trimSplit.version}`, subtitle: trimSplit.donanim };
  }
  return { displayName: cleanModel, subtitle: trimName || null };
}
