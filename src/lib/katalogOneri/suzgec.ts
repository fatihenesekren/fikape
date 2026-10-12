// Aday süzgeci: tekrar/ret elemesi, "katalogda var" etiketi, skor ve seçim. Saf fonksiyonlar (testli).
import { adAnahtar } from "@/lib/katalog/ek";
import type { AdayHam } from "./cikarim";

export const YENI_LIMIT = 3;
export const VAR_LIMIT = 3;

export interface EtiketliAday extends AdayHam {
  anahtar: string;
  skor: number;
  katalogdaVar: boolean;
  mevcutUrunId: number | null;
}

/** Aday kimliği: aksansız marka+model (aynı anahtar = aynı araç). */
export const adayAnahtari = (marka: string, model: string): string => adAnahtar(`${marka} ${model}`);

/** A kademesi B'den üstün; çıkış tarihi yakın/yıl güncel olan öne geçer. */
export function skorla(a: Pick<AdayHam, "kademe" | "yil" | "tarihNotu">, buYil: number): number {
  let s = a.kademe === "A" ? 20 : 10;
  if (a.yil != null && a.yil >= buYil) s += 5;
  if (a.yil != null && a.yil > buYil) s += 2;
  if (a.tarihNotu) s += 1;
  return s;
}

export interface MevcutBilgi {
  var: boolean;
  urunId: number | null;
}

/**
 * Ham adayları etiketler. `bilinenAnahtarlar` daha önce kaydedilmiş (önerildi / taslak / eklendi / reddedildi)
 * adaylardır; tekrar gösterilmez. `mevcutMu` katalogda var mı sorusunu çağırandan alır.
 */
export function etiketle(
  adaylar: AdayHam[],
  bilinenAnahtarlar: ReadonlySet<string>,
  mevcutMu: (a: AdayHam) => MevcutBilgi,
  buYil: number,
): EtiketliAday[] {
  const cikti: EtiketliAday[] = [];
  const gorulen = new Set<string>();
  for (const a of adaylar) {
    const anahtar = adayAnahtari(a.marka, a.model);
    if (!anahtar || gorulen.has(anahtar) || bilinenAnahtarlar.has(anahtar)) continue;
    gorulen.add(anahtar);
    const m = mevcutMu(a);
    cikti.push({ ...a, anahtar, skor: skorla(a, buYil), katalogdaVar: m.var, mevcutUrunId: m.urunId });
  }
  return cikti;
}

/**
 * Yeni adaylardan en iyi YENI_LIMIT, ayrıca "bilgi için" en iyi VAR_LIMIT katalogda-var adayı.
 * Var olanlar yeni kontenjanını işgal etmez.
 */
export function sec(adaylar: EtiketliAday[]): EtiketliAday[] {
  const sirala = (a: EtiketliAday, b: EtiketliAday) => b.skor - a.skor || a.anahtar.localeCompare(b.anahtar);
  const yeni = adaylar.filter((a) => !a.katalogdaVar).sort(sirala).slice(0, YENI_LIMIT);
  const var_ = adaylar.filter((a) => a.katalogdaVar).sort(sirala).slice(0, VAR_LIMIT);
  return [...yeni, ...var_];
}
