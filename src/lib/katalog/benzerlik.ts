// Admin onayında "benzer / yakın yazım" uyarıları — Prisma'ya bağımlı değil.
import { adAnahtar } from "./ek";
import { stripModelGenRange } from "../modelDisplay";

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export interface BenzerSonuc {
  /** Aksan/boşluk/büyük-küçük harf farkı dışında aynı ad (ör. "Citroën" ↔ "Citroen") */
  ayni: string[];
  /** 1-2 harf farklı yakın yazımlar */
  yakin: string[];
}

/** `ad`'a aynı/yakın adlar. Kısa adlarda (≤3 harf) yakınlık aranmaz (yanlış alarm olur). */
export function benzerAdlar(ad: string, adaylar: string[], maxUzaklik = 2, adNormal = (s: string) => s): BenzerSonuc {
  const k = adAnahtar(adNormal(ad));
  const ayni: string[] = [];
  const yakin: string[] = [];
  const gordu = new Set<string>();
  const hedef = adNormal(ad).trim();
  // Girilen ad listede birebir varsa (nesil aralığı farkı hariç) uyarı vermeye gerek yok: "Ioniq 5" yazan kullanıcıya
  // "Ioniq 6 benzer" demek yanlış alarm olur.
  if (adaylar.some((a) => adNormal(a).trim() === hedef)) return { ayni: [], yakin: [] };
  const rakam = (s: string) => s.replace(/\D/g, "");
  for (const aday of adaylar) {
    const ak = adAnahtar(adNormal(aday));
    if (!ak || gordu.has(ak)) continue;
    gordu.add(ak);
    if (ak === k) { ayni.push(aday); continue; }
    // Rakam farkı (Ioniq 5 ↔ 6, 1.5 TSI ↔ 1.0 TSI) yazım hatası değil, farklı üründür
    if (rakam(k) !== rakam(ak)) continue;
    if (k.length >= 4 && ak.length >= 4 && Math.abs(k.length - ak.length) <= maxUzaklik && levenshtein(k, ak) <= maxUzaklik) yakin.push(aday);
  }
  return { ayni, yakin: yakin.slice(0, 5) };
}

export interface BenzerGirdi {
  brand: string; model: string; trim: string | null;
  markalar: string[]; modeller: string[]; trimler: string[];
}

/** Moderatör için okunur uyarı cümleleri (boşsa sorun yok). */
export function benzerUyarilar(g: BenzerGirdi): string[] {
  const out: string[] = [];
  // Marka adları kısa: 1 harf farkı + en az 5 harf (yoksa "Honda" ↔ "Coda" gibi sahte alarmlar çıkar)
  const m = benzerAdlar(g.brand, g.markalar, g.brand.length >= 5 ? 1 : 0);
  if (m.ayni.length) out.push(`Marka katalogda "${m.ayni[0]}" olarak kayıtlı (yazım farkı) — o yazımı kullanın.`);
  else if (m.yakin.length) out.push(`Benzer marka var: ${m.yakin.map((x) => `"${x}"`).join(", ")} — yazım hatası olabilir.`);
  const mo = benzerAdlar(g.model, g.modeller, 2, stripModelGenRange);
  if (mo.ayni.length) out.push(`Model katalogda "${mo.ayni[0]}" olarak kayıtlı (yazım farkı).`);
  else if (mo.yakin.length) out.push(`Benzer model var: ${mo.yakin.map((x) => `"${x}"`).join(", ")} — yazım hatası olabilir.`);
  if (g.trim) {
    const t = benzerAdlar(g.trim, g.trimler);
    if (t.ayni.length) out.push(`Donanım/versiyon "${t.ayni[0]}" olarak kayıtlı (yazım farkı).`);
    else if (t.yakin.length) out.push(`Benzer donanım/versiyon var: ${t.yakin.map((x) => `"${x}"`).join(", ")}.`);
  }
  return out;
}
