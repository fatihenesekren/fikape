// Türkçe küfür/hakaret listesi
const PROFANITY = [
  "orospu", "orospuçocuğu", "sikiş", "sikik", "götveren", "ibne",
  "oç", "oğlum oç", "piç", "bok ye", "bok gibi", "kahpe", "fahişe",
  "amk", "amına", "amcık", "göt", "götvur", "orospu evladı",
];
// Noktalı/noktasız "i" karışıklığını (klavye/evasion — "ıbne", "amina" gibi
// çapraz yazımlar) yakalayabilmek için liste de aynı foldTrI ile normalize
// edilip karşılaştırma bu haliyle yapılıyor (bkz. aşağıdaki foldTrI kullanımı).
const PROFANITY_NORM = PROFANITY.map((w) => w.replace(/ı/g, "i"));

// Spam pattern'ları
const SPAM_PATTERNS = [
  /(.)\1{9,}/,              // Aynı harf 10+ kez: "aaaaaaaaaa"
  /^[\s\W\d]+$/,           // Sadece boşluk/noktalama/rakam
  /https?:\/\//i,           // URL
  /www\./i,                 // URL
  /(.{1,10})\1{4,}/,       // Kısa tekrar bloğu: "aşk aşk aşk aşk aşk"
];

// Türk IBAN'ı: TR + 2 kontrol hanesi + 22 hane, boşluk/tire/nokta ile ayrılmış olabilir
const IBAN_PATTERN = /TR\d{2}([\s\-.]?\d{4}){5}[\s\-.]?\d{2}/i;

// Telefon numarası: 05XX XXX XX XX kalıbı, boşluk/tire/nokta/parantezle ayrılmış olabilir,
// başında opsiyonel +90/0090 ülke kodu. Takas mesajlarında kullanıcıları platform dışına
// (WhatsApp vb.) çekmeyi önlemek için — bkz. denetim raporu, telefon paylaşımı filtrelenmiyordu.
const PHONE_PATTERN = /(\+90|0090|0)?[\s\-.]?\(?5\d{2}\)?([\s\-.]?\d){7}/;

// E-posta adresi — bir araç yorumunda/takas mesajında meşru bir gereksinim değil,
// neredeyse her zaman platform dışına yönlendirme amaçlı. Çok düşük yanlış-pozitif.
const EMAIL_PATTERN = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i;

// Mesajlaşma/sosyal medya kısa alan adları — şemasız yazıldıklarında ("wa.me/905..",
// "t.me/kullanici", "instagram.com/..") mevcut URL kontrolüne (http/www) takılmıyorlar.
const MESSAGING_APP_URL_PATTERN =
  /\b(wa\.me|t\.me|telegram\.(me|org)|instagram\.com|instagr\.am|fb\.(com|me)|facebook\.com|m\.me)\b/i;

// "@kullaniciadi" — sosyal medya kolu paylaşımı. Harf/alt-çizgi ile BAŞLAYAN
// (rakamla değil — "@45.000 km" gibi meşru ilan metnini yakalamasın) ve en az
// 3 karakter olan token. Türkçe araç metinlerinde "@handle" nadir.
const CONTACT_HANDLE_PATTERN = /(^|\s)@[a-z_][a-z0-9._]{2,29}\b/i;

// Yalnızca "strict" modda (takas mesajlaşması) — uygulama adının anılması pratikte
// her zaman "platform dışına geçelim" demek. Yorum/Soru-Cevap gibi paylaşımlı
// bağlamlarda kapalı, çünkü "araçta Android Auto whatsapp desteği var" gibi
// meşru cümleleri de yakalar. Sonda \b YOK — "whatsapptan", "telegramdan" gibi
// Türkçe ekli hâlleri de yakalasın diye.
const MESSAGING_APP_NAME_PATTERN =
  /\b(whats?app|watsap|wpp|telegram|instagram)/i;

export type FilterRule =
  | "IBAN"
  | "PHONE"
  | "EMAIL"
  | "CONTACT_HANDLE"
  | "MESSAGING_APP"
  | "URL"
  | "PROFANITY"
  | "GIBBERISH";

export interface ValidationResult {
  ok: boolean;
  error: string | null;
  /** ok === false olduğunda hangi kuralın tetiklendiği (moderasyon izi için). */
  rule?: FilterRule;
}

export interface ContentCheckOptions {
  /** Takas mesajlaşması gibi 1-1 kapalı bağlamlarda ek kurallar (uygulama adı anımı). */
  strict?: boolean;
}

export function validateSummary(text: string): ValidationResult {
  const t = text.trim();

  if (!t) return err("Kısa özet zorunludur.");
  if (t.length < 20) return err(`En az 20 karakter yazın. (${t.length}/20)`);
  if (t.length > 500) return err("En fazla 500 karakter yazabilirsiniz.");

  return checkContent(t);
}

export function validateDetail(text: string): ValidationResult {
  const t = text.trim();

  if (!t) return ok(); // opsiyonel alan
  if (t.length < 50) return err(`Detaylı yorum en az 50 karakter olmalıdır. (${t.length}/50)`);

  return checkContent(t);
}

export function validateDetailShort(text: string): ValidationResult {
  const t = text.trim();

  if (!t) return ok();
  if (t.length < 20) return err(`En az 20 karakter yazın. (${t.length}/20)`);
  if (t.length > 500) return err("En fazla 500 karakter yazabilirsiniz.");

  return checkContent(t);
}

export function checkContent(t: string, opts: ContentCheckOptions = {}): ValidationResult {
  // IBAN / banka hesabı paylaşımı — jenerik spam mesajına düşmeden önce, özel mesajla reddet
  if (IBAN_PATTERN.test(t)) {
    return err("IBAN veya banka hesap bilgisi paylaşımına izin verilmemektedir.", "IBAN");
  }

  // Mesajlaşma/sosyal medya kısa linkleri (wa.me, t.me, instagram.com …) — telefon
  // kontrolünden ÖNCE, çünkü "wa.me/9053.." aksi halde PHONE'a düşer, oysa bu bir
  // site-dışı yönlendirme linki.
  if (MESSAGING_APP_URL_PATTERN.test(t)) {
    return err("Site dışı iletişim/sosyal medya bağlantısı paylaşımına izin verilmemektedir.", "MESSAGING_APP");
  }

  // Telefon numarası paylaşımı — kullanıcıları platform dışına (WhatsApp vb.) çekip
  // mesajlaşma korumasını (rapor/blok/moderasyon) atlatmayı önlemek için.
  if (PHONE_PATTERN.test(t)) {
    return err("Telefon numarası paylaşımına izin verilmemektedir.", "PHONE");
  }

  // E-posta adresi
  if (EMAIL_PATTERN.test(t)) {
    return err("E-posta adresi paylaşımına izin verilmemektedir.", "EMAIL");
  }

  // "@kullaniciadi" — sosyal medya kolu
  if (CONTACT_HANDLE_PATTERN.test(t)) {
    return err("Sosyal medya hesabı paylaşımına izin verilmemektedir.", "CONTACT_HANDLE");
  }

  // Strict (takas mesajlaşması): uygulama adının anılması
  if (opts.strict && MESSAGING_APP_NAME_PATTERN.test(t)) {
    return err("Görüşmeyi site dışına taşımak (WhatsApp/Telegram vb.) için yönlendirme yapılamaz.", "MESSAGING_APP");
  }

  // URL kontrolü
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(t)) {
      if (/https?:\/\//i.test(t) || /www\./i.test(t)) {
        return err("Link paylaşımına izin verilmemektedir.", "URL");
      }
      return err("Lütfen anlamlı bir metin yazınız.", "GIBBERISH");
    }
  }

  // Harf oranı — metnin en az %40'ı harf olmalı
  const letters = (t.match(/[a-züğışöçA-ZÜĞİŞÖÇ]/g) ?? []).length;
  if (t.length > 15 && letters / t.length < 0.4) {
    return err("Lütfen anlamlı bir metin yazınız.", "GIBBERISH");
  }

  // Küfür / hakaret kontrolü — boşluklu VE bitişik (ayraçla atlatmayı önlemek için) iki ayrı kontrol.
  // "İ"/"I"/"ı" (noktalı büyük, ASCII büyük, noktasız küçük) hepsi düz "i"ye katlanıyor:
  // - Büyük "İ" toLowerCase() ile göze görünmez bir birleşen nokta işaretine (U+0307) ayrışıp
  //   kelimeyi ikiye bölebiliyor (örn. "İbne" -> "i bne").
  // - ASCII "I" (Türkçe klavyesi olmayan kullanıcıların yazdığı harf, örn. "AMINA") ve gerçek
  //   noktasız "ı" (örn. evasion amaçlı "ıbne") aksi halde listeyle hiç eşleşmiyor.
  // PROFANITY_NORM de aynı katlamayla karşılaştırıldığı için "amına" gibi listedeki kelimeler
  // de bozulmadan yakalanmaya devam ediyor. NFD normalize BURADA kullanılmıyor — Türkçe
  // ç/ğ/ö/ş/ü harfleri de NFD'de temel harf+birleşen işarete ayrışıyor, bu da listedeki
  // aksanlı kelimelerle eşleşmeyi bozar.
  const lowerBase = t.replace(/[İIı]/g, "i").toLowerCase();
  const lowerSpaced = lowerBase.replace(/[^a-züğışöç\s]/gi, " ");
  const lowerCollapsed = lowerBase.replace(/[^a-züğışöç]/gi, "");
  for (const word of PROFANITY_NORM) {
    if (lowerSpaced.includes(word) || lowerCollapsed.includes(word)) {
      return err("Hakaret veya uygunsuz ifade tespit edildi.", "PROFANITY");
    }
  }

  return ok();
}

function ok(): ValidationResult  { return { ok: true,  error: null }; }
function err(e: string, rule?: FilterRule): ValidationResult { return { ok: false, error: e, rule }; }
