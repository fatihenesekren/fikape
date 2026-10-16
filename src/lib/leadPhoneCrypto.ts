import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Sigorta/satış lead telefonları için alan şifreleme (AES-256-GCM, "l1:" önekli). Takas telefon paylaşımıyla (phoneShareCrypto)
// aynı ilke: DB yedeği/salt-okunur erişim sızsa bile numaralar düz metin okunmaz.
//
// Şifreli değer ~70 karakterdir; lead tablolarındaki phone kolonu VARCHAR(20) idi. Önce
// prisma/migrations/widen_lead_phone.sql çalıştırılmalı, SONRA LEAD_PHONE_ENCRYPTION=1 tanımlanmalıdır; aksi hâlde yazma
// düz metin olarak (eski davranış) sürer. Okuma her iki biçimi de çözer (öneksiz = eski düz metin kayıt).

const ONEK = "l1:";

function anahtar(): Buffer {
  const k = process.env.PHONE_SHARE_KEY || process.env.AUTH_SECRET;
  if (!k) throw new Error("PHONE_SHARE_KEY veya AUTH_SECRET tanımlı değil");
  return scryptSync(k, "fikape-lead-phone-v1", 32);
}

export function leadTelefonuSifrele(telefon: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", anahtar(), iv);
  const enc = Buffer.concat([cipher.update(telefon, "utf8"), cipher.final()]);
  return ONEK + Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

/** DB'ye yazılacak değer: LEAD_PHONE_ENCRYPTION=1 ise şifreli, değilse düz metin (kolon genişletilene kadar). */
export function leadTelefonuYaz(telefon: string): string {
  return process.env.LEAD_PHONE_ENCRYPTION === "1" ? leadTelefonuSifrele(telefon) : telefon;
}

/** DB'den okunan değeri çözer; öneksiz (eski) kayıtlar olduğu gibi döner. Çözülemezse yer tutucu. */
export function leadTelefonuCoz(deger: string): string {
  if (!deger.startsWith(ONEK)) return deger;
  try {
    const buf = Buffer.from(deger.slice(ONEK.length), "base64");
    const decipher = createDecipheriv("aes-256-gcm", anahtar(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    return "[çözülemedi]";
  }
}
