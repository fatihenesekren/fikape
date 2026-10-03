// e-scooter / e-bisiklet / karavan: kaynak src/data/vehicles.json (eski biçim). Marka başına en çok 3 FARKLI model (zaten kartı olmayan),
// başlangıç yılı model adında yazanlar (yıl uydurulmaz); versiyon = ilk gerçek versiyon (motor/akü ayrıntısı), yoksa boş.
// Kullanım: node aday-eski.mjs <kategori> <toplam> [oncelikliMarkalar,virgülle] > hedef.json
import fs from "fs";
import { createRequire } from "module";
const require = createRequire("C:/Projects/fikape/package.json");
const { Client } = require("pg");
for (const l of fs.readFileSync("C:/Projects/fikape/.env", "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const [kategori, toplamS, oncelik = ""] = process.argv.slice(2);
const TOPLAM = Number(toplamS);
const norm = (s) => s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]/g, "");
const katalog = JSON.parse(fs.readFileSync("C:/Projects/fikape/src/data/vehicles.json", "utf8"))[kategori];

const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const kartli = new Set((await c.query(`select b.name as b, m.name as m from products p join brands b on b.id=p."brandId" join models m on m.id=p."modelId" join categories ca on ca.id=p."categoryId" where ca.slug=$1 and p.status in ('ACTIVE','PENDING')`, [kategori])).rows.map((x) => norm(x.b) + "|" + norm(x.m)));
await c.end();

const yilOku = (ad) => { const m = ad.match(/\((\d{4})/); return m ? Number(m[1]) : null; };
const oncelikli = oncelik.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
const markalar = [...katalog].sort((a, b) => {
  const ia = oncelikli.indexOf(a.make.toLowerCase()), ib = oncelikli.indexOf(b.make.toLowerCase());
  return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
});

const hedef = [];
for (const b of markalar) {
  const adaylar = [];
  for (const m of b.models) {
    if (m.name === "Diğer") continue;
    const yil = yilOku(m.name);
    if (!yil || yil < 2020) continue; // güncel olmayan (2020 öncesi başlayan) kayıtlar atlanır
    if (m.name.includes(" / ")) continue; // 'A / B / C' gibi birleşik model adları tek kart olamaz
    if (kartli.has(norm(b.make) + "|" + norm(m.name))) continue;
    const versiyonlar = (m.versions ?? []).filter((v) => v && v !== "Diğer");
    adaylar.push({ ad: m.name, yil, versiyon: versiyonlar[0] ?? null, n: versiyonlar.length });
  }
  adaylar.sort((x, y) => y.n - x.n || y.yil - x.yil || x.ad.localeCompare(y.ad));
  for (const a of adaylar.slice(0, 3)) hedef.push({ dogrudan: true, marka: b.make, model: a.ad, yil: a.yil, versiyon: a.versiyon });
}
console.error(`${kategori}: ${hedef.length} aday, ${new Set(hedef.map((x) => x.marka)).size} marka, yazılan en çok ${TOPLAM}`);
process.stdout.write(JSON.stringify(hedef.slice(0, TOPLAM), null, 1));
