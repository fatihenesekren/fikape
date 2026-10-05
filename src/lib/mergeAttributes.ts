import { normalizeAttributeValues } from "@/lib/vehicleTypes";

// Admin "Teknik Özellikler" PATCH'inin birleştirme mantığı. Gelen değerler mevcut
// Product.attributes üzerine yazılır; değeri null veya "" olan anahtar kayıttan
// SİLİNİR (admin formu, boşalttığı alanı null olarak gönderir). Böylece bir alan
// yanlış girildiğinde ya da kasa tipi değişince anlamsızlaştığında temizlenebilir.
const KEY_RE = /^[a-z][a-z0-9_]{0,63}$/;

export function mergeAttributes(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const toSet: Record<string, unknown> = {};
  const toDelete: string[] = [];
  for (const [key, value] of Object.entries(incoming)) {
    if (!KEY_RE.test(key)) continue;
    if (value === null || value === "") toDelete.push(key);
    else toSet[key] = value;
  }
  const merged = { ...existing, ...normalizeAttributeValues(toSet) };
  for (const key of toDelete) delete merged[key];
  return merged;
}
