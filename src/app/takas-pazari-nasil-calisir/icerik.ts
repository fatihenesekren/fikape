// Takas Pazarı bilgi sayfasının metinleri. Sayfadan AYRI tutuldu: yasak ifade testi
// (icerik.test.ts) tüm metinleri tek yerden tarayabilsin diye. Kurallar: "siz" dili,
// iç terim (CURRENT/trustLevel/APPROVED) yok, ücret/garanti/doğrulama vaadi yok.
// Hukuki dayanak: kullanim-kosullari madde 10 (aracı platform, beyanlar ilan sahibine
// ait), gizlilik madde 10 (takas verisi). Silme süresi anonymize-closed-trades cron'unun
// gerçek davranışıyla birebir yazıldı (183 gün; mesaj metni, ilan notu/açıklaması ve
// ilan fotoğrafları; hasar/motor notları ve tramer kayıtları silinmez).

export const TAKAS_SAYFA_BASLIK = "Takas Pazarı Nasıl Çalışır?";
export const TAKAS_SAYFA_ACIKLAMA =
  "Aracınızı takasa açmanın şartları, adımları ve ilan verdiğinizde nelerin görüneceği.";

export const TAKAS_GIRIS_METNI =
  "Takas Pazarı, aracını başka bir araçla takas etmek isteyen üyelerin ilan verdiği ve birbirine mesaj yazdığı bölümdür. Platform üzerinden ödeme alınmaz, para aktarımı yapılmaz; fikape takasın tarafı değildir.";

export const TAKAS_ADIMLAR_BASLIK = "Takasa açmak için adımlar";
export const TAKAS_ADIMLAR: readonly { baslik: string; metin: string; baglanti?: { etiket: string; href: string } }[] = [
  {
    baslik: "Aracınız garajınızda olsun",
    metin: "Aracın sayfasındaki “Bu araç benim” butonunu kullanın. Garajınızda olmayan bir araç takasa açılamaz.",
  },
  {
    baslik: "Bu araç için fotoğraflı bir yorum yazın",
    metin: "Yorum formunda Detaylı modu seçip en az bir fotoğraf ekleyin. Hızlı modda fotoğraf eklenemez.",
  },
  {
    baslik: "Yorumunuzun ve fotoğrafınızın incelenmesini bekleyin",
    metin: "Yorumunuz ve fotoğrafınız yayınlanmadan önce incelenir; inceleme süresi değişebilir. Durumu Garajım sayfasından takip edebilirsiniz.",
    baglanti: { etiket: "Garajım'a gidin", href: "/garajim" },
  },
  {
    baslik: "Aracınızı takasa açın",
    metin: "Takas Panelim'deki İlanlarım bölümünden ilanınızı oluşturun: il, ödeme şekli, hasar durumu ve aradığınız araç gibi bilgileri girersiniz.",
  },
];

export const TAKAS_NEDEN_BASLIK = "Neden fotoğraflı yorum isteniyor?";
export const TAKAS_NEDEN_METNI =
  "Yorumunuza eklediğiniz fotoğraf, ilan sayfasında aracınızı karşı tarafa gösterir; takas edeceği aracı görebilmesi gerekir. Şart her araç için ayrıca aranır: bir araç için yorum yazmanız, diğer araçlarınızı takasa açmanızı sağlamaz.";

export const TAKAS_GORUNUR_BASLIK = "İlan verdiğinizde neler görünür?";
export const TAKAS_GORUNUR = [
  "İlan listesinde il, araç bilgileri ve fotoğraf herkese görünür.",
  "İlanın ayrıntıları (hasar beyanı, tramer beyanı, açıklama ve aradığınız araç) yalnızca üyelere gösterilir.",
  "Diğer üyeler görünen adınızı ve avatarınızı görür; gerçek adınız, e-posta adresiniz ve telefonunuz gösterilmez.",
  "Mesajlarda telefon, e-posta, IBAN ve site dışı mesajlaşma bağlantıları paylaşılamaz.",
  "İlana yüklediğiniz fotoğraflar da yayınlanmadan önce incelenir.",
] as const;

export const TAKAS_KAPANIS_BASLIK = "İlan kapandıktan sonra";
export const TAKAS_KAPANIS_METNI =
  "İlanınız kapandıktan yaklaşık 6 ay sonra ilana ait mesajlar, ilan notu ve açıklaması ile ilan fotoğrafları silinir. Hasar notları ve tramer beyanı bu işlemin kapsamında değildir.";

export const TAKAS_GUVENLIK_BASLIK = "Takas yaparken dikkat edilecekler";
export const TAKAS_GUVENLIK = [
  "Aracı teslim almadan fark tutarını göndermeyin; aracınızı teslim ederken de tutarın hesabınıza geçtiğinden emin olun.",
  "Yalnızca dekonta ya da ekran görüntüsüne bakarak ödemenin yapıldığını varsaymayın; tutarın hesabınıza geçtiğini kendi bankanızdan kontrol edin.",
  "Mümkünse takas öncesinde ekspertiz yaptırın.",
  "Araçların devrini noterde yapın; devrin nasıl yapılacağı, harç ve vergiler konusunda noterden bilgi alın.",
  "Buluşmayı halka açık bir yerde yapın.",
  "Plaka veya şasi bilgisini yalnızca takası ciddi olarak sürdürmeye karar verdiğinizde paylaşın.",
] as const;
export const TAKAS_SORUMLULUK =
  "İlandaki hasar, tramer ve diğer beyanlar ilan sahibine aittir; fikape bunları kontrol etmez.";

export const TAKAS_SSS_BASLIK = "Sık sorulanlar";
export const TAKAS_SSS = [
  {
    q: "Başka birinin ilanına mesaj yazmak için ne gerekir?",
    a: "Herhangi bir aracınız için fotoğraflı bir yorum yazıp fotoğrafınız uygun bulunduğunda mesaj gönderebilirsiniz. Kendi ilanınızı açmak içinse şart, ilanı açacağınız araç için ayrıca aranır.",
  },
  {
    q: "Aynı anda kaç ilan açabilirim?",
    a: "Her araç için bir aktif ilan açabilirsiniz. Günlük ilan açma sayısı sınırlıdır; sınıra ulaşırsanız ertesi gün tekrar deneyebilirsiniz.",
  },
  {
    q: "İlanım ne kadar süre yayında kalır?",
    a: "İlanınız siz kapatana ya da inceleme sonucunda kapatılana kadar yayında kalır. İsterseniz “İlanı yenile” ile listede üst sıraya taşıyabilirsiniz; yenileme için son yenilemeden en az 48 saat geçmesi gerekir.",
  },
  {
    q: "Fark tutarı nasıl ödenir?",
    a: "Fark tutarı ve ödeme yöntemi tamamen taraflar arasında, platform dışında görüşülür.",
  },
  {
    q: "Fotoğrafım reddedilirse ne olur?",
    a: "Yorumunuza aracın genel görünümünü gösteren yeni bir fotoğraf yükleyebilirsiniz. Durumu Garajım sayfasından görebilirsiniz.",
  },
  {
    q: "İlan açtıktan sonra yorumumu silersem ilanım ne olur?",
    a: "Yayındaki ilanınız yayında kalır. Ancak ilanı kapatırsanız, yeniden açmak ya da yeni ilan vermek için fotoğraf şartının yeniden sağlanması gerekir.",
  },
] as const;
