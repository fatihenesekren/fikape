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

const root = process.cwd();
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
      v: [t.motor, t.cekis].filter(Boolean).join(" "),
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
    fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(dosya));
    index[kat].push({ marka: d.marka, dosya: `/katalog/${kat}/${slug}.json`, modeller: d.modeller.map((m) => m.ad) });

    rapor.push(`### ${d.marka}${d.tsbVar ? "" : " (TSB'de yok — eski katalog)"}`);
    if (d.not.eslesen.length) rapor.push(`- Nesil bağlandı: ${d.not.eslesen.join(" · ")}`);
    if (d.not.atilan.length) rapor.push(`- Atıldı: ${d.not.atilan.join(" · ")}`);
    if (d.not.tek.length && d.tsbVar) rapor.push(`- TSB'de karşılığı yok, eskiden kaldı: ${d.not.tek.join(" · ")}`);
    rapor.push("");
  }
  index[kat].push({ marka: DIGER_MARKA, dosya: "", modeller: [] });
}

fs.writeFileSync(path.join(root, "src", "data", "katalogIndex.json"), JSON.stringify(index) + "\n");
fs.writeFileSync(path.join(incele, "birlestirme.md"), rapor.join("\n") + "\n");

const boyut = (d: string) => fs.readdirSync(d).reduce((s, f) => s + fs.statSync(path.join(d, f)).size, 0);
console.log(rapor[2]);
for (const kat of KATEGORILER) {
  console.log(`${kat}: ${index[kat].length - 1} marka, ${(boyut(path.join(root, "public", "katalog", kat)) / 1024).toFixed(0)} KB`);
}
console.log(`katalogIndex.json: ${(fs.statSync(path.join(root, "src", "data", "katalogIndex.json")).size / 1024).toFixed(0)} KB`);
