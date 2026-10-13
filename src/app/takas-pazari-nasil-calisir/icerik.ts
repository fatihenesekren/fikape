// Takas Pazarı bilgi sayfasının metinleri. Sayfadan AYRI tutuldu: yasak ifade testi
// (icerik.test.ts) tüm metinleri tek yerden tarayabilsin diye. Kurallar: "siz" dili,
// iç terim (CURRENT/trustLevel/APPROVED) yok, ücret/garanti/doğrulama vaadi yok.
// Hukuki dayanak: kullanim-kosullari madde 10 (aracı platform, beyanlar ilan sahibine
// ait), gizlilik madde 10 (takas verisi). Silme süresi anonymize-closed-trades cron'unun
// gerçek davranışıyla birebir yazıldı (183 gün; mesaj metni, ilan notu/açıklaması ve
// ilan fotoğrafları; hasar/motor notları ve tramer kayıtları silinmez).

export const TAKAS_SAYFA_BASLIK = "Takas Pazarı Nasıl Çalışır?";
export const TAKAS_SAYFA_ACIKLAMA =
  "Aracınızı takasa açmanın şartları, adımları ve ilan verdiğinizde nelerin görüneceği. Takas Pazarı bir iletişim aracıdır; ödeme almaz, takasın tarafı değildir.";

export const TAKAS_GIRIS_METNI =
  "Takas Pazarı, aracını başka bir araçla takas etmek isteyen üyelerin ilan verdiği ve birbirine mesaj yazdığı bölümdür. Bir iletişim aracıdır: platform üzerinden ödeme alınmaz, para aktarımı yapılmaz ve fikape takasın tarafı değildir.";

export const TAKAS_ADIMLAR = [
  {
    baslik: "Aracınızı garajınıza ekleyin",
    metin: "Aracın sayfasındaki “Bu araç benim” butonunu kullanın. Garajınızda olmayan bir araç takasa açılamaz.",
  },
  {
    baslik: "Bu araç için fotoğraflı bir yorum yazın",
    metin: "Yorum formunda Detaylı modu seçip en az bir fotoğraf ekleyin. Hızlı modda fotoğraf eklenemez.",
  },
  {
    baslik: "Yorumun yayınlanmasını bekleyin",
    metin: "Yorumlar ve fotoğraflar yayınlanmadan önce incelenir. Durumu Garajım sayfasından takip edebilirsiniz.",
  },
  {
    baslik: "Aracınızı takasa açın",
    metin: "Garajım'daki araç kartından ilanınızı oluşturun: il, ödeme niyeti, hasar durumu ve aradığınız araç gibi bilgileri girersiniz.",
  },
] as const;

export const TAKAS_NEDEN_BASLIK = "Neden fotoğraflı yorum isteniyor?";
export const TAKAS_NEDEN_METNI =
  "Yorumunuzdaki fotoğraf, ilan sayfasında aracınızı daha inandırıcı gösterir ve karşı tarafın size güvenmesini kolaylaştırır. Şart her araç için ayrıca aranır: bir araç için yorum yazmanız, diğer araçlarınızı takasa açmanızı sağlamaz.";

export const TAKAS_GORUNUR_BASLIK = "İlan verdiğinizde neler görünür?";
export const TAKAS_GORUNUR = [
  "İlan listesinde il, araç bilgileri ve fotoğraf herkese görünür.",
  "İlanın ayrıntıları (hasar beyanı, tramer kayıtları, açıklama ve aradığınız araç) yalnızca üyelere gösterilir.",
  "Diğer üyeler görünen adınızı ve avatarınızı görür; gerçek adınız, e-posta adresiniz ve telefonunuz gösterilmez.",
  "Mesajlarda telefon, e-posta, IBAN ve site dışı mesajlaşma bağlantıları paylaşılamaz.",
  "İlan fotoğrafları yayınlanmadan önce incelenir.",
  "Kapanan ilanın mesajları, ilan notu ve açıklaması ile ilan fotoğrafları kapanıştan yaklaşık 6 ay sonra silinir. Hasar notları ve tramer kayıtları bu işlemin kapsamında değildir.",
] as const;

export const TAKAS_GUVENLIK_BASLIK = "Takas yaparken dikkat edin";
export const TAKAS_GUVENLIK = [
  "Fark tutarını, aracı fiziksel olarak teslim almadan önce göndermeyiniz.",
  "Banka dekontunu teslimat kanıtı olarak kabul etmeyiniz.",
  "Mümkünse takas öncesinde ekspertiz yaptırınız.",
  "Buluşmayı halka açık bir yerde yapınız.",
  "Plaka veya şasi bilgisini paylaşmadan önce karşı tarafın kimliğinden emin olunuz.",
] as const;
export const TAKAS_SORUMLULUK =
  "İlandaki hasar, tramer ve diğer beyanlar ilan sahibine aittir ve fikape tarafından doğrulanmaz. fikape takasın tarafı değildir.";

export const TAKAS_SSS = [
  {
    q: "Başka birinin ilanına mesaj yazmak için ne gerekir?",
    a: "Herhangi bir aracınız için fotoğraflı bir yorumunuzun yayınlanmış olması yeterlidir. Kendi ilanınızı açmak içinse şart, ilanı açacağınız araç için ayrıca aranır.",
  },
  {
    q: "Aynı anda kaç ilan açabilirim?",
    a: "Her araç için bir aktif ilan açabilirsiniz. Günlük ilan açma sayısında bir sınır vardır.",
  },
  {
    q: "İlanım ne kadar süre yayında kalır?",
    a: "İlanınız siz kapatana kadar yayında kalır. İsterseniz “İlanı yenile” ile listede üst sıraya taşıyabilirsiniz.",
  },
  {
    q: "Fark tutarı nasıl ödenir?",
    a: "Fark tutarı ve ödeme tamamen taraflar arasında, platform dışında görüşülür. fikape ödeme almaz ve para aktarımına aracılık etmez.",
  },
  {
    q: "Fotoğrafım reddedilirse ne olur?",
    a: "Yorumunuza aracın genel görünümünü gösteren yeni bir fotoğraf yükleyebilirsiniz. Durumu Garajım sayfasından görebilirsiniz.",
  },
  {
    q: "İlan açtıktan sonra yorumumu silersem ilanım ne olur?",
    a: "Yayındaki ilanınız yayında kalır. Yeni bir ilan açmak için fotoğraf şartının yeniden sağlanması gerekir.",
  },
] as const;
