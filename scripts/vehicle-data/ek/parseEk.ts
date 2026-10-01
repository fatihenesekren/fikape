// Kullanıcının paylaştığı marka katalog metinlerini (Fikape Araç Katalog\*_katalog.txt) ayrıştırır.
//
// Biçim: boş satır / "-----" ile ayrılmış bloklar. Her blokta önce kategori
// ("Otomobil" | "Arazi, SUV & Pickup"), sonra marka, sonra yol satırları (sayısız)
// ve yaprak satırlar ("Ad (adet)"). Yol, model → alt kırılımlar şeklinde bir ağaç kurar.
// Parantez içi sayı ilan adedidir (binlik nokta olabilir: "6.541"); katalog için
// anlamsızdır, atılır.
//
// Ağaç derinliğine göre yorum (modelin en derin dalına bakılır):
//   1 seviye → versiyon           (paketsiz)
//   2 seviye → versiyon → paket
//   3 seviye → kasa → versiyon → paket   (ör. Audi: A3 › A3 Sedan › 1.4 TFSI › Ambiente)
// Kasa adımı formda yok; kasa seviyesi yalnız yapı olarak atlanır.

export type EkKategori = "Otomobil" | "Arazi, SUV & Pickup";

export type Dugum = Map<string, Dugum>;

export interface EkModel {
  ad: string;
  kategori: EkKategori;
  /** versiyon → paketler. Paketi olmayan versiyonun kümesi boş kalır. */
  versiyonlar: Map<string, Set<string>>;
  /** Ağaçta kasa seviyesi bulundu (3 seviyeli model). */
  kasaSeviyesi: boolean;
  /** Ham ağaç: model altındaki yol (kasa/versiyon/paket kırılımları). */
  agac: Dugum;
}

export interface EkMarka {
  marka: string;
  kategoriler: Set<EkKategori>;
  modeller: Map<string, EkModel>;
  /** Ayrıştırılamayan / beklenmedik yapıdaki satırlar (rapora gider). */
  uyarilar: string[];
}

const YAPRAK = /^(.*\S)\s*\(([\d.]+)\)+$/; // "1.4 (3))" gibi fazladan kapanış parantezini de tolere eder
const AYRAC = /^-{5,}$/;

/**
 * Ağaç → versiyon → paketler. `kasaZorla`: birinci seviye kasa adıdır (ayar ile belirtilir);
 * bu durumda 2 seviyeli ağaçta versiyon yoktur, paketler "" versiyonu altına yazılır.
 */
export function versiyonlariCikar(agac: Dugum, kasaZorla = false): { versiyonlar: Map<string, Set<string>>; kasaSeviyesi: boolean; fazla: boolean } {
  const d = derinlik(agac);
  const versiyonlar = new Map<string, Set<string>>();
  const ekle = (v: string, paketler: Iterable<string>) => {
    const set = versiyonlar.get(v) ?? new Set<string>();
    for (const p of paketler) set.add(p);
    versiyonlar.set(v, set);
  };
  const kasa = kasaZorla || d === 3;
  if (d > 3) return { versiyonlar, kasaSeviyesi: false, fazla: true };
  if (kasa) {
    for (const k of agac.values()) {
      if (d === 3 || !kasaZorla) for (const [v, paketler] of k) ekle(v, paketler.keys());
      else ekle("", k.keys()); // kasa → paket (versiyon yok)
    }
  } else {
    for (const [v, paketler] of agac) ekle(v, paketler.keys());
  }
  return { versiyonlar, kasaSeviyesi: kasa, fazla: false };
}

const derinlik = (d: Dugum): number => (d.size ? 1 + Math.max(...[...d.values()].map(derinlik)) : 0);

export function parseEk(metin: string): EkMarka {
  const bloklar: string[][] = [[]];
  for (const ham of metin.replace(/^﻿/, "").split(/\r?\n/)) {
    const s = ham.trim();
    // Ayraç çizgisi de boş satır da yeni blok başlatır (bir model altındaki alt bloklar boş satırla ayrılıyor).
    if (!s || AYRAC.test(s)) bloklar.push([]);
    else {
      // Kaynakta iki blok arasındaki boş satır düşmüş olabilir: kategori satırı yeni blok başlatır.
      if ((s === "Otomobil" || s === "Arazi, SUV & Pickup") && bloklar[bloklar.length - 1].length) bloklar.push([]);
      bloklar[bloklar.length - 1].push(s);
    }
  }

  const sonuc: EkMarka = { marka: "", kategoriler: new Set(), modeller: new Map(), uyarilar: [] };
  const agaclar = new Map<string, { kategori: EkKategori; kok: Dugum }>();
  const modelAl = (ad: string, kategori: EkKategori) => {
    let m = agaclar.get(ad);
    if (!m) { m = { kategori, kok: new Map() }; agaclar.set(ad, m); }
    return m;
  };
  const cocuk = (d: Dugum, ad: string) => {
    let c = d.get(ad);
    if (!c) { c = new Map(); d.set(ad, c); }
    return c;
  };

  let sonSatirKategori: EkKategori | null = null;
  for (const satirlar of bloklar) {
    if (satirlar.length < 3) continue;
    let [kategori, marka, ...kalan] = satirlar as [EkKategori, string, ...string[]];
    // Kaynakta kategori satırı düşmüş blok ("Hyundai / Accent Era / …"): önceki bloğun kategorisi varsayılır.
    if ((kategori as string) === sonuc.marka && sonuc.marka && sonSatirKategori) {
      kalan = [marka, ...kalan];
      marka = kategori as string;
      kategori = sonSatirKategori;
      sonuc.uyarilar.push(`Kategori satırı eksik blok (önceki "${sonSatirKategori}" varsayıldı): ${marka} / ${kalan.slice(0, 3).join(" / ")}…`);
    }
    if (kategori !== "Otomobil" && kategori !== "Arazi, SUV & Pickup") {
      sonuc.uyarilar.push(`Tanınmayan kategori satırı: "${kategori}"`);
      continue;
    }
    if (!sonuc.marka) sonuc.marka = marka;
    else if (sonuc.marka !== marka) sonuc.uyarilar.push(`Dosyada farklı marka adı: "${marka}" (ilk: "${sonuc.marka}")`);
    sonuc.kategoriler.add(kategori);
    sonSatirKategori = kategori;

    const yol: string[] = [];
    const yapraklar: string[] = [];
    for (const s of kalan) {
      const m = s.match(YAPRAK);
      if (m) yapraklar.push(m[1].trim());
      else if (yapraklar.length) sonuc.uyarilar.push(`Yapraktan sonra yol satırı: "${s}" (${marka}/${yol.join("/")})`);
      else yol.push(s);
    }

    if (yol.length === 0) {
      for (const ad of yapraklar) modelAl(ad, kategori);
    } else {
      let d = modelAl(yol[0], kategori).kok;
      for (const adim of yol.slice(1)) d = cocuk(d, adim);
      for (const y of yapraklar) cocuk(d, y);
    }
  }

  for (const [ad, { kategori, kok }] of agaclar) {
    const { versiyonlar, kasaSeviyesi, fazla } = versiyonlariCikar(kok);
    if (fazla) sonuc.uyarilar.push(`${ad}: 4+ seviyeli yapı, işlenmedi`);
    sonuc.modeller.set(ad, { ad, kategori, versiyonlar, kasaSeviyesi, agac: kok });
  }
  return sonuc;
}
