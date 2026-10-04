// e-bisiklet / e-scooter / karavan için gevşetilmiş Commons aday araması (marka + model belirteci, ≥1000px, serbest lisans).
import fs from "fs";
const UA = { "User-Agent": "fikape.com/1.0 (https://fikape.com; info@fikape.com)" };
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const HARIC = /interior|dashboard|engine|detail|logo|badge|cockpit|diagram|drawing|render|sketch|poster|brochure|police|polizei|polis|taxi|ambulan|concept|prototype|tuning|livery|crash|cutaway|floor.?plan|grundriss|battery|charging|app\b|screenshot/i;
// slug → [aramalar], [markaBelirteci], [modelBelirteçleri (en az biri geçmeli; boşsa yalnız marka)]
const H = JSON.parse(fs.readFileSync("scripts/toplu-ekle/gorsel-adaylar-diger.json", "utf8"));
const kat = ["e-bisiklet", "e-scooter", "karavan"];
const Q = {
  "brompton-electric": ["Brompton Electric", ["brompton"], ["electric"]],
  "cowboy": ["Cowboy e-bike", ["cowboy"], ["cowboy"]],
  "gocycle": ["Gocycle", ["gocycle"], []],
  "super73": ["Super73", ["super73"], []],
  "vanmoof": ["VanMoof S3", ["vanmoof"], []],
  "xiaomi-electric-bicycle": ["Xiaomi electric bicycle", ["xiaomi"], ["bicycle", "bike"]],
  "xiaomi-6": ["Xiaomi electric scooter", ["xiaomi"], ["scooter", "mi", "pro"]],
  "segway-ninebot-max": ["Segway Ninebot Max", ["ninebot", "segway"], ["max"]],
  "navee": ["Navee scooter", ["navee"], []],
  "dualtron": ["Dualtron", ["dualtron", "minimotors"], []],
  "kaabo": ["Kaabo Wolf", ["kaabo"], []],
  "apollo-air": ["Apollo scooter", ["apollo"], []],
  "inmotion": ["Inmotion scooter", ["inmotion"], []],
  "dethleffs": ["Dethleffs caravan", ["dethleffs"], []],
  "knaus": ["Knaus Nordwind", ["knaus"], []],
  "airstream": ["Airstream", ["airstream"], []],
  "caravelair": ["Caravelair", ["caravelair"], []],
  "chausson": ["Chausson", ["chausson"], []],
  "coachman": ["Coachman caravan", ["coachman"], []],
  "frankia": ["Frankia", ["frankia"], []],
  "weinsberg": ["Weinsberg CaraLife", ["weinsberg"], []],
};
const grup = (slug) => Object.keys(Q).filter((k) => slug.startsWith(k)).sort((a, b) => b.length - a.length)[0];
async function ara(q) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=50&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}&prop=imageinfo&iiprop=size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|NonFree|DateTimeOriginal|DateTime&format=json&formatversion=2`;
  for (let d = 0; d < 3; d++) { try { const r = await fetch(api, { headers: UA }); if (r.status === 429) { await bekle(3000 * (d + 1)); continue; } return (await r.json())?.query?.pages ?? []; } catch { await bekle(1000); } }
  return [];
}
const onbellek = {};
const sonuc = {};
for (const [slug, v] of Object.entries(H)) {
  if (!kat.includes(v.kat)) continue;
  const g = grup(slug); if (!g) { console.log("grup yok", slug); continue; }
  const [q, markalar, modeller] = Q[g];
  onbellek[g] ??= await ara(q);
  await bekle(350);
  const adaylar = onbellek[g].filter((x) => x.imageinfo?.[0]).map((x) => ({ dosya: x.title.replace(/^File:/, ""), idx: x.index, w: x.imageinfo[0].width, h: x.imageinfo[0].height, mime: x.imageinfo[0].mime, lisans: (x.imageinfo[0].extmetadata?.LicenseShortName?.value ?? "").replace(/<[^>]*>/g, ""), serbestDegil: x.imageinfo[0].extmetadata?.NonFree?.value }))
    .filter((x) => /jpeg/.test(x.mime) && x.w >= 1000 && x.w / x.h > 1.2 && x.w / x.h < 2.2 && !x.serbestDegil && /^(CC|Public|PD)/i.test(x.lisans) && !HARIC.test(x.dosya))
    .filter((x) => { const n = norm(x.dosya); return markalar.some((m) => n.includes(m)) && (!modeller.length || modeller.some((m) => n.includes(m))); })
    .sort((a, b) => a.idx - b.idx).slice(0, 6).map(({ dosya, w, h, lisans }) => ({ dosya, w, h, lisans }));
  sonuc[slug] = { ad: v.ad, kat: v.kat, adaylar };
  console.log(v.kat.padEnd(10), slug.slice(0, 50).padEnd(50), adaylar.length);
}
fs.writeFileSync("scripts/toplu-ekle/gorsel-adaylar-diger2.json", JSON.stringify(sonuc, null, 1));
