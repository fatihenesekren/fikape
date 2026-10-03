/**
 * TSB taslağını (build.ts çıktısı) eski el yapımı katalogla birleştirip Araç
 * Öner'in okuduğu dosyaları üretir.
 *
 * Çalıştır: npx tsx scripts/vehicle-data/tsb/katalog.ts   (önce build.ts)
 *
 * Çıktılar:
 *   public/katalog/<kategori>/<marka-slug>.json  — form marka seçilince indirir
 *   src/data/katalogIndex.json                   — marka/model adları (ilk açılış + ön-doldurma)
 *   scripts/vehicle-data/_inceleme/birlestirme.md — eşleme raporu (gözden geçirmek için)
 *
 * Eski katalogdan yalnızca şunlar alınır:
 *   - nesil adı + yıl aralığı ("Clio 5 (2019-)") → DB'deki mevcut model adlarıyla uyum
 *   - 2012 öncesi yıllar için versiyon/paket seçenekleri (TSB 2012'den başlıyor)
 *   - TSB'de hiç olmayan markalar/modeller (klasikler, TSB'ye girmemiş modeller)
 * Yıl aralığı olmayan eski bir model TSB'de karşılığı varsa ATILIR (TSB kapsıyor).
 */
import fs from "fs";
import path from "path";
import { slugify } from "../../../src/lib/slugify";
import type {
  KatalogIndex, KatalogKategori, KatalogMarkaDosyasi, KatalogModel, KatalogNesil, KatalogTip,
} from "../../../src/lib/katalog/tipler";
import type { KatalogTip as TsbTip } from "./build";
import type { MotoKatalogTip } from "./motoBuild";
import { fold } from "./rules";
import { cekisTekrarsizEkle } from "./cekisTekrarsizEkle";
import { parseEk } from "../ek/parseEk";
import { ekUygula, kureselJetonlar, modeliBul, modelleriTekillestir, type Belirsiz, type EkAyar } from "../ek/uygula";

const root = process.cwd();

/**
 * Sitede Türkçe olmayan harf/simge görünmesin: é/ë/ó… → e/o…, "N°4" → "N4", "›" → boşluk.
 * (Türkçe harfler — ç ğ ı ö ş ü â î û — korunur. Slug zaten aksansız üretilir.)
 */
const YABANCI: Record<string, string> = {
  é: "e", è: "e", ê: "e", ë: "e", É: "E", È: "E", Ê: "E", Ë: "E", á: "a", à: "a", ä: "a", Á: "A", À: "A", Ä: "A",
  ó: "o", ò: "o", ô: "o", õ: "o", Ó: "O", Ò: "O", Ô: "O", ú: "u", ù: "u", Ú: "U", Ù: "U", í: "i", ì: "i", ï: "i",
  Í: "I", Ì: "I", Ï: "I", ñ: "n", Ñ: "N", ø: "o", Ø: "O", å: "a", Å: "A", ß: "ss", "°": "", "³": "3", "›": " ", "‹": " ",
};
const turkceHarfler = (metin: string) => [...metin].map((c) => YABANCI[c] ?? c).join("");
const incele = path.join(root, "scripts", "vehicle-data", "_inceleme");
const tsb = JSON.parse(fs.readFileSync(path.join(incele, "tsb-katalog.json"), "utf8")) as {
  baslik: string;
  katalog: Record<"otomobil" | "kamyonet", Record<string, Record<string, { model: string; tipler: TsbTip[] }>>>;
};
const tsbMoto = JSON.parse(fs.readFileSync(path.join(incele, "tsb-moto-katalog.json"), "utf8")) as {
  baslik: string;
  katalog: Record<string, Record<string, { model: string; tipler: MotoKatalogTip[] }>>;
};
type EskiModel = { name: string; versions: string[]; trims: string[]; trimsByVersion?: Record<string, string[]> };
const eski = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "vehicles.json"), "utf8")) as Record<
  string,
  { make: string; models: EskiModel[] }[]
>;

const KATEGORILER: KatalogKategori[] = ["otomobil", "kamyonet", "motosiklet"];
/** Bir modelin "diğer kategoride de var mı?" çapraz kontrolü yalnız oto/kamyonet arasında anlamlı (ör. Transit Connect). */
const CAPRAZ_KATEGORI: Partial<Record<KatalogKategori, KatalogKategori>> = { otomobil: "kamyonet", kamyonet: "otomobil" };
const DIGER_MARKA = "Diğer / Bulamadım";
const TSB_ILK_YIL = 2012;

/**
 * Eski katalog adı ile TSB model adı farklı yazılan modeller (parantezsiz eski ad → TSB modeli).
 * `kanit` verilmişse eşleme ancak TSB modelinde o kanıtı taşıyan bir tip varsa uygulanır
 * (ör. "Kona Electric" yalnız TSB Kona'da gerçekten elektrikli tip varsa Kona'ya bağlanır).
 * Kanıt yoksa eski kayıt olduğu gibi kalır — bilgiye dayalı tahminle kayıt atılmaz.
 */
type Esleme = { hedef: string; kanit?: (t: KatalogTip) => boolean };
const icerir = (re: RegExp) => (t: KatalogTip) => re.test(`${t.v} ${t.p ?? ""} ${t.k ?? ""}`);
const ESKI_ESLEME: Record<string, Record<string, Esleme>> = {
  Fiat: { "Egea Wagon": { hedef: "Egea", kanit: icerir(/Station Wagon|Cross Wagon|\bSW\b/i) } },
  Hyundai: {
    "Accent Blue": { hedef: "Accent", kanit: icerir(/\bBlue\b/i) },
    "Kona Electric": { hedef: "Kona", kanit: (t) => t.f === "EV" },
    "i30 N": { hedef: "i30", kanit: icerir(/\bN\b/) },
  },
  Kia: { "Niro EV": { hedef: "Niro", kanit: (t) => t.f === "EV" } },
  MG: { "ZS EV": { hedef: "ZS", kanit: (t) => t.f === "EV" }, "HS PHEV": { hedef: "HS", kanit: (t) => t.f === "PHEV" } },
  Mitsubishi: { "Outlander PHEV": { hedef: "Outlander", kanit: (t) => t.f === "PHEV" } },
  Toyota: {
    "RAV4 PHEV": { hedef: "RAV4", kanit: (t) => t.f === "PHEV" },
    "Land Cruiser Prado": { hedef: "Land Cruiser", kanit: icerir(/Prado/i) },
  },
  Volvo: { "C40 Recharge": { hedef: "C40" } }, // C40 yalnız elektrikli; TSB modeli zaten EV
  Volkswagen: { "Golf GTI": { hedef: "Golf", kanit: icerir(/\bGTI\b/i) } },
  Opel: {
    "Astra Sports Tourer": { hedef: "Astra", kanit: icerir(/Sports Tourer/i) },
    "Combo Life": { hedef: "Combo", kanit: icerir(/Life/i) },
  },
};
// Eğik çizgili çift adlar ("Symbol / Thalia", "Optima / Magentis"): ilk ad denenir — kural, bilgi değil.
const ciftAd = (ad: string) => (ad.includes("/") ? ad.split("/")[0].trim() : null);

// ─── Ad eşleme ────────────────────────────────────────────────────────────
const anahtar = (s: string) => fold(s).replace(/[^A-Z0-9]/g, "");

/** Eski model adından eşleşme adayları: "X5 F15 (2014-2018)" → ["X5 F15", "X5"]. */
function adaylar(ad: string): string[] {
  let s = ad.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  const out = [s];
  for (let i = 0; i < 3; i++) {
    // Sondaki nesil/şasi eki: E90, W205, G22/G26, T5, VII, 4, K
    const m = s.match(/^(.*\S)\s+([A-Z]{1,2}\d{1,3}(?:\/[A-Z]{0,2}\d{1,3})*|[IVX]{1,4}|\d{1,2}|[A-Z])$/);
    if (!m || m[1].length < 2 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(m[1])) break;
    s = m[1].trim();
    out.push(s);
  }
  return out;
}

function yilAraligi(ad: string): { bas: number; bit: number | null } | null {
  const m = ad.match(/(\d{4})\s*[-–—]\s*(\d{4})?\s*\)/);
  return m ? { bas: Number(m[1]), bit: m[2] ? Number(m[2]) : null } : null;
}

// ─── TSB tiplerini form biçimine çevir (aynı kombinasyonları birleştir) ─────
function tipleriCevir(tipler: TsbTip[]): KatalogTip[] {
  const map = new Map<string, KatalogTip>();
  for (const t of tipler) {
    const tip: KatalogTip = {
      v: cekisTekrarsizEkle(t.motor, t.cekis),
      hp: t.hp, p: t.paket, k: t.kasa, y: [], f: t.yakit, t: t.vitesTuru,
    };
    const key = JSON.stringify([tip.v, tip.hp, tip.p, tip.k, tip.f, tip.t]);
    const hedef = map.get(key) ?? tip;
    hedef.y = [...new Set([...hedef.y, ...t.yillar])].sort((a, b) => a - b);
    map.set(key, hedef);
  }
  return [...map.values()];
}

const elSecenek = (em: EskiModel): NonNullable<KatalogNesil["el"]> => ({
  versiyonlar: em.versions,
  paketler: em.trims,
  ...(em.trimsByVersion ? { paketlerVersiyona: em.trimsByVersion } : {}),
});

/** Motosiklet tipini (model/motor ayrımı yok) forma çevirir — v/p/k/hp/t hep boş, tek tip. */
function motoTipleriCevir(tipler: MotoKatalogTip[]): KatalogTip[] {
  const yillar = [...new Set(tipler.flatMap((t) => t.yillar))].sort((a, b) => a - b);
  const yakitlar = new Set(tipler.map((t) => t.yakit));
  return [{ v: "", hp: null, p: null, k: null, y: yillar, f: yakitlar.size === 1 ? [...yakitlar][0] : null, t: null }];
}

// ─── 1) TSB modelleri ─────────────────────────────────────────────────────
type MarkaDurum = { marka: string; modeller: KatalogModel[]; tsbVar: boolean; not: Record<string, string[]> };
const durum: Record<KatalogKategori, Map<string, MarkaDurum>> = { otomobil: new Map(), kamyonet: new Map(), motosiklet: new Map() };
const markaAl = (kat: KatalogKategori, ad: string) => {
  const k = anahtar(ad);
  let d = durum[kat].get(k);
  if (!d) { d = { marka: ad, modeller: [], tsbVar: false, not: { eslesen: [], atilan: [], tek: [] } }; durum[kat].set(k, d); }
  return d;
};
for (const kat of ["otomobil", "kamyonet"] as const) {
  for (const [marka, modeller] of Object.entries(tsb.katalog[kat])) {
    const d = markaAl(kat, marka);
    d.tsbVar = true;
    for (const m of Object.values(modeller)) d.modeller.push({ ad: m.model, nesiller: [], tipler: tipleriCevir(m.tipler) });
  }
}
for (const [marka, modeller] of Object.entries(tsbMoto.katalog)) {
  const d = markaAl("motosiklet", marka);
  d.tsbVar = true;
  for (const m of Object.values(modeller)) d.modeller.push({ ad: m.model, nesiller: [], tipler: motoTipleriCevir(m.tipler) });
}

// ─── 1.5) Resmi listede yanlış kategori/model adıyla gelen kayıtlar ─────────────
// (ör. "KAMYONET HFC 1035K" otomobilde "Kamyonet" modeli, Transit varyantları otomobilde parçalı model).
const KATEGORI_DUZELTME: { marka: string; model: string; hedef: string; yeniAd?: string; paketiVersiyonaCevir?: boolean }[] = [
  { marka: "JAC", model: "Kamyonet", hedef: "kamyonet", yeniAd: "HFC 1035K", paketiVersiyonaCevir: true },
  { marka: "DFM", model: "Panelvan", hedef: "kamyonet" },
  // sahibinden.com: Chrysler › Voyager / Grand Voyager / Town & Country hepsi "Minivan & Panelvan" altında (kullanıcı görselleri) — üçü de kamyonet.
  { marka: "Chrysler", model: "Grand Voyager", hedef: "kamyonet" },
  { marka: "Ford", model: "Tra.Mca", hedef: "kamyonet", yeniAd: "Transit" },
  { marka: "Ford", model: "Tran.", hedef: "kamyonet", yeniAd: "Transit" },
  { marka: "Ford", model: "TRANSITKAMYONETCIFTK.470ELD170TRENDKASALIE6.1", hedef: "kamyonet", yeniAd: "Transit" },
];
for (const dz of KATEGORI_DUZELTME) {
  const kaynak = durum.otomobil.get(anahtar(dz.marka));
  const idx = kaynak?.modeller.findIndex((m) => m.ad === dz.model) ?? -1;
  if (!kaynak || idx < 0) continue;
  const [m] = kaynak.modeller.splice(idx, 1);
  const hedefMarka = markaAl(dz.hedef as KatalogKategori, dz.marka);
  const ad = dz.yeniAd ?? m.ad;
  if (dz.paketiVersiyonaCevir) for (const tp of m.tipler) { if (tp.p) tp.v = tp.p; tp.p = null; }
  const var_ = hedefMarka.modeller.find((x) => x.ad === ad);
  if (var_) var_.tipler.push(...m.tipler);
  else hedefMarka.modeller.push({ ...m, ad });
}

// ─── 2) Eski katalog: nesil olarak bağla, atla ya da tek başına ekle ────────
const sayac = { nesil: 0, atilan: 0, tek: 0 };
for (const kat of KATEGORILER) {
  const digerKat: KatalogKategori = CAPRAZ_KATEGORI[kat] ?? kat; // çapraz kategori yoksa kendine düşer (zararsız, no-op)
  for (const em of eski[kat] ?? []) {
    if (em.make === DIGER_MARKA) continue;
    const mAnahtar = anahtar(em.make);
    const buKat = markaAl(kat, durum[kat].get(mAnahtar)?.marka ?? em.make);
    const digerMarka = durum[digerKat].get(mAnahtar);
    const esleme = ESKI_ESLEME[em.make] ?? {};

    const bul = (d: MarkaDurum | undefined, ad: string): KatalogModel | null => {
      if (!d?.tsbVar) return null;
      const temiz = adaylar(ad)[0];
      const e = esleme[temiz];
      if (e) {
        const hedef = d.modeller.find((m) => m.tipler.length && m.ad === e.hedef);
        return hedef && (!e.kanit || hedef.tipler.some(e.kanit)) ? hedef : null;
      }
      const cift = ciftAd(ad.replace(/\([^)]*\)/g, " "));
      for (const aday of cift ? [...adaylar(ad), ...adaylar(cift)] : adaylar(ad)) {
        const a = anahtar(aday);
        const hit = d.modeller.find((m) => m.tipler.length && (anahtar(m.ad) === a || anahtar(m.ad) === mAnahtar + a));
        if (hit) return hit;
      }
      return null;
    };

    for (const m of em.models) {
      if (m.name === "Diğer") continue;
      // Eski motosiklet kataloğunda birkaç ATV/quad kaydı yanlışlıkla motosiklet
      // sayılmış (bkz. TSB tarafında aynı kural) — burada da eleniyor.
      if (kat === "motosiklet" && /\bATV|\bQUAD|\bUTV|4X4/i.test(m.name)) continue;
      const aralik = yilAraligi(m.name);
      const hedef = bul(buKat, m.name) ?? bul(digerMarka, m.name);
      const hedefKat = hedef && buKat.modeller.includes(hedef) ? kat : digerKat;

      if (hedef && aralik) {
        hedef.nesiller.push({
          ad: m.name, bas: aralik.bas, bit: aralik.bit,
          ...(aralik.bas < TSB_ILK_YIL ? { el: elSecenek(m) } : {}),
        });
        buKat.not.eslesen.push(`${m.name} → ${hedefKat === kat ? "" : `${hedefKat}/`}${hedef.ad}`);
        sayac.nesil++;
      } else if (hedef) {
        buKat.not.atilan.push(`${m.name} (→ ${hedefKat === kat ? "" : `${hedefKat}/`}${hedef.ad})`);
        sayac.atilan++;
      } else {
        buKat.modeller.push({
          ad: m.name,
          nesiller: [{ ad: m.name, bas: aralik?.bas ?? 1990, bit: aralik?.bit ?? null, el: elSecenek(m) }],
          tipler: [],
        });
        buKat.not.tek.push(m.name + (aralik ? "" : " [yılsız]"));
        sayac.tek++;
      }
    }
  }
}

// ─── 2.5) Kullanıcı katalogları (scripts/vehicle-data/ek) ──────────────────
// Marka başına paylaşılan olgun katalog metni; mevcut katalogla kopyasız birleşir.
// Belirsiz kalanlar ek/belirsiz/<marka>.json + ek/rapor/<marka>.md dosyalarına yazılır.
const ekKok = path.join(root, "scripts", "vehicle-data", "ek");
const ekRapor: string[] = [];
const tekillesenler: string[] = [];
const kuresel = kureselJetonlar(KATEGORILER.flatMap((k) => [...durum[k].values()].map((d) => d.modeller)));
if (fs.existsSync(path.join(ekKok, "kaynak"))) {
  for (const dosya of fs.readdirSync(path.join(ekKok, "kaynak")).filter((f) => f.endsWith(".txt")).sort()) {
    const ek = parseEk(fs.readFileSync(path.join(ekKok, "kaynak", dosya), "utf8"));
    if (!ek.marka) continue;
    const slug = slugify(ek.marka);
    const ayarYol = path.join(ekKok, "ayar", slug + ".json");
    const ayar = (fs.existsSync(ayarYol) ? JSON.parse(fs.readFileSync(ayarYol, "utf8")) : {}) as EkAyar;
    const belirsiz: Belirsiz[] = [];
    if (ayar.atlaMarka) {
      fs.mkdirSync(path.join(ekKok, "belirsiz"), { recursive: true });
      fs.mkdirSync(path.join(ekKok, "rapor"), { recursive: true });
      fs.writeFileSync(path.join(ekKok, "belirsiz", slug + ".json"), JSON.stringify([{ marka: ek.marka, model: "(tüm marka)", neden: ayar.atlaMarka }], null, 2) + "\n");
      fs.writeFileSync(path.join(ekKok, "rapor", slug + ".md"), `### ${ek.marka}\n- marka atlandı: ${ayar.atlaMarka}\n`);
      ekRapor.push(`### ${ek.marka}`, `- marka atlandı: ${ayar.atlaMarka}`);
      continue;
    }
    const satir: string[] = [`### ${ek.marka}`];
    for (const kat of ["otomobil", "kamyonet"] as const) {
      const kismi = { ...ek, modeller: new Map([...ek.modeller].filter(([ad, m]) => {
        const hedef = m.kategori === "Arazi, SUV & Pickup" && ayar.kamyonet?.includes(ad) ? "kamyonet" : "otomobil";
        return hedef === kat;
      })) };
      if (!kismi.modeller.size) continue;
      const d = markaAl(kat, ayar.marka ?? ek.marka);
      // Önce birebir aynı adlı kopya modeller ("A 110" / "A110") birleşir; sonra kullanıcı satırları işlenir.
      tekillesenler.push(...modelleriTekillestir(d.modeller).map((n) => `${ek.marka}: ${n}`));
      const s = ekUygula(ek.marka, kismi, ayar, d.modeller, kuresel);
      belirsiz.push(...s.belirsiz);
      satir.push(`- ${kat}: zaten vardı ${s.zatenVar} · eklendi ${s.eklenen.length} · belirsiz ${s.belirsiz.length}`, ...s.eklenen.map((e) => `  - + ${e}`), ...s.eslesme.map((e) => `  - ~ eşleme: ${e}`));
    }
    fs.mkdirSync(path.join(ekKok, "belirsiz"), { recursive: true });
    fs.mkdirSync(path.join(ekKok, "rapor"), { recursive: true });
    fs.writeFileSync(path.join(ekKok, "belirsiz", slug + ".json"), JSON.stringify(belirsiz, null, 2) + "\n");
    fs.writeFileSync(path.join(ekKok, "rapor", slug + ".md"), satir.join("\n") + "\n");
    ekRapor.push(...satir);
  }
}

// ─── 2.6) Minivan & Panelvan katalogları (ek/kaynak-minivan) ─────────────────
// Kategori "kamyonet"tir. Model katalogda ADIYLA (aksan/boşluk duyarsız) kamyonette varsa oraya, yalnız otomobilde
// varsa oradaki modele eklenir (aynı aracın iki kategoride kopyası oluşmasın); hiçbirinde yoksa kamyonete YENİ model
// açılır. Adı benzeyen ama aynı olmayan modeller (ör. "Proace" ↔ "Proace Cargo") birleştirilmez; rapora yazılır.
const minivanKok = path.join(ekKok, "kaynak-minivan");
const minivanBenzer: string[] = [];
if (fs.existsSync(minivanKok)) {
  const modelAnahtar = (s: string) => s.normalize("NFD").replace(/\p{Mn}/gu, "").toUpperCase().replace(/\([^)]*\)/g, " ").replace(/[^A-Z0-9]/g, "");
  fs.mkdirSync(path.join(ekKok, "belirsiz-minivan"), { recursive: true });
  fs.mkdirSync(path.join(ekKok, "rapor-minivan"), { recursive: true });
  for (const dosya of fs.readdirSync(minivanKok).filter((f) => f.endsWith(".txt")).sort()) {
    const ek = parseEk(fs.readFileSync(path.join(minivanKok, dosya), "utf8"));
    if (!ek.marka) continue;
    const slug = slugify(ek.marka);
    const ayarYol = path.join(ekKok, "ayar-minivan", slug + ".json");
    const ayar = (fs.existsSync(ayarYol) ? JSON.parse(fs.readFileSync(ayarYol, "utf8")) : {}) as EkAyar;
    const markaAdi = ayar.marka ?? ek.marka;
    const kamD = durum.kamyonet.get(anahtar(markaAdi));
    const otoD = durum.otomobil.get(anahtar(markaAdi));
    const hedefKat = (ad: string): "otomobil" | "kamyonet" => {
      const hedefAd = ayar.takma?.[ad] ?? ad;
      if (kamD && modeliBul(kamD.modeller, hedefAd)) return "kamyonet";
      if (otoD && modeliBul(otoD.modeller, hedefAd)) return "otomobil";
      return "kamyonet";
    };
    const belirsiz: Belirsiz[] = [];
    const satir: string[] = [`### ${ek.marka}`];
    for (const kat of ["kamyonet", "otomobil"] as const) {
      const kismi = { ...ek, modeller: new Map([...ek.modeller].filter(([ad]) => hedefKat(ad) === kat)) };
      if (!kismi.modeller.size) continue;
      const d = markaAl(kat, markaAdi);
      const oncekiModeller = new Set(d.modeller.map((m) => m.ad));
      const s = ekUygula(ek.marka, kismi, { ...ayar, siki: true }, d.modeller, kuresel);
      belirsiz.push(...s.belirsiz);
      satir.push(`- ${kat}: zaten vardı ${s.zatenVar} · eklendi ${s.eklenen.length} · belirsiz ${s.belirsiz.length}`, ...s.eklenen.map((e) => `  - + ${e}`), ...s.eslesme.map((e) => `  - ~ eşleme: ${e}`));
      for (const m of d.modeller.filter((x) => !oncekiModeller.has(x.ad))) {
        const benzer = [...(kamD?.modeller ?? []), ...(otoD?.modeller ?? [])].filter((x) => {
          if (!oncekiModeller.has(x.ad)) return false;
          const a = modelAnahtar(m.ad), b = modelAnahtar(x.ad);
          return a !== b && a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a));
        });
        if (benzer.length) minivanBenzer.push(`${ek.marka}: yeni "${m.ad}" ayrı model açıldı — katalogda benzer adlı: ${[...new Set(benzer.map((x) => `"${x.ad}"`))].join(", ")}`);
      }
    }
    fs.writeFileSync(path.join(ekKok, "belirsiz-minivan", slug + ".json"), JSON.stringify(belirsiz, null, 2) + "\n");
    fs.writeFileSync(path.join(ekKok, "rapor-minivan", slug + ".md"), [...satir, ...minivanBenzer.filter((x) => x.startsWith(ek.marka + ":")).map((x) => `  - ~ benzer ad: ${x}`)].join("\n") + "\n");
    ekRapor.push(...satir);
  }
}

// ─── 2.7) Elektrikli modeller: yıl tabanı 2000 (kullanıcı kararı, 2026-10-03) ──────────────────
// Yılı bilinmeyen modeller 1986/1990'dan başlıyordu; elektrikli bir modelin 2000 öncesi yılı olamaz.
const EV_TABAN = 2000;
const EV_AD = /(\be-?tron\b|\bEV\b|elektrik|\bEQ[A-Z]?\b|\bID\.\s?(\d|Buzz)|\be-tech\b|\be-(Berlingo|Partner|Expert|Jumpy|Vito|Crafter|Transit|Doblo|Ducato|Kangoo|Scudo|Rifter|Spacetourer|Boxer|Combo|Golf|Up|Niro|Soul|208|2008|308|C4|C5)\b|\bIoniq\b|\bAriya\b|\bSeagull\b|\bTavascan\b|\bMX-30\b|\bTaycan\b|\bZoe\b|\bLeaf\b|\bBolt\b|\bAtto\b|\bDolphin\b|\bbZ\d|\bEX(30|40|90)\b|#\d)/i;
const evDuzeltilen: string[] = [];
for (const kat of KATEGORILER) for (const d of durum[kat].values()) for (const m of d.modeller) {
  if (!EV_AD.test(m.ad)) continue;
  let degisti = false;
  for (const n of m.nesiller) if (n.bas < EV_TABAN && (n.bit === null || n.bit >= EV_TABAN)) { n.bas = EV_TABAN; degisti = true; }
  for (const t of m.tipler) {
    const yeni = t.y.filter((y) => y >= EV_TABAN);
    if (yeni.length && yeni.length !== t.y.length) { t.y = yeni; degisti = true; }
  }
  if (degisti) evDuzeltilen.push(`${d.marka} › ${m.ad}`);
}
console.log(`Elektrikli model yıl tabanı ${EV_TABAN}: ${evDuzeltilen.length} model düzeltildi`);

// ─── 3) Yaz ───────────────────────────────────────────────────────────────
const rapor: string[] = [
  `# Katalog birleştirme raporu — ${tsb.baslik}`, "",
  `Eski nesil TSB modeline bağlandı: ${sayac.nesil} · eski kayıt atıldı (TSB kapsıyor): ${sayac.atilan} · eski kayıt tek başına kaldı: ${sayac.tek}`, "",
];
const index = { otomobil: [], kamyonet: [], motosiklet: [] } as KatalogIndex;
for (const kat of KATEGORILER) {
  const outDir = path.join(root, "public", "katalog", kat);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  rapor.push(`## ${kat}`, "");

  for (const d of [...durum[kat].values()].sort((a, b) => a.marka.localeCompare(b.marka, "tr"))) {
    if (!d.modeller.length) continue;
    for (const m of d.modeller) m.nesiller.sort((a, b) => a.bas - b.bas);
    d.modeller.sort((a, b) => a.ad.localeCompare(b.ad, "tr", { numeric: true }));
    const dosya: KatalogMarkaDosyasi = { marka: d.marka, kategori: kat, kaynak: tsb.baslik, modeller: d.modeller };
    const slug = slugify(d.marka);
    fs.writeFileSync(path.join(outDir, `${slug}.json`), turkceHarfler(JSON.stringify(dosya)));
    index[kat].push({ marka: d.marka, dosya: `/katalog/${kat}/${slug}.json`, modeller: d.modeller.map((m) => m.ad) });

    rapor.push(`### ${d.marka}${d.tsbVar ? "" : " (TSB'de yok — eski katalog)"}`);
    if (d.not.eslesen.length) rapor.push(`- Nesil bağlandı: ${d.not.eslesen.join(" · ")}`);
    if (d.not.atilan.length) rapor.push(`- Atıldı: ${d.not.atilan.join(" · ")}`);
    if (d.not.tek.length && d.tsbVar) rapor.push(`- TSB'de karşılığı yok, eskiden kaldı: ${d.not.tek.join(" · ")}`);
    rapor.push("");
  }
  index[kat].push({ marka: DIGER_MARKA, dosya: "", modeller: [] });
}

fs.writeFileSync(path.join(root, "src", "data", "katalogIndex.json"), turkceHarfler(JSON.stringify(index)) + "\n");
fs.writeFileSync(path.join(incele, "birlestirme.md"), rapor.join("\n") + "\n");
if (ekRapor.length) console.log(ekRapor.join("\n"));
if (tekillesenler.length) console.log("Tekilleşen modeller:\n" + tekillesenler.join("\n"));

const boyut = (d: string) => fs.readdirSync(d).reduce((s, f) => s + fs.statSync(path.join(d, f)).size, 0);
console.log(rapor[2]);
for (const kat of KATEGORILER) {
  console.log(`${kat}: ${index[kat].length - 1} marka, ${(boyut(path.join(root, "public", "katalog", kat)) / 1024).toFixed(0)} KB`);
}
console.log(`katalogIndex.json: ${(fs.statSync(path.join(root, "src", "data", "katalogIndex.json")).size / 1024).toFixed(0)} KB`);
