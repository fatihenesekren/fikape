// Toplu eklenen (eklenenler.jsonl) ve görseli olmayan araçlar için Wikimedia Commons aday araması (YALNIZ API metaverisi; dosya indirmez).
// Çıktı: gorsel-adaylar.json  → { slug: { ad, adaylar: [{ dosya, w, h, lisans }] } }
// Kullanım: node gorsel-aday.mjs [ciktiYolu]
import fs from "fs";
import { createRequire } from "module";
const require = createRequire("C:/Projects/fikape/package.json");
const { Client } = require("pg");
for (const l of fs.readFileSync("C:/Projects/fikape/.env", "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const UA = { "User-Agent": "fikape.com/1.0 (https://fikape.com; info@fikape.com)" };
const ciktiYol = process.argv[2] ?? "C:/Projects/fikape/scripts/toplu-ekle/gorsel-adaylar.json";
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const HARIC = /interior|dashboard|engine|wheel|detail|logo|badge|cockpit|steering|trunk|boot|battery|charging|crash|cutaway|chassis|seats?\b|infotainment|display|screen|headlight|taillight|lamp|grille|emblem|mirror|key\b|diagram|drawing|render|sketch|poster|brochure|ad\b|advert/i;

const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query(`select p.id, p.slug, p.name, p.year, b.name brand, m.name model, ca.slug kat
  from products p join brands b on b.id=p."brandId" join models m on m.id=p."modelId" join categories ca on ca.id=p."categoryId"
  where p.status='ACTIVE' and p."imageUrl" is null order by ca.slug, p.id`);
await c.end();
console.log("görseli olmayan aktif ürün:", r.rows.length);

async function wikiKapak(marka, model) {
  const q = `${marka} ${model}`;
  for (let d = 0; d < 3; d++) {
    try {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=1&prop=pageimages&piprop=original&format=json&formatversion=2`, { headers: UA });
      if (res.status === 429) { await bekle(3000 * (d + 1)); continue; }
      const j = await res.json();
      const sayfa = j.query?.pages?.[0];
      const src = sayfa?.original?.source;
      if (!src || !src.includes("upload.wikimedia.org/wikipedia/commons/")) return null;
      // Makale başlığı marka VE modeli içermeli (ör. "Peugeot Expert" araması "Citroën Jumpy" makalesine düşerse reddedilir)
      const baslik = norm(sayfa.title ?? "");
      if (!baslik.includes(norm(marka)) || !baslik.includes(norm(model))) return null;
      return decodeURIComponent(new URL(src).pathname.split("/").pop()).replace(/_/g, " ");
    } catch { await bekle(1000); }
  }
  return null;
}
async function dosyaBilgi(dosya) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent("File:" + dosya)}&prop=imageinfo&iiprop=size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|NonFree|DateTimeOriginal|DateTime&format=json&formatversion=2`;
  try {
    const j = await (await fetch(api, { headers: UA })).json();
    const x = j.query?.pages?.[0]; const i = x?.imageinfo?.[0]; if (!i) return null;
    return { dosya, w: i.width, h: i.height, mime: i.mime, lisans: (i.extmetadata?.LicenseShortName?.value ?? "").replace(/<[^>]*>/g, ""), serbestDegil: i.extmetadata?.NonFree?.value, tarih: Number(((i.extmetadata?.DateTimeOriginal?.value ?? i.extmetadata?.DateTime?.value ?? "").match(/(19|20)d{2}/) ?? [])[0]) || null };
  } catch { return null; }
}

const sonuc = {};
const kapsama = {};
// Reklam/özel kaplama/yarış/konsept gibi alakasız çekimler dosya adından elenir
const HARIC2 = /polizia|police|policia|polis|carabinieri|gendarm|taxi|taksi|feuerwehr|fire\b|ambulan|rally|wrc|racing|race\b|concept|prototype|tuning|tuned|wrap|livery|medical|safety.?car|museum|auto.?show.*crowd/i;
// "Mt 09" → "MT-09", "Gsx 8S" → "GSX-8S" gibi yazım varyantları (dosya adlarında bitişik/tireli yazılır)
function varyantlar(model) {
  const v = new Set([model]);
  v.add(model.replace(/([A-Za-z]+)\s?-?\s?(\d)/g, (m, a, b) => `${a.toUpperCase()}-${b}`));
  v.add(model.replace(/\s+/g, ""));
  return [...v];
}
async function ara(sorgu) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=40&gsrsearch=${encodeURIComponent('"' + sorgu + '" filetype:bitmap')}&prop=imageinfo&iiprop=size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|NonFree|DateTimeOriginal|DateTime&format=json&formatversion=2`;
  for (let d = 0; d < 3; d++) {
    try { const res = await fetch(api, { headers: UA }); if (res.status === 429) { await bekle(3000 * (d + 1)); continue; } const j = await res.json(); return j?.query?.pages ?? []; } catch { await bekle(1000); }
  }
  return [];
}
for (const p of r.rows.filter((x) => (!process.env.KAT || x.kat === process.env.KAT) && (!process.env.SLUGS || process.env.SLUGS.split(",").includes(x.slug)))) {
  const modelTemiz = p.model.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  const sorgu = `${p.brand} ${modelTemiz}`;
  const sayfalar = [];
  const gorulen = new Set();
  for (const vy of varyantlar(modelTemiz)) {
    for (const x of await ara(`${p.brand} ${vy}`)) if (!gorulen.has(x.title)) { gorulen.add(x.title); sayfalar.push(x); }
    await bekle(350);
  }
  const marka = norm(p.brand), modelN = norm(modelTemiz);
  const adaylar = sayfalar
    .filter((x) => x.imageinfo?.[0])
    .map((x) => ({ dosya: x.title.replace(/^File:/, ""), idx: x.index, w: x.imageinfo[0].width, h: x.imageinfo[0].height, mime: x.imageinfo[0].mime, lisans: (x.imageinfo[0].extmetadata?.LicenseShortName?.value ?? "").replace(/<[^>]*>/g, ""), serbestDegil: x.imageinfo[0].extmetadata?.NonFree?.value, tarih: Number(((x.imageinfo[0].extmetadata?.DateTimeOriginal?.value ?? x.imageinfo[0].extmetadata?.DateTime?.value ?? "").match(/(19|20)\d{2}/) ?? [])[0]) || null }))
    .filter((x) => /jpeg/.test(x.mime) && x.w >= (process.env.RELAX ? 1000 : 1400) && x.w / x.h > (process.env.RELAX ? 1.15 : 1.25) && x.w / x.h < (process.env.RELAX ? 2.3 : 1.95) && !x.serbestDegil && /^(CC|Public|PD)/i.test(x.lisans))
    .filter((x) => !HARIC.test(x.dosya) && !HARIC2.test(x.dosya))
    .filter((x) => { const n = norm(x.dosya); return n.includes(modelN) && (n.includes(marka) || modelN.length >= 6); })
    // Nesil uyumu: fotoğraf tarihi bilinenlerden yeterince yeni olanlar (ürün yılı − 3, en az 2019); bilinmeyenler sona; yeniden eskiye
    .filter((x) => !x.tarih || x.tarih >= (process.env.RELAX ? 2016 : Math.max(2019, (p.year ?? 2024) - 3)))
    .sort((a, b) => (b.tarih ? 1 : 0) - (a.tarih ? 1 : 0) || (b.tarih ?? 0) - (a.tarih ?? 0) || a.idx - b.idx)
    .slice(0, process.env.RELAX ? 12 : 8)
    .map(({ dosya, w, h, lisans, tarih }) => ({ dosya, w, h, lisans, tarih }));
  const wk = await wikiKapak(p.brand, modelTemiz);
  if (wk) {
    const b = await dosyaBilgi(wk);
    if (b && /jpeg/.test(b.mime) && b.w >= 1000 && b.w / b.h > 1.2 && b.w / b.h < 2 && !b.serbestDegil && /^(CC|Public|PD)/i.test(b.lisans) && !HARIC.test(wk) && (norm(wk).includes(modelN) || true)) {
      const kopya = adaylar.filter((x) => x.dosya !== wk);
      adaylar.length = 0;
      adaylar.push({ dosya: wk, w: b.w, h: b.h, lisans: b.lisans, tarih: b.tarih, kaynak: "wikipedia" }, ...kopya.slice(0, 7));
    }
  }
  sonuc[p.slug] = { ad: p.name, kat: p.kat, sorgu, adaylar };
  kapsama[p.kat] = kapsama[p.kat] ?? { toplam: 0, adayli: 0 };
  kapsama[p.kat].toplam++;
  if (adaylar.length) kapsama[p.kat].adayli++;
  await bekle(350);
}
// Aynı fotoğraf iki ürüne atanmasın: ilk gelen kalır, sonrakiler kendi listesinden kullanılmamış bir sonraki adaya geçer.
const kullanilan = new Set();
for (const v of Object.values(sonuc)) {
  const i = v.adaylar.findIndex((a) => !kullanilan.has(a.dosya));
  if (i > 0) v.adaylar = [...v.adaylar.slice(i), ...v.adaylar.slice(0, i)];
  if (i >= 0) kullanilan.add(v.adaylar[0].dosya);
  else v.adaylar = [];
}
fs.writeFileSync(ciktiYol, JSON.stringify(sonuc, null, 1));
console.log(JSON.stringify(kapsama));
const toplamAday = Object.values(sonuc).reduce((a, x) => a + x.adaylar.length, 0);
console.log("toplam aday dosya:", toplamAday, "| adayı olan ürün:", Object.values(sonuc).filter((x) => x.adaylar.length).length);
