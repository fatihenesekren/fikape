import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from "crypto";

// Takas görüşmesindeki telefon paylaşımı için alan şifreleme (AES-256-GCM).
// - Anahtar IP kayıt anahtarından AYRI: PHONE_SHARE_KEY tanımlıysa ondan ("p1:" önekli), değilse AUTH_SECRET'tan
//   farklı bir tuzla türetilir ("a1:"). İki anahtar da çözülebilir kalır; PHONE_SHARE_KEY sonradan tanımlanırsa yeni
//   kayıtlar ona geçer, eskiler "a1:" öneki sayesinde çözülmeye devam eder.
// - AAD = "threadId:userId": bir satırın şifreli değeri başka satıra kopyalanırsa çözülmez.
// - Numara asla loglanmaz, ConsentLog'a ve Message.text'e yazılmaz.

const P1 = "p1:";
const A1 = "a1:";

function anahtar(onek: string): Buffer {
  if (onek === P1) {
    const k = process.env.PHONE_SHARE_KEY;
    if (!k) throw new Error("PHONE_SHARE_KEY tanımlı değil: p1 kayıt çözülemez");
    return scryptSync(k, "fikape-thread-phone-v1", 32);
  }
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET tanımlı değil");
  return scryptSync(s, "fikape-thread-phone-auth-v1", 32);
}

export function encryptPhone(e164: string, aad: string): string {
  const onek = process.env.PHONE_SHARE_KEY ? P1 : A1;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", anahtar(onek), iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const enc = Buffer.concat([cipher.update(e164, "utf8"), cipher.final()]);
  return onek + Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

export function decryptPhone(payload: string, aad: string): string {
  const onek = payload.startsWith(P1) ? P1 : payload.startsWith(A1) ? A1 : null;
  if (!onek) throw new Error("Bilinmeyen telefon şifreleme biçimi");
  const buf = Buffer.from(payload.slice(onek.length), "base64");
  const decipher = createDecipheriv("aes-256-gcm", anahtar(onek), buf.subarray(0, 12));
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

/**
 * Aynı numaranın çok hesapta kullanımını numarayı çözmeden saymak için anahtarlı özet (GCM her seferinde farklı çıktı verir).
 * PHONE_SHARE_KEY tanımlıysa özet o anahtarla (oturum imzasından AYRI) üretilir; tanımsızsa AUTH_SECRET (eski davranış).
 */
export function phoneHash(e164: string): string {
  const k = process.env.PHONE_SHARE_KEY;
  if (k) return createHmac("sha256", scryptSync(k, "fikape-thread-phone-hash-v1", 32)).update("thread-phone:" + e164).digest("hex");
  return legacyPhoneHash(e164);
}

/** PHONE_SHARE_KEY öncesi kayıtların özeti (AUTH_SECRET ile). Sayım sorgularında yeni özetle birlikte aranır. */
export function legacyPhoneHash(e164: string): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET tanımlı değil");
  return createHmac("sha256", s).update("thread-phone:" + e164).digest("hex");
}

/** Sayım sorgusu için aranacak özetler: güncel + (farklıysa) eski anahtarla üretilmiş kayıtlar. */
export function phoneHashAdaylari(e164: string): string[] {
  const guncel = phoneHash(e164);
  const eski = legacyPhoneHash(e164);
  return guncel === eski ? [guncel] : [guncel, eski];
}

export type NormalizedPhone = { e164: string; last2: string };

/** Türkiye cep numarasını normalleştirir (05xx, 5xx, +90, 0090, boşluk/tire/nokta/parantez). Geçersizse null. */
export function normalizeTrMobile(input: string): NormalizedPhone | null {
  let d = input.replace(/[\s\-.()]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0090")) d = d.slice(4);
  else if (d.startsWith("90") && d.length === 12) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  if (!/^5\d{9}$/.test(d)) return null;
  return { e164: "+90" + d, last2: d.slice(-2) };
}

/** Yalnız paylaşanın kendi ekranı için maskeli gösterim: "0 5•• ••• •• 12". */
export function maskedPhone(last2: string): string {
  return `0 5•• ••• •• ${last2}`;
}

/** Karşı tarafa gösterilen biçim: "0 5XX XXX XX XX". */
export function displayPhone(e164: string): string {
  const d = e164.replace(/^\+90/, "");
  return `0 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
}
