// Giriş sonrası yönlendirme adresi (callbackUrl) doğrulaması: yalnızca site içi göreli yollar.
// Önceki kontrol yalnızca "/" ile başlayıp "//" ile başlamamayı arıyordu; "/\evil.com" ve
// "/<sekme>/evil.com" gibi biçimler bunu geçiyordu — tarayıcılar ters eğik çizgiyi "/" gibi,
// sekme/satır sonunu da yok sayarak okuduğu için bu adresler harici bir siteye gider.
const SAHTE_KOK = "http://yonlendirme.invalid";

export function sanitizeCallbackUrl(url: string | null | undefined): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return "/";
  // Ters eğik çizgi ve kontrol karakterleri (sekme, satır sonu vb.) hiçbir yerde kabul edilmez.
  if (/[\\\u0000-\u001f\u007f]/.test(url)) return "/";
  try {
    // Göreli yol sahte bir kökle çözüldüğünde kök değişiyorsa adres harici bir siteye gidiyor demektir.
    if (new URL(url, SAHTE_KOK).origin !== SAHTE_KOK) return "/";
  } catch {
    return "/";
  }
  return url;
}
