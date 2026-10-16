import { lookup } from "dns/promises";
import { isIP } from "net";

// Sunucunun, kullanıcı/yönetici tarafından verilen bir adrese istek atarken iç ağa (localhost, özel IP aralıkları,
// bulut metadata adresi) erişmesini engeller; yönlendirmeleri her adımda yeniden denetler, yanıtı boyutla sınırlar ve
// yalnız raster görsel türlerini kabul eder (SVG/HTML sunulmaz).

const IZINLI_TURLER = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_YONLENDIRME = 3;

function ozelIPv4Mi(a: number, b: number): boolean {
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

/** IPv6 metnini 8 adet 16 bitlik parçaya açar (noktalı IPv4 son ek ve "::" kısaltması dahil). Geçersizse null. */
function ipv6Parcalari(ip: string): number[] | null {
  let s = ip.toLowerCase();
  const bolge = s.indexOf("%");
  if (bolge >= 0) s = s.slice(0, bolge);
  const noktali = s.match(/^(.*:)(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (noktali) {
    const [, onek, a, b, c, d] = noktali;
    const o = [a, b, c, d].map(Number);
    if (o.some((n) => n > 255)) return null;
    s = `${onek}${((o[0] << 8) | o[1]).toString(16)}:${((o[2] << 8) | o[3]).toString(16)}`;
  }
  const iki = s.split("::");
  if (iki.length > 2) return null;
  const sol = iki[0] ? iki[0].split(":") : [];
  const sag = iki.length === 2 && iki[1] ? iki[1].split(":") : [];
  const eksik = 8 - sol.length - sag.length;
  if (iki.length === 1 ? sol.length !== 8 : eksik < 1) return null;
  const hepsi = iki.length === 1 ? sol : [...sol, ...Array(eksik).fill("0"), ...sag];
  const parcalar = hepsi.map((h) => (/^[0-9a-f]{1,4}$/.test(h) ? parseInt(h, 16) : NaN));
  return parcalar.some(Number.isNaN) ? null : parcalar;
}

/** IPv4/IPv6 adresi özel, yerel, link-local, CGNAT, çok noktaya yayın ya da ayrılmış aralıkta mı? */
export function ozelAdresMi(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return ozelIPv4Mi(a, b);
  }
  if (v === 6) {
    const p = ipv6Parcalari(ip);
    if (!p) return true; // ayrıştırılamayan biçim → güvensiz say
    const gom4 = (hi: number) => ozelIPv4Mi(hi >> 8, hi & 0xff);
    // ::/96 (belirsiz adres, ::1 ve IPv4-uyumlu) → hep güvensiz
    if (p.slice(0, 6).every((x) => x === 0)) return true;
    // ::ffff:0:0/96 IPv4-eşlenik: gömülü IPv4'e bak (nokta ya da onaltılık biçimde)
    if (p.slice(0, 5).every((x) => x === 0) && p[5] === 0xffff) return gom4(p[6]);
    // 64:ff9b::/96 NAT64 ve 64:ff9b:1::/48 yerel NAT64
    if (p[0] === 0x64 && p[1] === 0xff9b) {
      if (p[2] === 1) return true;
      if (p.slice(2, 6).every((x) => x === 0)) return gom4(p[6]);
      return false;
    }
    // 2002::/16 6to4: gömülü IPv4 (p[1], p[2])
    if (p[0] === 0x2002) return gom4(p[1]);
    if ((p[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((p[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (kullanımdan kalktı)
    if ((p[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 benzersiz yerel
    if ((p[0] & 0xff00) === 0xff00) return true; // ff00::/8 çok noktaya yayın
    if (p[0] === 0x2001 && (p[1] === 0 || p[1] === 0xdb8)) return true; // Teredo ve dokümantasyon
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
