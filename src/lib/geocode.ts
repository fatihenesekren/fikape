// Adres → koordinat, tek amaç: usta iletişim adresini haritada KESİN bir
// iğneyle gösterebilmek (bkz. feature_usta_gorusleri_ilerleme — Google'ın
// API anahtarsız embed'i düzensiz adreslerde marker koyamıyordu, yalnız
// genel bölgeyi gösteriyordu). API anahtarı gerektirmeyen OpenStreetMap
// Nominatim kullanılıyor — ücretsiz, ama kullanım politikası (1 istek/sn,
// tanımlayıcı User-Agent) gerektiriyor. Yalnız adres kaydedilirken/
// değiştiğinde BİR KEZ çağrılır, sayfa render'ında değil.
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: {
        // Nominatim kullanım politikası: tanımlayıcı bir User-Agent zorunlu.
        "User-Agent": "fikape.com (usta iletisim harita ozelligi)",
        "Accept-Language": "tr",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const first = data[0];
    if (!first) return null;
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    // Geocode servisi geçici olarak erişilemez olabilir — sessizce null
    // döner, eski genel-alan harita görünümüne düşülür (bkz. çağıran kod).
    return null;
  }
}
