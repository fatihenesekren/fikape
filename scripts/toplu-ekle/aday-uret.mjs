// Seçenek A: kataloğumuzdaki GÜNCEL (2024+ resmî tipi, yakıt+vites belli) modellerden marka başına en fazla 3 FARKLI model önerir.
// Sıralama ölçütü satış verisi DEĞİL: marka sırası = Türkiye pazar payı (ODMD marka sıralaması bilgisi), marka içi sıra = güncel tip sayısı.
// Zaten kartı olan modeller atlanır (aynı model iki kez olmasın). Kullanım: node aday-uret.mjs <kategori> <toplam> <markaSirasi.txt> > hedef.json
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire("C:/Projects/fikape/package.json");
const { Client } = require("pg");
for (const l of fs.readFileSync("C:/Projects/fikape/.env", "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const [kategori, toplamS, markaDosyasi, haricDosyasi] = process.argv.slice(2);
const TOPLAM = Number(toplamS);
const kok = "C:/Projects/fikape/public/katalog/" + kategori;
const markaSirasi = fs.readFileSync(markaDosyasi, "utf8").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const harici = new Set(haricDosyasi && fs.existsSync(haricDosyasi) ? fs.readFileSync(haricDosyasi, "utf8").split(/\r?\n/).map((x) => x.trim().toLowerCase()).filter(Boolean) : []);
const slugify = (s) => s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const norm = (s) => s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]/g, "");

const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const kartli = new Set((await c.query(`select b.name || '|' || m.name as k from products p join brands b on b.id=p."brandId" join models m on m.id=p."modelId" join categories ca on ca.id=p."categoryId" where ca.slug=$1 and p.status in ('ACTIVE','PENDING')`, [kategori])).rows.map((x) => norm(x.k.split("|")[0]) + "|" + norm(x.k.split("|")[1])));
await c.end();

const out = [];
for (const marka of markaSirasi) {
  const f = path.join(kok, slugify(marka) + ".json");
  if (!fs.existsSync(f)) continue;
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  const adaylar = [];
  for (const m of j.modeller) {
    if (harici.has((j.marka + "|" + m.ad).toLowerCase()) || harici.has(m.ad.toLowerCase())) continue;
    if (kartli.has(norm(j.marka) + "|" + norm(m.ad))) continue;
    const uygun = m.tipler.filter((t) => !t.g && t.f && t.t && t.y.some((y) => y >= 2024));
    if (!uygun.length) continue;
    adaylar.push({ ad: m.ad, n: uygun.length });
  }
  adaylar.sort((a, b) => b.n - a.n || a.ad.localeCompare(b.ad));
  // Aynı modelin kasa varyantlarını (Corolla / Corolla Cross) ayrı model saymaya devam et ama en çok 3 marka başına
  for (const a of adaylar.slice(0, 3)) out.push({ marka: j.marka, model: a.ad });
}
console.error(`marka sayısı: ${new Set(out.map((x) => x.marka)).size} | aday: ${out.length} (istenen en çok ${TOPLAM})`);
process.stdout.write(JSON.stringify(out.slice(0, TOPLAM), null, 1));
