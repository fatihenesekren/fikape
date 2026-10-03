// Seçenek A (küratörlü): marka başına öncelik sıralı model listesi → kataloğumuzda GÜNCEL (2024+ resmî tip, yakıt+vites belli)
// olanlardan, zaten kartı olmayanlardan, bütçe (marka başına en çok 3 yeni) kadarını hedef.json'a yazar; bulunamayanları rapor eder.
// Kullanım: node aday-sec.mjs <kategori> <secenek.json> > hedef.json   (rapor stderr'e)
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire("C:/Projects/fikape/package.json");
const { Client } = require("pg");
for (const l of fs.readFileSync("C:/Projects/fikape/.env", "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const [kategori, secenekYol] = process.argv.slice(2);
const slugify = (s) => s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const norm = (s) => s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]/g, "");
const secenek = JSON.parse(fs.readFileSync(secenekYol, "utf8")); // [{ marka, butce, modeller: [...] }]
const kok = "C:/Projects/fikape/public/katalog/" + kategori;

const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const kartli = new Set((await c.query(`select b.name as b, m.name as m from products p join brands b on b.id=p."brandId" join models m on m.id=p."modelId" join categories ca on ca.id=p."categoryId" where ca.slug=$1 and p.status in ('ACTIVE','PENDING')`, [kategori])).rows.map((x) => norm(x.b) + "|" + norm(x.m)));
await c.end();

const hedef = [];
const rapor = [];
for (const s of secenek) {
  const f = path.join(kok, slugify(s.marka) + ".json");
  if (!fs.existsSync(f)) { rapor.push(`✗ ${s.marka}: katalog dosyası yok`); continue; }
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  let alinan = 0;
  for (const ad of s.modeller) {
    if (alinan >= s.butce) break;
    const m = j.modeller.find((x) => norm(x.ad) === norm(ad));
    if (!m) { rapor.push(`  – ${s.marka} ${ad}: katalogda model yok`); continue; }
    if (kartli.has(norm(j.marka) + "|" + norm(m.ad))) { rapor.push(`  – ${s.marka} ${m.ad}: zaten kartı var`); continue; }
    const motor = kategori === "motosiklet"; // motosiklet katalogunda vites hiç belli değil: skuter → Otomatik, diğer → Manuel (açık varsayım, raporlanır)
    const uygun = m.tipler.filter((t) => !t.g && t.f && (motor || t.t) && t.y.some((y) => y >= 2024));
    if (!uygun.length) { rapor.push(`  – ${s.marka} ${m.ad}: 2024+ yakıt+vites belli resmî tip yok`); continue; }
    const vites = motor ? ((s.skuter ?? []).some((k) => norm(k) === norm(ad)) ? "Otomatik" : "Manuel") : undefined;
    hedef.push({ marka: j.marka, model: m.ad, ...(s.yakit?.[ad] ? { yakit: s.yakit[ad] } : {}), ...(vites ? { vites } : {}) });
    alinan++;
  }
  if (alinan < s.butce) rapor.push(`  ! ${s.marka}: bütçe ${s.butce}, bulunan ${alinan}`);
}
console.error(rapor.join("\n"));
console.error(`\nhedef: ${hedef.length} araç, ${new Set(hedef.map((x) => x.marka)).size} marka`);
process.stdout.write(JSON.stringify(hedef, null, 1));
