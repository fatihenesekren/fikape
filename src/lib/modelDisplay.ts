// Model adının sonuna eklenen "(2008-2012)" / "(2020-)" gibi nesil aralığı ayrı bir
// alan değil — Model.name string'inin içine gömülü. Araç Öner formu (oner/page.tsx,
// getModelYearRange) bu deseni okuyup Yıl dropdown'ını akıllıca daraltmak için
// kullanıyor, bu yüzden veritabanından KALDIRILMIYOR. Bu yardımcı sadece halka açık
// kart/sayfalarda görünümden çıkarmak için — arama/seçim ekranlarında (Araç Öner,
// yorum yazarken araç arama) nesil ayrımı kullanıcıya faydalı olduğu için dokunulmuyor.
//
// Tire karakteri [-–—] olarak üç varyantı da kapsıyor: bazı DB kayıtları (örn. mevcut
// "Volkswagen Golf 6 (2008–2012)") normal tire yerine en dash içeriyor — bkz.
// fix_oner_vw_endash memory'si, statik katalogda düzeltilmişti ama önceden oluşturulmuş
// canlı DB kayıtlarına dokunulmamıştı.
const DASH = "[-–—]";
export const MODEL_GEN_RANGE_RE = new RegExp(`\\s*\\((\\d{4})\\s*${DASH}\\s*(\\d{4})?\\)\\s*$`);

export function stripModelGenRange(name: string): string {
  return name.replace(MODEL_GEN_RANGE_RE, "").trim();
}

// "Clio 4 (2012-2019)" -> "Clio" : nesil aralığını VE sondaki nesil numarasını atar.
// Sondaki 1-2 haneli sayı YALNIZCA öncesinde ≥3 harflik gerçek bir isim varsa
// atılır: "Clio 4" -> "Clio", "Megane 3" -> "Megane". "Ioniq 5", "Atto 3", "DS 3",
// "AR 06", "R 12", "208", "500" gibi sayının modelin ADI olduğu durumlar korunur
// ("AR"/"R" 3 harften kısa; sayısız tek parça isimlerde zaten boşluk yok).
// findExistingVehicles bunu, seed'in nesilsiz slug'ladığı ("renault-clio") eski
// kayıtları öner formundaki nesilli seçimle ("Clio 4 (2012-2019)") eşleştirmek
// için kullanır.
export function baseNameplate(name: string): string {
  const noRange = stripModelGenRange(name).trim();
  const m = noRange.match(/^(.*\S)\s+\d{1,2}$/);
  if (m && /[A-Za-zÇĞİÖŞÜçğıöşü]{3,}$/.test(m[1])) return m[1].trim();
  return noRange;
}

// Product.name gibi birleştirilmiş (marka+model+trim+yıl) string'lerde nesil aralığı
// sonda değil ORTADA kalabilir (örn. "VW Golf 6 (2008-2012) 1.4 TSI 2011" — yıl sonda
// olduğu için stripModelGenRange'in $ ile sabitlenmiş deseni eşleşmez). Bu yüzden konuma
// bakmaksızın her geçtiği yerde temizler — e-posta bildirimleri gibi Product.name'i
// doğrudan kullanan düşük görünürlüklü ama yine de halka açık metinlerde kullanılır.
const GEN_RANGE_ANYWHERE_RE = new RegExp(`\\s*\\(\\d{4}\\s*${DASH}\\s*\\d{4}?\\)`, "g");

export function stripGenRangeAnywhere(text: string): string {
  return text.replace(GEN_RANGE_ANYWHERE_RE, "").replace(/\s{2,}/g, " ").trim();
}

// trimName alanı katalog verisinde çoğunlukla "{versiyon} – {donanım}" kalıbında
// tutuluyor (örn. "E 220d – Exclusive", "2.0 TDI – Style") — ama bu kalıp sadece
// otomobil (ve kısmen motosiklet) kataloğunda tutarlı; karavan/kamyonet/e-scooter/
// e-bisiklette trimName tek parça ("Raptor", "Athlete" gibi), tire içermiyor.
// Kart/başlık bileşenleri "versiyon" ile "donanım"ı ayrı ayrı vurgulamak istediğinde
// (versiyon başlıkta, donanım alt satırda, model adı hiç gösterilmeden — bkz.
// kullanıcı geri bildirimi: "E Serisi W213" yerine "E 220d" öne çıksın) bu yardımcı
// kullanılır; tire yoksa null döner, çağıran taraf eski (model adı büyük) düzene
// düşer — veri şekli olmayan kategorilerde zorla bölme yapılmaz.
const TRIM_SPLIT_RE = new RegExp(`^(.+?)\\s${DASH}\\s(.+)$`);

// "versiyon" yarısı sadece motor-spec gürültüsü ise (örn. "125cc 12.5 CV",
// "23 CV") bu bir donanım/versiyon adı değil — bölme yapma, çağıran taraf model
// adına düşsün. Katalogda bu sızıntı tekrar eden bir hata sınıfı (bkz.
// fikape_oner_trimname_sizinti_gecmisi memory'si); veri düzeltilse de savunma
// katmanı olarak burada da kesiliyor.
const SPEC_NOISE_RE = /\b\d+(\.\d+)?\s*(cc|cv|hp|kw|ps|bg)\b/i;

export function splitTrimName(trimName: string | null | undefined): { version: string; donanim: string } | null {
  if (!trimName) return null;
  const m = trimName.match(TRIM_SPLIT_RE);
  if (!m) return null;
  const version = m[1].trim();
  const donanim = m[2].trim();
  if (SPEC_NOISE_RE.test(version)) return null;
  return { version, donanim };
}
