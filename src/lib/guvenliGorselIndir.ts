import { lookup } from "dns/promises";
import { isIP } from "net";

// Sunucunun, kullanıcı/yönetici tarafından verilen bir adrese istek atarken iç ağa (localhost, özel IP aralıkları,
// bulut metadata adresi) erişmesini engeller; yönlendirmeleri her adımda yeniden denetler, yanıtı boyutla sınırlar ve
// yalnız raster görsel türlerini kabul eder (SVG/HTML sunulmaz).

const IZINLI_TURLER = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_YONLENDIRME = 3;

/** IPv4/IPv6 adresi özel, yerel, link-local, CGNAT, çok noktaya yayın ya da ayrılmış aralıkta mı? */
export function ozelAdresMi(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (v === 6) {
    const s = ip.toLowerCase();
    if (s === "::" || s === "::1") return true;
    if (s.startsWith("fe8") || s.startsWith("fe9") || s.startsWith("fea") || s.startsWith("feb")) return true; // fe80::/10
    if (s.startsWith("fc") || s.startsWith("fd")) return true; // fc00::/7
    const eslenik = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
    if (eslenik) return ozelAdresMi(eslenik[1]);
    return false;
  }
  return true; // tanınmayan biçim → güvensiz say
}

async function hedefGuvenliMi(url: URL): Promise<boolean> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return false;
  if (isIP(host)) return !ozelAdresMi(host);
  try {
    const adresler = await lookup(host, { all: true });
    return adresler.length > 0 && adresler.every((a) => !ozelAdresMi(a.address));
  } catch {
    return false;
  }
}

export class GorselIndirmeHatasi extends Error {
  constructor(public readonly kod: "gecersiz-adres" | "guvensiz-hedef" | "yanit-yok" | "gorsel-degil" | "cok-buyuk" | "zaman-asimi", mesaj: string) {
    super(mesaj);
  }
}

/** Güvenli indirme: ham baytlar + içerik türü. Hata durumunda GorselIndirmeHatasi fırlatır. */
export async function guvenliGorselIndir(
  adres: string,
  { maxBayt = 10 * 1024 * 1024, zamanAsimiMs = 10_000 }: { maxBayt?: number; zamanAsimiMs?: number } = {},
): Promise<{ buffer: Buffer; contentType: string }> {
  let hedef: URL;
  try {
    hedef = new URL(adres);
  } catch {
    throw new GorselIndirmeHatasi("gecersiz-adres", "Geçersiz URL.");
  }
  const sinyal = AbortSignal.timeout(zamanAsimiMs);

  for (let adim = 0; adim <= MAX_YONLENDIRME; adim++) {
    if (!(await hedefGuvenliMi(hedef))) throw new GorselIndirmeHatasi("guvensiz-hedef", "Bu adrese erişilemez.");
    let res: Response;
    try {
      res = await fetch(hedef, { redirect: "manual", signal: sinyal, headers: { "User-Agent": "fikape-image-fetch/1.0" } });
    } catch (e) {
      if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) throw new GorselIndirmeHatasi("zaman-asimi", "Kaynak zamanında yanıt vermedi.");
      throw new GorselIndirmeHatasi("yanit-yok", "Kaynak yanıt vermedi.");
    }
    if (res.status >= 300 && res.status < 400) {
      const konum = res.headers.get("location");
      if (!konum) throw new GorselIndirmeHatasi("yanit-yok", "Yönlendirme adresi yok.");
      try {
        hedef = new URL(konum, hedef);
      } catch {
        throw new GorselIndirmeHatasi("gecersiz-adres", "Geçersiz yönlendirme adresi.");
      }
      continue;
    }
    if (!res.ok || !res.body) throw new GorselIndirmeHatasi("yanit-yok", `Kaynak yanıt vermedi (${res.status}).`);

    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!IZINLI_TURLER.includes(contentType)) throw new GorselIndirmeHatasi("gorsel-degil", "Kaynak desteklenen bir görsel değil.");
    if (Number(res.headers.get("content-length") ?? 0) > maxBayt) throw new GorselIndirmeHatasi("cok-buyuk", "Görsel çok büyük.");

    // Gövdeyi akışla oku, sınırı aşarsa kes (content-length yalan söyleyebilir)
    const parcalar: Uint8Array[] = [];
    let toplam = 0;
    const okuyucu = res.body.getReader();
    for (;;) {
      const { done, value } = await okuyucu.read();
      if (done) break;
      toplam += value.byteLength;
      if (toplam > maxBayt) {
        await okuyucu.cancel();
        throw new GorselIndirmeHatasi("cok-buyuk", "Görsel çok büyük.");
      }
      parcalar.push(value);
    }
    return { buffer: Buffer.concat(parcalar), contentType };
  }
  throw new GorselIndirmeHatasi("yanit-yok", "Çok fazla yönlendirme.");
}
