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

export interface ValidationResult {
  ok: boolean;
  error: string | null;
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

export function checkContent(t: string): ValidationResult {
  // IBAN / banka hesabı paylaşımı — jenerik spam mesajına düşmeden önce, özel mesajla reddet
  if (IBAN_PATTERN.test(t)) {
    return err("IBAN veya banka hesap bilgisi paylaşımına izin verilmemektedir.");
  }

  // URL kontrolü
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(t)) {
      if (/https?:\/\//i.test(t) || /www\./i.test(t)) {
        return err("Link paylaşımına izin verilmemektedir.");
      }
      return err("Lütfen anlamlı bir metin yazınız.");
    }
  }

  // Harf oranı — metnin en az %40'ı harf olmalı
  const letters = (t.match(/[a-züğışöçA-ZÜĞİŞÖÇ]/g) ?? []).length;
  if (t.length > 15 && letters / t.length < 0.4) {
    return err("Lütfen anlamlı bir metin yazınız.");
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
      return err("Hakaret veya uygunsuz ifade tespit edildi.");
    }
  }

  return ok();
}

function ok(): ValidationResult  { return { ok: true,  error: null }; }
function err(e: string): ValidationResult { return { ok: false, error: e }; }
