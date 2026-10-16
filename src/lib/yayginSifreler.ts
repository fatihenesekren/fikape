// Karmaşıklık kuralını (büyük/küçük harf, rakam, özel karakter) sağlayıp yine de tahmini kolay parolaları ("Password1!", "Qwerty123!",
// "Fikape2026!") reddetmek için küçük, bakımı kolay bir kara liste. Rakam ve özel karakterler atılıp küçük harfe çevrilen "taban" ile eşleşir.
const YAYGIN_TABANLAR = [
  "password", "passw0rd", "parola", "sifre", "qwerty", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbn", "azerty", "admin", "administrator",
  "welcome", "letmein", "iloveyou", "sevgilim", "benimsifrem", "merhaba", "selam", "fikape", "kullanici", "deneme", "test", "temp",
  "istanbul", "ankara", "izmir", "turkiye", "galatasaray", "fenerbahce", "besiktas", "trabzonspor", "football", "monkey", "dragon",
  "master", "shadow", "superman", "batman", "sunshine", "princess", "football", "abc", "abcdef", "aaaaaa", "ilovey",
];

function taban(parola: string): string {
  return parola.toLocaleLowerCase("tr-TR").replace(/[^a-zçğıöşü]/g, "");
}

/** Parola yaygın/tahmini kolay bir kalıp mı? (taban kara listedeki bir kelimeyle aynı ya da uzun bir kelimeyle başlıyor) */
export function yayginSifreMi(parola: string): boolean {
  const t = taban(parola);
  if (t.length === 0) return true; // yalnız rakam/özel karakter
  // aynı harfin tekrarı ("aaaaaaA1!")
  if (new Set(t).size === 1) return true;
  return YAYGIN_TABANLAR.some((k) => t === k || (k.length >= 6 && t.startsWith(k)));
}
