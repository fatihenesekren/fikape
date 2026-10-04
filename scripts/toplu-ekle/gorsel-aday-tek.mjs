// Tek bir araç için Commons aday araması. Kullanım: node gorsel-aday-tek.mjs <cikti.json> "<arama>" <markaBelirteci> <modelBelirteci> [minTarih]
import fs from "fs";
const UA = { "User-Agent": "fikape.com/1.0 (https://fikape.com; info@fikape.com)" };
const [cikti, q, marka, model, minTarih = "2022"] = process.argv.slice(2);
const norm = (s) => s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const HARIC = /interior|dashboard|engine|detail|logo|badge|cockpit|diagram|render|poster|brochure|police|polizei|taxi|concept|prototype|tuning|livery|crash|rally|wrc|racing|race\b/i;
const tum = [];
for (const sorgu of q.split("|")) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=50&gsrsearch=${encodeURIComponent(sorgu + " filetype:bitmap")}&prop=imageinfo&iiprop=size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|NonFree|DateTimeOriginal|DateTime&format=json&formatversion=2`;
  const j = await (await fetch(api, { headers: UA })).json();
  tum.push(...(j?.query?.pages ?? []));
  await new Promise((r) => setTimeout(r, 400));
}
const gorulen = new Set();
const adaylar = tum.filter((x) => x.imageinfo?.[0] && !gorulen.has(x.title) && gorulen.add(x.title))
  .map((x) => { const i = x.imageinfo[0]; const m = i.extmetadata ?? {}; return { dosya: x.title.replace(/^File:/, ""), w: i.width, h: i.height, mime: i.mime, lisans: (m.LicenseShortName?.value ?? "").replace(/<[^>]*>/g, ""), serbestDegil: m.NonFree?.value, tarih: Number((((m.DateTimeOriginal?.value ?? m.DateTime?.value ?? "")).match(/(19|20)\d\d/) ?? [])[0]) || null }; })
  .filter((x) => /jpeg/.test(x.mime) && x.w >= 1400 && x.w / x.h > 1.25 && x.w / x.h < 2.2 && !x.serbestDegil && /^(CC|Public|PD)/i.test(x.lisans) && !HARIC.test(x.dosya))
  .filter((x) => { const n = norm(x.dosya); return n.includes(norm(marka)) && n.includes(norm(model)); })
  .filter((x) => !x.tarih || x.tarih >= Number(minTarih))
  .slice(0, 12);
fs.writeFileSync(cikti, JSON.stringify({ "tek": { ad: q, kat: "x", adaylar } }, null, 1));
console.log(adaylar.length, adaylar.map((a) => a.dosya + " " + a.tarih).join("\n"));
