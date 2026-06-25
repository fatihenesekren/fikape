/**
 * CarQuery'den tüm markaları çekip src/data/carquery-makes.json olarak kaydeder.
 * Çalıştır: npx tsx scripts/fetch-carquery-makes.ts
 */
import fs from "fs";
import path from "path";

const CQ = "http://www.carqueryapi.com/api/0.3/";

async function main() {
  console.log("CarQuery'den markalar çekiliyor...");
  const res = await fetch(`${CQ}?cmd=getMakes`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  // CarQuery yanıtı bazen ";{...}" ile başlar
  const json = text.trim().replace(/^[^[{]*/, "");
  const data = JSON.parse(json);

  const makes: { make_id: string; make_display: string; make_country: string }[] =
    data.Makes ?? [];

  console.log(`${makes.length} marka bulundu.`);

  const outPath = path.join(process.cwd(), "src", "data", "carquery-makes.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(makes, null, 2), "utf-8");

  console.log(`Kaydedildi: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
