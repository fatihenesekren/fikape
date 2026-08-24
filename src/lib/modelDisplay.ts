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

export function splitTrimName(trimName: string | null | undefined): { version: string; donanim: string } | null {
  if (!trimName) return null;
  const m = trimName.match(TRIM_SPLIT_RE);
  if (!m) return null;
  return { version: m[1].trim(), donanim: m[2].trim() };
}
