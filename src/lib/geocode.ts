// Adres → koordinat, tek amaç: usta iletişim adresini haritada KESİN bir
// iğneyle gösterebilmek (bkz. feature_usta_gorusleri_ilerleme — Google'ın
// API anahtarsız embed'i düzensiz adreslerde marker koyamıyordu, yalnız
// genel bölgeyi gösteriyordu). API anahtarı gerektirmeyen OpenStreetMap
// Nominatim kullanılıyor — ücretsiz, ama kullanım politikası (1 istek/sn,
// tanımlayıcı User-Agent) gerektiriyor. Yalnız adres kaydedilirken/
// değiştiğinde çağrılır, sayfa render'ında değil.
async function geocodeQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tr&q=${encodeURIComponent(query)}`;
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

// Tek bir serbest-metin adresi geocode eder (geriye dönük uyumluluk için
// ayrı export edildi — backfill script'i de bunu kullanıyor).
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  return geocodeQuery(address);
}

// Serbest-metin Türkçe adresler (apartman adı + "No:" + il/ilçe karışık
// sırada, örn. "Buket Sokak Çınar Apartmanı No:39 Yalova/Çiftlikköy")
// Nominatim'in kendi geocoder'ı için çoğu zaman TEK BAŞINA çözülemiyor —
// kullanıcı bunu canlıda yaşadı (ilk deneme "YOK" döndü). Bu yüzden İL/İLÇE
// (ayrı, yapılandırılmış alanlar — ExpertProfile.city/district) bağlam
// olarak eklenip giderek sadeleşen bir sorgu zinciri deneniyor: tam adres
// başarısızsa ilçe+il'e, o da başarısızsa yalnız il'e düşülür — sonuç
// olarak EN KÖTÜ ihtimalle bile şehir merkezli kaba bir konum elde edilir,
// hiçbir zaman "hiç iğne yok" durumuna dönülmez (adres girildiği sürece).
export async function geocodeBestEffort(
  address: string,
  district: string | null,
  city: string | null
): Promise<{ lat: number; lng: number } | null> {
  const cityDistrict = [district, city].filter(Boolean).join(", ");
  const candidates = [
    cityDistrict ? `${address}, ${cityDistrict}, Türkiye` : `${address}, Türkiye`,
    cityDistrict ? `${cityDistrict}, Türkiye` : null,
    city ? `${city}, Türkiye` : null,
  ].filter((c): c is string => !!c);

  for (let i = 0; i < candidates.length; i++) {
    const result = await geocodeQuery(candidates[i]);
    if (result) return result;
    // Nominatim kullanım politikası: saniyede en fazla 1 istek — yalnız
    // birden fazla deneme gerekirse bekle.
    if (i < candidates.length - 1) await new Promise((r) => setTimeout(r, 1100));
  }
  return null;
}
