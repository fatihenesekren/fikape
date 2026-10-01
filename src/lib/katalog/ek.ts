// Admin onaylı araçların (veritabanı) statik kataloğa canlı eklenmesi — Prisma'ya bağımlı DEĞİL
// (istemci ve sunucu ortak). Statik katalog (public/katalog/*.json) açılışta olduğu gibi okunur;
// onaylı ürünlerden çıkan kayıtlar üstüne birleştirilir, böylece yeni bir araç onaylanır onaylanmaz
// başka kullanıcılara da seçenek olarak çıkar (deploy gerekmez).
import type {
  KatalogKategori, KatalogMarkaDosyasi, KatalogModel, KatalogNesil, KatalogTip, KatalogVites, KatalogYakit,
} from "./tipler";
import { baseNameplate, stripModelGenRange } from "../modelDisplay";

export const EK_YIL_MIN = 1900;
export const ekYilGecerli = (y: number, bugun = new Date().getFullYear()) =>
  Number.isInteger(y) && y >= EK_YIL_MIN && y <= bugun + 1;

const YAKITLAR: KatalogYakit[] = ["GASOLINE", "DIESEL", "HYBRID", "PHEV", "EV", "LPG"];
const VITESLER: KatalogVites[] = ["Manuel", "Otomatik", "CVT", "Yarı Otomatik"];
export const STANDART = "Standart";
const DIGER = "Diğer";

/** Aksan, büyük/küçük harf ve noktalamaya duyarsız karşılaştırma anahtarı ("C-Elysée" = "c elysee"). */
export function adAnahtar(s: string): string {
  return s
    .replace(/İ/g, "I").replace(/ı/g, "i")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** Sözcük sırasından bağımsız anahtar: "sDrive16d 1.5" = "1.5 sDrive16d". */
export function sozcukAnahtar(s: string): string {
  return s
    .replace(/İ/g, "I").replace(/ı/g, "i")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .toUpperCase()
    .split(/[^A-Z0-9.]+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

const MOTOR_ISARETI = /^\d|\b(TDI|TSI|TFSI|FSI|HDI|BLUEHDI|CDI|DCI|CRDI|T-GDI|GDI|MULTIJET|JTD|VTEC|PHEV|HEV|EV|KW|KWH|TURBO|HYBRID)\b/i;

/** Product.trimName ("1.6 T-GDI 2WD – GT Line Premium") → versiyon + paket. */
export function trimParcala(trimName: string | null | undefined): { v: string; p: string | null } {
  const t = (trimName ?? "").trim();
  if (!t) return { v: "", p: null };
  const bolumler = t.split(/\s+[–—-]\s+/);
  if (bolumler.length > 1) {
    const p = bolumler.slice(1).join(" – ").trim();
    return { v: bolumler[0].trim(), p: !p || adAnahtar(p) === adAnahtar(STANDART) ? null : p };
  }
  if (MOTOR_ISARETI.test(t)) return { v: t, p: null };
  return { v: "", p: adAnahtar(t) === adAnahtar(STANDART) ? null : t };
}

const sozcukler = (s: string) => sozcukAnahtar(s).split(" ").filter(Boolean);
const altKume = (a: string[], b: string[]) => a.every((x) => b.includes(x));

/** Ek tip, statik tiple "aynı araç" mı? Statikte olmayan/boş alanlar (vites, yakıt, versiyon) uyumlu sayılır. */
function ayniTip(x: KatalogTip, t: KatalogTip): boolean {
  const vOk = !t.v || !x.v || sozcukAnahtar(x.v) === sozcukAnahtar(t.v) || adAnahtar(x.v) === adAnahtar(t.v) ||
    altKume(sozcukler(t.v), sozcukler(x.v)) || altKume(sozcukler(x.v), sozcukler(t.v));
  const pa = sozcukAnahtar(x.p ?? ""), pb = sozcukAnahtar(t.p ?? "");
  const pOk = pa === pb || (!!pa && !!pb && (pa.startsWith(pb) || pb.startsWith(pa)));
  const fOk = !x.f || !t.f || x.f === t.f;
  const tOk = !x.t || !t.t || x.t === t.t;
  const hpOk = x.hp == null || t.hp == null || x.hp === t.hp;
  return vOk && pOk && fOk && tOk && hpOk;
}

export interface EkUrun {
  modelAd: string;
  year: number | null;
  trimName: string | null;
  fuelType: string | null;
  transmission: string | null;
  powerHp: number | null;
}

export interface EkModelVeri { ad: string; tipler: KatalogTip[] }
export interface EkMarkaVeri { marka: string; modeller: EkModelVeri[] }

/** Onaylı ürün satırlarını model bazında KatalogTip'e (e: true) çevirir. */
export function urunlerdenEk(marka: string, urunler: EkUrun[]): EkMarkaVeri {
  const modeller = new Map<string, EkModelVeri>();
  for (const u of urunler) {
    const ad = u.modelAd.trim();
    if (!ad) continue;
    const { v, p } = trimParcala(u.trimName);
    const f = YAKITLAR.includes(u.fuelType as KatalogYakit) ? (u.fuelType as KatalogYakit) : null;
    const t = VITESLER.includes(u.transmission as KatalogVites) ? (u.transmission as KatalogVites) : null;
    const y = u.year !== null && ekYilGecerli(u.year) ? [u.year] : [];
    const m = modeller.get(ad) ?? { ad, tipler: [] };
    const anahtar = (x: KatalogTip) => JSON.stringify([sozcukAnahtar(x.v), sozcukAnahtar(x.p ?? ""), x.f, x.t]);
    const yeni: KatalogTip = { v, hp: u.powerHp, p, k: null, y, f, t, e: true };
    const var_ = m.tipler.find((x) => anahtar(x) === anahtar(yeni));
    if (var_) var_.y = [...new Set([...var_.y, ...y])].sort((a, b) => a - b);
    else m.tipler.push(yeni);
    modeller.set(ad, m);
  }
  return { marka, modeller: [...modeller.values()] };
}

function modelEslestir(modeller: KatalogModel[], ad: string): KatalogModel | null {
  const tam = adAnahtar(ad);
  const adaylar: ((m: KatalogModel) => boolean)[] = [
    (m) => adAnahtar(m.ad) === tam,
    (m) => m.nesiller.some((n) => adAnahtar(n.ad) === tam),
    (m) => adAnahtar(stripModelGenRange(m.ad)) === adAnahtar(stripModelGenRange(ad)),
    // Yalnız nesil bilgisi olan modellerde ("Clio 4" ↔ "Clio"): aksi halde "Sealion 6" gibi ayrı bir model,
    // sondaki rakam atıldığı için "Sealion 7"ye yanlış yazılırdı.
    (m) => m.nesiller.length > 0 && adAnahtar(baseNameplate(m.ad)) === adAnahtar(baseNameplate(ad)),
  ];
  for (const f of adaylar) {
    const bulunan = modeller.filter(f);
    if (bulunan.length === 1) return bulunan[0];
    if (bulunan.length > 1) return null; // belirsiz: yanlış nesle yazmaktansa ayrı model göster
  }
  return null;
}

function elEkle(n: KatalogNesil, v: string, p: string | null) {
  const el = n.el;
  if (!el) return;
  const digerSonda = (l: string[]) => [...l.filter((x) => x !== DIGER), DIGER];
  if (v && !el.versiyonlar.some((x) => adAnahtar(x) === adAnahtar(v))) el.versiyonlar = digerSonda([...el.versiyonlar, v]);
  if (p && !el.paketler.some((x) => adAnahtar(x) === adAnahtar(p))) el.paketler = digerSonda([...el.paketler, p]);
  if (v && p && el.paketlerVersiyona) {
    const anahtar = el.versiyonlar.find((x) => adAnahtar(x) === adAnahtar(v)) ?? v;
    const mevcut = el.paketlerVersiyona[anahtar];
    if (mevcut && !mevcut.some((x) => adAnahtar(x) === adAnahtar(p))) el.paketlerVersiyona[anahtar] = digerSonda([...mevcut, p]);
  }
}

/** Statik marka dosyası + onaylı eklemeler → birleşik dosya (girdiler değiştirilmez). */
export function katalogBirlestir(
  dosya: KatalogMarkaDosyasi | null,
  ek: EkMarkaVeri,
  kategori: KatalogKategori,
  bugun = new Date().getFullYear(),
): KatalogMarkaDosyasi {
  const kopya: KatalogMarkaDosyasi = dosya
    ? (JSON.parse(JSON.stringify(dosya)) as KatalogMarkaDosyasi)
    : { marka: ek.marka, kategori, kaynak: "Kullanıcı eklemesi", modeller: [] };
  for (const em of ek.modeller) {
    let model = modelEslestir(kopya.modeller, em.ad);
    if (!model) {
      model = { ad: em.ad, nesiller: [], tipler: [] };
      kopya.modeller.push(model);
    }
    for (const t of em.tipler) {
      // Statikte aynı kombinasyon zaten o yılla varsa tekrar ekleme
      const ayni = model.tipler.find((x) => ayniTip(x, t));
      const eksikYillar = ayni ? t.y.filter((y) => !ayni.y.includes(y)) : t.y;
      if (ayni && eksikYillar.length === 0) continue;
      // Yeni yıl, statik tipin boş alanlarını devralır: formda "Standart · N HP" gibi kopya seçenek çıkmaz
      if (ayni && !ayni.e) model.tipler.push({ ...t, y: eksikYillar, v: t.v || ayni.v, f: t.f ?? ayni.f, t: t.t ?? ayni.t });
      else if (ayni) ayni.y = [...new Set([...ayni.y, ...t.y])].sort((a, b) => a - b);
      else model.tipler.push({ ...t });
      // Eski nesil modunda (resmi veri yok) da görünsün
      for (const n of model.nesiller) {
        if (n.el && t.y.some((y) => n.bas <= y && y <= (n.bit ?? bugun))) elEkle(n, t.v, t.p);
      }
    }
  }
  kopya.modeller.sort((a, b) => a.ad.localeCompare(b.ad, "tr", { numeric: true }));
  return kopya;
}

/** Marka listesi: statik markalara ek olarak veritabanında olup statikte olmayan markalar. */
export function markalariBirlestir(statik: string[], ek: string[]): string[] {
  const gorulen = new Set(statik.map(adAnahtar));
  const yeniler: string[] = [];
  for (const m of ek) {
    const k = adAnahtar(m);
    if (!k || gorulen.has(k)) continue;
    gorulen.add(k);
    yeniler.push(m);
  }
  return yeniler.sort((a, b) => a.localeCompare(b, "tr"));
}

// ─── Eski (vehicles.json) liste biçimi: e-scooter / e-bisiklet / karavan ──────────────────────────
export interface LegacyModel { name: string; versions: string[]; trims: string[]; trimsByVersion?: Record<string, string[]> }
export interface LegacyMake { make: string; models: LegacyModel[] }

const DIGER_MARKA = "Diğer / Bulamadım";

/** Eski liste + onaylı eklemeler. "Diğer" seçenekleri her listenin sonunda kalır. */
export function legacyBirlestir(makes: LegacyMake[], ek: EkMarkaVeri[]): LegacyMake[] {
  const sonaDiger = (l: string[]) => [...l.filter((x) => x !== DIGER), ...l.filter((x) => x === DIGER)];
  const kopya: LegacyMake[] = makes.map((m) => ({
    make: m.make,
    models: m.models.map((mo) => ({ ...mo, versions: [...mo.versions], trims: [...mo.trims], trimsByVersion: mo.trimsByVersion ? { ...mo.trimsByVersion } : undefined })),
  }));
  const ekle = (l: string[], v: string) => (v && !l.some((x) => adAnahtar(x) === adAnahtar(v)) ? sonaDiger([...l, v]) : l);
  for (const em of ek) {
    let make = kopya.find((m) => adAnahtar(m.make) === adAnahtar(em.marka));
    if (!make) {
      make = { make: em.marka, models: [{ name: DIGER, versions: [DIGER], trims: [DIGER] }] };
      const i = kopya.findIndex((m) => m.make === DIGER_MARKA);
      if (i >= 0) kopya.splice(i, 0, make); else kopya.push(make);
    }
    for (const mod of em.modeller) {
      // vehicles.json adları parantezli ("Turbo Vado (Trekking, 2019-)"); ürün adı parantezsiz → gövdeyle de eşle
      const govde = (s: string) => adAnahtar(s.replace(/\s*\([^)]*\)\s*$/, ""));
      let model = make.models.find((x) => adAnahtar(x.name) === adAnahtar(mod.ad));
      if (!model) {
        const g = govde(mod.ad);
        const adaylar = make.models.filter((x) => x.name !== DIGER && g.length >= 3 && (govde(x.name) === g || govde(x.name).startsWith(g) || g.startsWith(govde(x.name))));
        if (adaylar.length === 1 && govde(adaylar[0].name).length >= 3) model = adaylar[0];
      }
      if (!model) {
        model = { name: mod.ad, versions: [DIGER], trims: [DIGER] };
        const i = make.models.findIndex((x) => x.name === DIGER);
        if (i >= 0) make.models.splice(i, 0, model); else make.models.push(model);
      }
      for (const t of mod.tipler) {
        if (t.v) model.versions = ekle(model.versions, t.v);
        if (t.p) model.trims = ekle(model.trims, t.p);
        if (t.v && t.p) {
          const harita = (model.trimsByVersion ??= {});
          const anahtar = model.versions.find((x) => adAnahtar(x) === adAnahtar(t.v)) ?? t.v;
          if (harita[anahtar]) harita[anahtar] = ekle(harita[anahtar], t.p);
          else if (model.trimsByVersion && Object.keys(harita).length) harita[anahtar] = sonaDiger([t.p, DIGER]);
        }
      }
    }
  }
  return kopya;
}
