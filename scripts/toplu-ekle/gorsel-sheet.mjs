// gorsel-adaylar.json → her ürünün 1. adayının 330px önizlemesini indirip 12'lik numaralı sayfalar (sheets/) üretir.
// Alternatif gösterim: node gorsel-sheet.mjs <slug1,slug2,...> --alt  → o ürünlerin 2-4. adayları (ürün başına bir sayfa).
import fs from "fs";
import { createRequire } from "module";
const require = createRequire("C:/Projects/fikape/package.json");
const sharp = require("sharp");
const UA = { "User-Agent": "fikape.com/1.0 (https://fikape.com; info@fikape.com)" };
const KOK = "C:/Projects/fikape/scripts/toplu-ekle";
const OUT = "C:/Users/dell/AppData/Local/Temp/claude/C--Users-dell--git/1de588cb-57a3-4709-8520-6712062ba9a4/scratchpad/gorsel";
fs.mkdirSync(OUT + "/sheets", { recursive: true });
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const adaylar = JSON.parse(fs.readFileSync(KOK + "/" + (process.env.ADAY ?? "gorsel-adaylar.json"), "utf8"));
const tum = process.argv.includes("--tum"); // her ürünün ilk 6 adayı (ürün başına bir sayfa)
const alt = process.argv.includes("--alt") || tum;
const secili = (process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2].split(",") : Object.keys(adaylar).filter((s) => adaylar[s].adaylar.length));

// (slug, dosya) çiftleri
const ciftler = [];
for (const slug of secili) {
  const liste = adaylar[slug]?.adaylar ?? [];
  const alinacak = tum ? liste.slice(0, Number(process.env.N ?? 6)) : alt ? liste.slice(1, 4) : liste.slice(0, 1);
  alinacak.forEach((a, i) => ciftler.push({ slug, dosya: a.dosya, sira: tum ? i + 1 : alt ? i + 2 : 1 }));
}
console.log("indirilecek önizleme:", ciftler.length);

const dosyalar = [...new Set(ciftler.map((c) => c.dosya))];
const bilgi = {};
for (let i = 0; i < dosyalar.length; i += 40) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(dosyalar.slice(i, i + 40).map((d) => "File:" + d).join("|"))}&prop=imageinfo&iiprop=url|extmetadata&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|NonFree|Credit&iiurlwidth=330&format=json&formatversion=2`;
  const j = await (await fetch(api, { headers: UA })).json();
  for (const p of j.query?.pages ?? []) if (p.imageinfo) bilgi[p.title.replace(/^File:/, "")] = { thumb: p.imageinfo[0].thumburl, meta: p.imageinfo[0].extmetadata, sayfa: p.imageinfo[0].descriptionurl };
}
const buf = {};
let n = 0;
for (const d of dosyalar) {
  const b = bilgi[d]; if (!b) continue;
  let r;
  for (let k = 0; k < 5; k++) {
    r = await fetch(b.thumb, { headers: UA });
    if (r.status !== 429 && r.status !== 503) break;
    await bekle(3000 * (k + 1));
  }
  if (!r.ok) { console.log("  inmedi", r.status, d); continue; }
  buf[d] = Buffer.from(await r.arrayBuffer()); n++;
  await bekle(900);
}
console.log("indirilen:", n, "/", dosyalar.length);

const W = 330, H = 220, PAD = 6, COLS = 4, ETIKET_H = 34;
const siraliCift = ciftler.filter((c) => buf[c.dosya]);
const sayfalar = [];
const GRUP = alt ? 3 : 12;
if (alt) {
  // ürün başına bir sayfa (2-4. adaylar)
  const gruplar = new Map();
  for (const c of siraliCift) (gruplar.get(c.slug) ?? gruplar.set(c.slug, []).get(c.slug)).push(c);
  for (const [slug, l] of gruplar) sayfalar.push({ ad: `alt-${slug}`, ogeler: l.map((c, i) => ({ ...c, no: c.sira })) });
} else {
  for (let i = 0; i < siraliCift.length; i += GRUP) sayfalar.push({ ad: `sayfa-${String(i / GRUP + 1).padStart(2, "0")}`, ogeler: siraliCift.slice(i, i + GRUP).map((c, k) => ({ ...c, no: i + k + 1 })) });
}
const esle = {};
for (const s of sayfalar) {
  const satir = Math.ceil(s.ogeler.length / COLS);
  const comps = [];
  for (let i = 0; i < s.ogeler.length; i++) {
    const o = s.ogeler[i];
    const x = PAD + (i % COLS) * (W + PAD), y = PAD + Math.floor(i / COLS) * (H + ETIKET_H + PAD);
    const img = await sharp(buf[o.dosya]).resize(W, H, { fit: "cover" }).toBuffer();
    const ad = (adaylar[o.slug].ad ?? o.slug).replace(/&/g, "ve").replace(/</g, "").slice(0, 44);
    const svg = Buffer.from(`<svg width="${W}" height="${H + ETIKET_H}"><rect x="0" y="0" width="50" height="38" fill="#111"/><text x="25" y="28" font-size="24" font-family="Arial" font-weight="bold" fill="#fff" text-anchor="middle">${o.no}</text><rect x="0" y="${H}" width="${W}" height="${ETIKET_H}" fill="#fff"/><text x="4" y="${H + 22}" font-size="14" font-family="Arial" fill="#111">${ad}</text></svg>`);
    const kart = await sharp(img).extend({ bottom: ETIKET_H, background: "#ffffff" }).composite([{ input: svg, left: 0, top: 0 }]).toBuffer();
    comps.push({ input: kart, left: x, top: y });
    esle[`${alt ? "alt-" : ""}${o.no}`] = { slug: o.slug, dosya: o.dosya, meta: bilgi[o.dosya].meta, sayfa: bilgi[o.dosya].sayfa };
    if (alt) esle[`${o.slug}#${o.no}`] = esle[`alt-${o.no}`];
  }
  await sharp({ create: { width: PAD + COLS * (W + PAD), height: PAD + satir * (H + ETIKET_H + PAD), channels: 3, background: "#ffffff" } }).composite(comps).jpeg({ quality: 82 }).toFile(`${OUT}/sheets/${s.ad}.jpg`);
}
const indeksYol = `${OUT}/${alt ? "indeks-alt" : "indeks"}.json`;
const onceki = fs.existsSync(indeksYol) ? JSON.parse(fs.readFileSync(indeksYol, "utf8")) : {};
fs.writeFileSync(indeksYol, JSON.stringify({ ...onceki, ...esle }, null, 1));
console.log("sayfa:", sayfalar.length, "→", `${OUT}/sheets`);
