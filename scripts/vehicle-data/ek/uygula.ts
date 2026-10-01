// Kullanıcının paylaştığı marka kataloglarını (ek/kaynak/*.txt) mevcut katalogla
// KOPYA ÜRETMEDEN birleştirir. katalog.ts'in 2. adımından sonra çağrılır; yani
// katalog yeniden üretildiğinde bu katman da otomatik yeniden uygulanır.
//
// Kurallar:
//  - Mevcut katalogda karşılığı olan satır (TSB tipi ya da eski el seçeneği) eklenmez.
//  - Karşılığı yoksa: yılı bilinen bir nesle (el) eklenir; yıl belirlenemiyorsa
//    EKLENMEZ, "belirsiz" listesine yazılır (kullanıcı tek tek bakacak).
//  - Yazım farkı şüphesi (Levenshtein ≤ 1) olan paket adı eklenmez, belirsize yazılır.
//  - Paketi olmayan satıra "Standart" yazılır.
import type { KatalogModel, KatalogNesil, KatalogTip, KatalogVites, KatalogYakit } from "../../../src/lib/katalog/tipler";
const BUGUN_YIL = new Date().getFullYear();
import { versiyonlariCikar, type EkMarka } from "./parseEk";
import { fold as foldTr } from "../tsb/rules";

/** Büyük harf + aksan duyarsız (É → E, Ë → E): "C-Elysée" ile "C-Elysee" aynı anahtar olsun. */
const fold = (s: string) => foldTr(s.normalize("NFD").replace(/\p{Mn}/gu, ""));

export interface EkAyar {
  /** Versiyon adında paket adı da geçen kaynaklar (Minivan & Panelvan): "zaten var" yalnız tüm jetonlar mevcutta geçiyorsa. */
  siki?: boolean;
  /** atla'da yazılı olup yine de eklenmeyecek modeller (başka markada zaten var gibi). Diğer atla/yılsız modeller 1986-2026 ile eklenir. */
  atlaKal?: string[];
  /**
   * Kullanıcı modeli katalogdaki başka bir modele BAĞLANMAZ; kendi adıyla AYRI model açılır.
   * Üretim yılları takma'daki hedef modelden alınır (hedefin resmi liste/nesil yıl aralığı).
   */
  ayriModel?: string[];
  /** Kullanıcı modeli → { versiyon öneki → katalogdaki model }: "II 2.2 TD4" versiyonları "Freelander 2" modeline taşınır (önek atılır). */
  versiyonOnekModel?: Record<string, Record<string, string>>;
  /** Marka katalog yapısı kararı gerektiriyor: hiçbir satır işlenmez, neden belirsiz listesine yazılır. */
  atlaMarka?: string;
  /** Kullanıcı dosyasındaki marka adı katalogdakinden farklıysa katalogdaki ad (ör. "DS Automobiles" → "DS"). */
  marka?: string;
  /** "Arazi, SUV & Pickup" altında kamyonet kategorisine giren modeller (internetten doğrulanmış). */
  kamyonet?: string[];
  /** Kullanıcı model adı → katalogdaki model adı (ör. "Giulia Quadrifoglio" → "Giulia"). */
  takma?: Record<string, string>;
  /** Kullanıcı model adı → katalogdaki nesil adı (modelde birden fazla eski nesil varsa). */
  nesil?: Record<string, string>;
  /** Katalogda hiç olmayan model: nesil yılları (internetten doğrulandı). */
  yeniModel?: Record<string, { ad?: string; bas: number; bit: number | null; kaynak: string }>;
  /** Bu kullanıcı modeli işlenmez; neden belirsiz listesine yazılır. */
  atla?: Record<string, string>;
  /** Doğrulanmış yeni TSB-tipi satırlar (yıl + kaynak ile), model adı katalogdaki ad. */
  ekTipler?: { model: string; tip: KatalogTip; kaynak: string }[];
  /** Kullanıcının tek model gibi listelediği grup (ör. "RS" → RS 3, RS 4): çocuk → katalogdaki model adı. */
  grup?: Record<string, Record<string, string>>;
  /** Birinci seviyesi kasa adı olan modeller (ör. Audi A6 E-Tron › A6 E-Tron Avant › paketler): versiyon yoktur. */
  kasaSeviyesi?: string[];
  /** Kullanıcı modelinin paket adlarına eklenecek önek: resmi listede "Tiggo 7 Pro" ayrı model değil, "Tiggo 7" + "Pro Comfort" paketidir. */
  paketOnek?: Record<string, string>;
  /** Aynı anlama gelen jetonlar (ör. Alfa'da T = TB); karşılaştırmada ilkine çevrilir. */
  esanlam?: string[][];
  /** "versiyon" ya da "versiyon|paket" → vites (doğrulanmış). */
  vites?: Record<string, Record<string, KatalogVites>>;
  /** Model → versiyon → yakıt (kuralla çıkarılamayanlar için doğrulanmış). */
  yakit?: Record<string, Record<string, KatalogYakit>>;
}

export interface Belirsiz { marka: string; model: string; versiyon?: string; paket?: string; neden: string }
export interface EkSonuc {
  eklenen: string[];
  /** Kullanıcı model adı katalogdaki farklı bir modele eşlendi (kopya engelleme kararı) — rapora bilgi olarak yazılır. */
  eslesme: string[];
  zatenVar: number;
  belirsiz: Belirsiz[];
}

const STANDART = "Standart";
const DIGER = "Diğer";

let esanlamHarita = new Map<string, string>();
/** Sıkı kapsama (ayar.siki): satırın TÜM jetonları mevcut kayıtta geçmiyorsa "zaten var" sayılmaz; kısa yazım/aynı hacim tahmini yapılmaz. */
let sikiKapsama = false;
const KASA_JETONLARI = new Set(["CABRIO", "CABRIOLET", "COUPE", "HATCHBACK", "SEDAN", "SW", "ESTATE", "TOURING", "WAGON", "SPIDER", "ROADSTER", "CONVERTIBLE", "SUV", "MPV", "VAN"]);

/** Karşılaştırma jetonları: büyük harf, "+" → PLUS, "Twin Spark" → TS, ayardaki eş anlamlılar. */
function jeton(s: string): string[] {
  return fold(s)
    .replace(/\+/g, " PLUS ")
    .replace(/TWIN SPARK/g, "TS")
    .replace(/[^A-Z0-9.]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((j) => esanlamHarita.get(j) ?? j);
}
const anahtar = (s: string) => jeton(s).sort().join(" ");
const modelAnahtar = (s: string) => fold(s).replace(/\([^)]*\)/g, " ").replace(/[^A-Z0-9]/g, "");
const HP_JETON = /^\d{2,4}$/;
/** Versiyon anahtarı: beygir sayısı ve HP/CV/PS/BG eki atılır → "1.9 JTD 105" ile "1.9 JTD" aynı motor. */
const versiyonAnahtar = (s: string) =>
  // Sıkı modda sayılar atılmaz: "212 D" ile "208 D" farklı versiyonlardır (Minivan & Panelvan kaynağında sayı model kodudur).
  jeton(s).filter((j) => (sikiKapsama || !HP_JETON.test(j)) && !/^(HP|CV|PS|BG)$/.test(j)).sort().join(" ");

function levenshtein(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const yazimYakin = (a: string, b: string) => {
  const x = anahtar(a).replace(/ /g, ""), y = anahtar(b).replace(/ /g, "");
  return x !== y && Math.min(x.length, y.length) >= 6 && levenshtein(x, y) <= 1;
};

/** Yakıt kuralı: yalnızca motor kodu yakıtı tek anlamlı söylüyorsa (JTD = dizel gibi). */
const DIZEL_JETON = new Set(["JTD", "JTDM", "MULTIJET", "TDI", "DCI", "CRDI", "HDI", "BLUEHDI", "TD", "TDCI", "CDTI", "CDI", "DIESEL", "DIZEL"]);
const BENZIN_JETON = new Set(["TS", "JTS", "TB", "TBI", "TSI", "TFSI", "FSI", "TJET", "T-JET", "VVTI", "GDI", "TGDI", "BENZIN"]);
export function yakitKurali(versiyon: string): KatalogYakit | null {
  const j = jeton(versiyon.replace(/T-JET/gi, "TJET"));
  const d = j.some((x) => DIZEL_JETON.has(x)), b = j.some((x) => BENZIN_JETON.has(x));
  return d && !b ? "DIESEL" : b && !d ? "GASOLINE" : null;
}

type El = NonNullable<KatalogNesil["el"]>;
const disi = (liste: string[]) => liste.filter((x) => x !== DIGER);
const digerSonda = (liste: string[]) => [...disi(liste), DIGER];

/** Kullanıcı satırı: versiyon + paket (paketsiz → Standart). */
interface Satir { v: string; p: string }

function satirlar(model: string, versiyonlar: Map<string, Set<string>>, belirsiz: (b: Omit<Belirsiz, "marka" | "model">) => void): Satir[] {
  const out: Satir[] = [];
  for (const [v, paketler] of versiyonlar) {
    if (jeton(v).length && jeton(v).every((j) => KASA_JETONLARI.has(j))) {
      belirsiz({ versiyon: v, neden: "Kasa tipi (versiyon/paket değil) — formda kasa adımı kalktığı için eklenmedi" });
      continue;
    }
    if (jeton(v).some((j) => /^(II|III|IV)$/.test(j))) {
      belirsiz({ versiyon: v, neden: "Versiyon nesil işareti taşıyor (II/III/IV) — katalogdaki hangi nesil/modele ait olduğu belli değil" });
      continue;
    }
    if (!paketler.size) { out.push({ v, p: STANDART }); continue; }
    for (const p of paketler) {
      // Paket adı versiyonun ya da modelin kendisiyse: paketsiz demektir.
      if (anahtar(p) === anahtar(v) || modelAnahtar(p) === modelAnahtar(model)) { out.push({ v, p: STANDART }); continue; }
      if (yazimYakin(p, v) || yazimYakin(p, model)) {
        belirsiz({ versiyon: v, paket: p, neden: `Paket adı versiyon/model adının yazım varyantına benziyor ("${p}") — Standart mı, ayrı paket mi?` });
        continue;
      }
      out.push({ v, p });
    }
  }
  return out;
}

/** Satır, modelin mevcut TSB tiplerinden biriyle örtüşüyor mu? */
function tipleKapli(s: Satir, tipler: KatalogTip[]): boolean {
  const vJ = jeton(s.v);
  if (sikiKapsama) {
    const sJ = [...vJ, ...(s.p === STANDART ? [] : jeton(s.p))].filter((j) => !/^(HP|CV|PS|BG)$/.test(j));
    // Boşluk farkı ("350L" ↔ "350 L") jeton karşılaştırmasını bozar: bitişik yazılmış hâl de aynı sayılır.
    const bitisik = (x: string[]) => x.join("");
    const sB = bitisik(vJ.filter((j) => !/^(HP|CV|PS|BG)$/.test(j))) + bitisik(s.p === STANDART ? [] : jeton(s.p));
    return tipler.some((t) => {
      const tJ = new Set(jeton(`${t.v} ${t.p ?? ""} ${t.k ?? ""}`));
      if (sJ.every((j) => tJ.has(j))) return true;
      return sB.length > 0 && (bitisik(jeton(t.v)) + bitisik(jeton(t.p ?? ""))) === sB;
    });
  }
  const hacim = vJ.find((j) => /^\d\.\d/.test(j)) ?? null;
  const pJ = s.p === STANDART ? [] : jeton(s.p);
  return tipler.some((t) => {
    const tJ = new Set(jeton(`${t.v} ${t.p ?? ""} ${t.k ?? ""}`));
    const tHacim = jeton(t.v).find((j) => /^\d\.\d/.test(j)) ?? null;
    // Resmi satırda motor bilgisi hiç yoksa (v boş) versiyon çelişemez; yalnız paket karşılaştırılır.
    const versiyonTamam = hacim ? hacim === tHacim || (!tHacim && [...jetonKumesi(t.v)].every((j) => vJ.includes(j) || pJ.includes(j))) : vJ.every((j) => HP_JETON.test(j) || tJ.has(j));
    if (!versiyonTamam) return false;
    return pJ.every((j) => tJ.has(j));
  });
}

type Karar = { durum: "var" } | { durum: "ekle"; satir: Satir } | { durum: "belirsiz"; neden: string };

const jetonKumesi = (s: string) => new Set(jeton(s).filter((j) => !HP_JETON.test(j) && !/^(HP|CV|PS|BG)$/.test(j)));
const altKume = (a: Set<string>, b: Set<string>) => [...a].every((x) => b.has(x));
/** Motor kodu jetonları: bir paket bunlardan birini taşıyıp versiyonda yoksa farklı bir motor olabilir. */
const MOTOR_JETONLARI = new Set([...DIZEL_JETON, ...BENZIN_JETON, "V6", "V8", "V10", "V12"]);
/** Aynı motorun iki yazımı olabilen çiftler: birebir eşleşme yoksa "emin değilim" denir. */
const YAKIN_CIFTLER: [string, string][] = [["JTD", "JTDM"]];

/** Satır, eski nesil seçeneklerinde zaten var mı / eklenebilir mi / belirsiz mi? */
function elKarar(el: El, s: Satir): Karar {
  if (!s.v) return el.paketler.some((p) => anahtar(p) === anahtar(s.p)) ? { durum: "var" } : { durum: "ekle", satir: s };
  const mevcut = disi(el.versiyonlar);
  const sV = jetonKumesi(s.v);
  const sPaket = s.p === STANDART ? new Set<string>() : jetonKumesi(s.p);

  const hedefler = mevcut.filter((v) => versiyonAnahtar(v) === versiyonAnahtar(s.v));
  if (hedefler.length) {
    if (s.p === STANDART) return { durum: "var" };
    const pAnahtar = anahtar(s.p);
    const hepsiVar = hedefler.every((v) => (el.paketlerVersiyona?.[v] ?? el.paketler).some((p) => anahtar(p) === pAnahtar));
    return hepsiVar ? { durum: "var" } : { durum: "ekle", satir: s };
  }

  // Aynı motorun JTD/JTDM gibi yakın yazımı mevcutsa: aynı motor mu emin değiliz.
  for (const [a, b] of YAKIN_CIFTLER) {
    for (const [x, y] of [[a, b], [b, a]]) {
      if (!sV.has(x)) continue;
      const degisik = new Set([...sV].map((j) => (j === x ? y : j)));
      const yakin = mevcut.find((v) => versiyonAnahtar(v) === [...degisik].sort().join(" "));
      if (yakin) return { durum: "belirsiz", neden: `Mevcut "${yakin}" ile aynı motor olabilir (${x} / ${y} yazımı) — ayrı versiyon mu, aynı mı?` };
    }
  }

  // Kısa yazım: "1.9" ↔ "1.9 JTD 100" — tek aday varsa ona bağlanır, çok aday varsa belirsiz
  if (sikiKapsama) return { durum: "ekle", satir: s };
  const genis = mevcut.filter((v) => sV.size > 0 && altKume(sV, jetonKumesi(v)));
  if (genis.length === 1) {
    const aday = genis[0];
    const aJ = jetonKumesi(aday);
    if ([...sPaket].some((j) => MOTOR_JETONLARI.has(j) && !aJ.has(j))) {
      return { durum: "belirsiz", neden: `Paket adı farklı bir motor kodu taşıyor ("${s.p}"); mevcut "${aday}" ile aynı motor mu belli değil` };
    }
    // Hacim çelişkisi: "190 E" + "1.8" mevcut "190 E 2.3-16" ile aynı araç olamaz.
    const hacimler = (k: Set<string>) => new Set([...k].filter((j) => /^d.d/.test(j)));
    const sH = hacimler(new Set([...sV, ...sPaket])), aH = hacimler(aJ);
    if (sH.size && aH.size && [...sH].some((h) => !aH.has(h))) {
      return { durum: "belirsiz", neden: `Motor hacmi mevcut "${aday}" ile uyuşmuyor (${[...sH].join("/")}) — farklı versiyon olabilir, eklenmedi` };
    }
    if (s.p === STANDART) return { durum: "var" };
    const kalan = s.p.split(/\s+/).filter((w) => !altKume(jetonKumesi(w), aJ));
    return kalan.length ? { durum: "ekle", satir: { v: aday, p: kalan.join(" ") } } : { durum: "var" };
  }
  if (genis.length > 1) {
    return { durum: "belirsiz", neden: `Versiyon, mevcut versiyonların kısa yazımı olabilir (${genis.slice(0, 3).join(" / ")}) — hangisine ait olduğu belli değil` };
  }
  return { durum: "ekle", satir: s };
}

function elEkle(el: El, s: Satir): void {
  const hedefler = el.versiyonlar.filter((v) => v !== DIGER && versiyonAnahtar(v) === versiyonAnahtar(s.v));
  const pEkle = (liste: string[]) => (liste.some((p) => anahtar(p) === anahtar(s.p)) ? liste : digerSonda([...disi(liste), s.p]));
  if (!s.v) { el.paketler = pEkle(el.paketler); return; }
  if (!hedefler.length) {
    el.versiyonlar = digerSonda([...disi(el.versiyonlar), s.v]);
    el.paketlerVersiyona = { ...(el.paketlerVersiyona ?? {}), [s.v]: pEkle(["Diğer"]) };
    el.paketler = pEkle(el.paketler);
    return;
  }
  for (const v of hedefler) {
    const mevcut = el.paketlerVersiyona?.[v] ?? el.paketler;
    const yeni = pEkle(mevcut);
    if (yeni !== mevcut) el.paketlerVersiyona = { ...(el.paketlerVersiyona ?? {}), [v]: yeni };
  }
  el.paketler = pEkle(el.paketler);
}

/** Bilinen jetonlardan (mevcut katalog + kullanıcı listesi) birine 1 harf uzaklıkta ama kendisi bilinmeyen jeton → yazım hatası şüphesi. */
function yazimSupheli(r: Satir, model: KatalogModel | null, em: { versiyonlar: Map<string, Set<string>> }, kuresel: Set<string>): string | null {
  const bilinen = new Set<string>();
  const ekle = (x: string) => fold(x).split(/[^A-Z0-9]+/).forEach((j) => j && bilinen.add(j));
  if (model) {
    for (const t of model.tipler) { ekle(t.v); ekle(t.p ?? ""); }
    for (const n of model.nesiller) for (const v of n.el?.versiyonlar ?? []) ekle(v);
    for (const n of model.nesiller) for (const v of n.el?.paketler ?? []) ekle(v);
    ekle(model.ad);
  }
  const kullanici = new Map<string, number>();
  for (const [v, ps] of em.versiyonlar) for (const x of [v, ...ps]) fold(x).split(/[^A-Z0-9]+/).forEach((j) => j && kullanici.set(j, (kullanici.get(j) ?? 0) + 1));
  for (const j of kullanici.keys()) bilinen.add(j);
  const adaylar = fold(`${r.v} ${r.p}`).split(/[^A-Z0-9]+/).filter((j) => j.length >= 4 && !/\d/.test(j));
  for (const j of adaylar) {
    if (kuresel.has(j)) continue; // katalogda başka bir yerde geçen gerçek bir kelime (xDrive / eDrive gibi)
    const yakin = [...bilinen].find((k) => k !== j && k.length >= 4 && levenshtein(j, k) === 1 && (kullanici.get(j) ?? 0) <= (kullanici.get(k) ?? 1) && !(model?.tipler.some((t) => fold(`${t.v} ${t.p ?? ""}`).split(/[^A-Z0-9]+/).includes(j))));
    if (yakin) return `"${j}" yazımı "${yakin}" ile 1 harf farklı — yazım hatası olabilir`;
  }
  return null;
}

function nesilleriBul(model: KatalogModel): KatalogNesil[] {
  return model.nesiller.filter((n) => n.el);
}

/** Büyük/küçük harf, aksan ve boşluk duyarsız TAM ad ("A 110" = "A110"; "Tipo (1990-1995)" ≠ "Tipo (2015-)"; "206+" ≠ "206"). */
const tamAnahtar = (s: string) => fold(s).replace(/\s+/g, "");

/**
 * Kullanıcı model adına karşılık gelen katalog modeli. Aynı adlı birden fazla nesil modeli varsa
 * (ör. "Tipo (1990-1995)" ve "Tipo (2015-)") hangisi olduğu belli olmadığından liste döner.
 */
export function modeliBul(modeller: KatalogModel[], ad: string): KatalogModel | KatalogModel[] | null {
  const a = modelAnahtar(ad);
  const bolumler = (m: string) => m.split("/").map((x) => modelAnahtar(x)).filter(Boolean);
  const adimlar: ((m: KatalogModel) => boolean)[] = [
    (m) => tamAnahtar(m.ad) === tamAnahtar(ad),
    (m) => modelAnahtar(m.ad) === a,
    (m) => m.nesiller.some((n) => modelAnahtar(n.ad) === a),
    (m) => bolumler(m.ad).includes(a),
    (m) => m.nesiller.some((n) => bolumler(n.ad).includes(a)),
  ];
  for (const f of adimlar) {
    const adaylar = modeller.filter(f);
    if (adaylar.length === 1) return adaylar[0];
    if (adaylar.length > 1) return adaylar;
  }
  return null;
}

/** Aynı model adının farklı yazımlarını ("A 110" / "A110") tek modelde toplar; birleşenleri döndürür. */
export function modelleriTekillestir(modeller: KatalogModel[]): string[] {
  const notlar: string[] = [];
  const gruplar = new Map<string, KatalogModel[]>();
  for (const m of modeller) {
    const k = tamAnahtar(m.ad);
    gruplar.set(k, [...(gruplar.get(k) ?? []), m]);
  }
  for (const grup of gruplar.values()) {
    if (grup.length < 2) continue;
    // Nesil taşıyan model "asıl" olur; yoksa ilki.
    const asil = grup.find((m) => m.nesiller.length) ?? grup[0];
    for (const m of grup) {
      if (m === asil) continue;
      for (const t of m.tipler) {
        const key = JSON.stringify([t.v, t.hp, t.p, t.k, t.f, t.t]);
        const var_ = asil.tipler.find((x) => JSON.stringify([x.v, x.hp, x.p, x.k, x.f, x.t]) === key);
        if (var_) var_.y = [...new Set([...var_.y, ...t.y])].sort((a, b) => a - b);
        else asil.tipler.push(t);
      }
      asil.nesiller.push(...m.nesiller);
      modeller.splice(modeller.indexOf(m), 1);
      notlar.push(`"${m.ad}" → "${asil.ad}" (tek modelde birleşti)`);
    }
  }
  return notlar;
}

/** Tüm katalogdaki (her marka) paket/versiyon kelimeleri — yazım hatası şüphesinde "gerçek kelime" ayrımı için. */
export function kureselJetonlar(modellerListeleri: KatalogModel[][]): Set<string> {
  const set = new Set<string>();
  const ekle = (x: string | null) => fold(x ?? "").split(/[^A-Z0-9]+/).forEach((j) => j && set.add(j));
  for (const modeller of modellerListeleri) {
    for (const m of modeller) {
      for (const t of m.tipler) { ekle(t.v); ekle(t.p); }
      for (const n of m.nesiller) { n.el?.versiyonlar.forEach(ekle); n.el?.paketler.forEach(ekle); }
    }
  }
  return set;
}

const YILSIZ_BAS = 1986;
const YILSIZ_BIT = 2026;

/** Yıl bilgisi olmayan satırı yıl bağımsız (g) kayıt olarak ekler ve modelin tüm eski nesil seçeneklerine de yazar. */
function yilsizEkle(model: KatalogModel, s: Satir): void {
  const yillar = Array.from({ length: YILSIZ_BIT - YILSIZ_BAS + 1 }, (_, i) => YILSIZ_BAS + i);
  const p = s.p === STANDART ? null : s.p;
  const var_ = model.tipler.find((t) => t.g && anahtar(t.v) === anahtar(s.v) && anahtar(t.p ?? "") === anahtar(p ?? ""));
  if (!var_) model.tipler.push({ v: s.v, hp: null, p, k: null, y: yillar, f: yakitKurali(s.v), t: null, g: true });
  for (const n of model.nesiller) if (n.el && elKarar(n.el, s).durum === "ekle") elEkle(n.el, s);
}

export function ekUygula(marka: string, ek: EkMarka, ayar: EkAyar, modeller: KatalogModel[], kuresel: Set<string> = new Set()): EkSonuc {
  const sonuc: EkSonuc = { eklenen: [], eslesme: [], zatenVar: 0, belirsiz: [] };
  esanlamHarita = new Map();
  sikiKapsama = ayar.siki === true;
  for (const grup of ayar.esanlam ?? []) for (const j of grup.slice(1)) esanlamHarita.set(fold(j), fold(grup[0]));
  const bel = (model: string) => (b: Omit<Belirsiz, "marka" | "model">) => sonuc.belirsiz.push({ marka, model, ...b });

  for (const w of ek.uyarilar) sonuc.belirsiz.push({ marka, model: "-", neden: `Kaynak dosya yapısı: ${w}` });

  const ekModeller = new Map(ek.modeller);
  for (const [g, cocuklar] of Object.entries(ayar.grup ?? {})) {
    const gm = ekModeller.get(g);
    if (!gm) continue;
    ekModeller.delete(g);
    for (const hedef of Object.values(cocuklar)) {
      ekModeller.set(hedef, { ad: hedef, kategori: gm.kategori, versiyonlar: new Map(), kasaSeviyesi: false, agac: new Map() });
    }
  }
  for (const [kullaniciModel, onekler] of Object.entries(ayar.versiyonOnekModel ?? {})) {
    const m = ekModeller.get(kullaniciModel);
    if (!m) continue;
    for (const [onek, hedef] of Object.entries(onekler)) {
      const tasinan = new Map<string, Set<string>>();
      for (const [v, paketler] of [...m.versiyonlar]) {
        if (!(v === onek || v.startsWith(onek + " "))) continue;
        const yeniV = v.slice(onek.length).trim();
        m.versiyonlar.delete(v);
        tasinan.set(yeniV, new Set([...paketler].map((p) => (anahtar(p) === anahtar(v) ? yeniV : p))));
      }
      if (tasinan.size) {
        const var_ = ekModeller.get(hedef);
        if (var_) for (const [v, ps] of tasinan) var_.versiyonlar.set(v, new Set([...(var_.versiyonlar.get(v) ?? []), ...ps]));
        else ekModeller.set(hedef, { ad: hedef, kategori: m.kategori, versiyonlar: tasinan, kasaSeviyesi: false, agac: new Map() });
      }
    }
  }
  for (const ad of ayar.kasaSeviyesi ?? []) {
    const m = ekModeller.get(ad);
    if (m) ekModeller.set(ad, { ...m, versiyonlar: versiyonlariCikar(m.agac, true).versiyonlar });
  }

  for (const [kullaniciModel, em] of ekModeller) {
    const b = bel(kullaniciModel);
    if (ayar.atla?.[kullaniciModel] && ayar.atlaKal?.includes(kullaniciModel)) { b({ neden: ayar.atla[kullaniciModel] }); continue; }
    const hedefAd = ayar.takma?.[kullaniciModel] ?? kullaniciModel;
    const ayri = ayar.ayriModel?.includes(kullaniciModel) ?? false;
    let bulgu: KatalogModel | KatalogModel[] | null;
    if (ayri) {
      bulgu = modeller.find((m) => tamAnahtar(m.ad) === tamAnahtar(kullaniciModel)) ?? null;
      if (!bulgu) {
        const h = modeliBul(modeller, hedefAd);
        const hh = h && !Array.isArray(h) ? h : null;
        const yillar = hh ? [...hh.tipler.flatMap((t) => t.y), ...hh.nesiller.flatMap((n) => [n.bas, n.bit ?? BUGUN_YIL])] : [YILSIZ_BAS, BUGUN_YIL];
        const bas = Math.min(...yillar), bit = Math.max(...yillar);
        const yeniAd = kullaniciModel;
        bulgu = { ad: yeniAd, nesiller: [{ ad: yeniAd, bas, bit: bit >= BUGUN_YIL ? null : bit, el: { versiyonlar: [DIGER], paketler: [STANDART, DIGER] } }], tipler: [] };
        modeller.push(bulgu);
        sonuc.eklenen.push(`Yeni model (ayrı): ${yeniAd} (${bas}–${bit >= BUGUN_YIL ? "" : bit}) — yıl aralığı ${hh ? `"${hh.ad}" modelinden alındı` : "hedef bulunamadığı için 1986-2026"}`);
      }
    } else bulgu = modeliBul(modeller, hedefAd);
    if (Array.isArray(bulgu)) {
      // Aynı adlı birden fazla nesil modeli: satırın hangisine ait olduğu bilinmediğinden hepsine yıl bağımsız eklenir.
      for (const [v, paketler] of em.versiyonlar) {
        for (const p of paketler.size ? paketler : [STANDART]) {
          for (const m of bulgu) yilsizEkle(m, { v, p });
          sonuc.eklenen.push(`${bulgu.map((m) => m.ad).join(" + ")} › ${v} › ${p} (nesil belli değil → 1986-2026)`);
        }
      }
      continue;
    }
    let model = bulgu;
    if (!ayri && model && modelAnahtar(model.ad) !== modelAnahtar(kullaniciModel) && !(ayar.grup && Object.values(ayar.grup).some((g) => Object.values(g).includes(kullaniciModel)))) {
      sonuc.eslesme.push(`"${kullaniciModel}" → "${model.ad}"`);
    }
    const onek = ayri ? undefined : ayar.paketOnek?.[kullaniciModel];
    const rows = satirlar(kullaniciModel, em.versiyonlar, b).map((r) => (onek && r.p !== STANDART ? { ...r, p: `${onek} ${r.p}` } : r)).filter((r) => {
      const uyum = yazimSupheli(r, model, em, kuresel);
      if (uyum) { b({ versiyon: r.v, paket: r.p, neden: uyum }); return false; }
      return true;
    });

    if (!model) {
      const yeni = ayar.yeniModel?.[kullaniciModel] ?? ayar.yeniModel?.[hedefAd];
      // Yıl doğrulanamayan model: kullanıcı kararıyla 1986-2026 arası seçilebilir.
      const y = yeni ?? { bas: YILSIZ_BAS, bit: null, kaynak: "kaynakta/internette yıl yok — kullanıcı kararıyla 1986-2026 arası seçilebilir" };
      const ad = y.ad ?? kullaniciModel;
      model = { ad, nesiller: [{ ad, bas: y.bas, bit: y.bit, el: { versiyonlar: [DIGER], paketler: [STANDART, DIGER] } }], tipler: [] };
      modeller.push(model);
      sonuc.eklenen.push(`Yeni model: ${ad} (${y.bas}–${y.bit ?? ""}) — ${y.kaynak}`);
    }

    const elNesiller = nesilleriBul(model);
    const secili = ayar.nesil?.[kullaniciModel]
      ? elNesiller.filter((n) => n.ad === ayar.nesil![kullaniciModel])
      : elNesiller;
    // Resmi listede (2012+) tipi olan modelde, nesil 2012'de bitmiyorsa eski seçenekler yalnız 2012 öncesi yılları
    // doldurur; yıl bilgisi olmayan satırın hangi döneme ait olduğu bilinemez → belirsiz.
    const yilKesin = (n: KatalogNesil) => !model!.tipler.some((t) => !t.g) || (n.bit !== null && n.bit < 2012);

    for (const s of rows) {
      if (!sikiKapsama && (anahtar(s.v) === anahtar(model.ad) || modelAnahtar(s.v) === modelAnahtar(kullaniciModel))) { sonuc.zatenVar++; continue; }
      // Sıkı modda yalnız resmi kayıtlarla karşılaştırılır: aynı çalıştırmada eklenen yıl-bağımsız (g) kayıtlar
      // başka bir kaynak satırını "zaten var" diye gizlemesin.
      const kapsayanTipler = sikiKapsama ? model.tipler.filter((t) => !t.g) : model.tipler;
      if (model.tipler.some((t) => !t.g) && tipleKapli(s, kapsayanTipler)) { sonuc.zatenVar++; continue; }

      // Birden fazla eski nesil varsa satırın motoru yalnız birinde geçiyorsa o nesil seçilir.
      let nesil: KatalogNesil | null = secili.length === 1 ? secili[0] : null;
      if (!nesil && secili.length > 1) {
        const eslesen = secili.filter((n) => elKarar(n.el!, s).durum !== "ekle" || n.el!.versiyonlar.some((v) => v !== DIGER && versiyonAnahtar(v) === versiyonAnahtar(s.v)));
        const hepsiVar = eslesen.length > 0 && eslesen.every((n) => elKarar(n.el!, s).durum === "var");
        if (hepsiVar) { sonuc.zatenVar++; continue; }
        if (eslesen.length === 1) nesil = eslesen[0];
        else nesil = null;
      }
      if (!nesil || !yilKesin(nesil)) {
        // Kaynakta yıl yok: 1986-2026 arası seçilebilir (yıl bağımsız kayıt).
        yilsizEkle(model, s);
        sonuc.eklenen.push(`${model.ad} › ${s.v} › ${s.p} (yıl bilgisi yok → 1986-2026)`);
        continue;
      }
      nesil.el = nesil.el!;
      const karar = elKarar(nesil.el, s);
      if (karar.durum === "var") { sonuc.zatenVar++; continue; }
      if (karar.durum === "belirsiz") { b({ versiyon: s.v, paket: s.p, neden: karar.neden }); continue; }
      elEkle(nesil.el, karar.satir);
      sonuc.eklenen.push(`${model.ad} › ${karar.satir.v} › ${karar.satir.p}`);
    }
  }

  // Doğrulanmış, yıllı ek tipler (TSB'de olmayan ama internetten doğrulanan)
  for (const { model: ad, tip, kaynak } of ayar.ekTipler ?? []) {
    const mb = modeliBul(modeller, ad);
    const m = Array.isArray(mb) ? null : mb;
    if (!m) { sonuc.belirsiz.push({ marka, model: ad, neden: "ekTipler: model bulunamadı" }); continue; }
    const key = JSON.stringify([tip.v, tip.hp, tip.p, tip.k, tip.f, tip.t]);
    const var_ = m.tipler.find((x) => JSON.stringify([x.v, x.hp, x.p, x.k, x.f, x.t]) === key);
    if (var_) { var_.y = [...new Set([...var_.y, ...tip.y])].sort((a, b) => a - b); sonuc.zatenVar++; continue; }
    m.tipler.push(tip);
    sonuc.eklenen.push(`${m.ad} › ${tip.v} ${tip.p ?? ""} (${tip.y.join(",")}) — ${kaynak}`);
  }

  // Yakıt / vites: eski nesil seçenekleri için (kural + doğrulanmış ayar)
  for (const m of modeller) {
    for (const n of m.nesiller) {
      if (!n.el) continue;
      const yakit: Record<string, KatalogYakit> = { ...(n.el.yakit ?? {}) };
      for (const v of disi(n.el.versiyonlar)) {
        const ayarli = ayar.yakit?.[m.ad]?.[v];
        const f = ayarli ?? yakitKurali(v);
        if (f) yakit[v] = f;
      }
      if (Object.keys(yakit).length) n.el.yakit = yakit;
      const vites = ayar.vites?.[m.ad];
      if (vites) n.el.vites = { ...(n.el.vites ?? {}), ...vites };
    }
  }
  return sonuc;
}
