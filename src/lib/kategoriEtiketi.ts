import { KAMYONET_BODY_TYPES } from "@/lib/vehicleTypes";

/**
 * Kart ve liste satırlarında araç için kategori etiketi.
 * Kamyonet kategorisi pickup, van, camlı van, minibüs gibi farklı gövdeleri barındırır; tek bir ad ("Pickup") van'ı yanlış
 * etiketler. Bu yüzden gövde tipi biliniyorsa "Kamyonet / Van" gibi gövdeye özel yazılır, bilinmiyorsa yalnız "Kamyonet".
 * Diğer kategorilerde kategori adı aynen döner.
 */
export function urunKategoriEtiketi(
  categorySlug: string | null | undefined,
  categoryName: string | null | undefined,
  bodyType: unknown,
): string {
  if (categorySlug === "kamyonet") {
    const govde = KAMYONET_BODY_TYPES.find((b) => b.value === String(bodyType ?? "").toLowerCase());
    return govde ? `Kamyonet / ${govde.label}` : "Kamyonet";
  }
  return categoryName ?? "Araç";
}
