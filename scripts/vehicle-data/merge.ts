/**
 * Tüm marka JSON dosyalarını birleştirip src/data/vehicles.json oluşturur.
 * Çalıştır: npx tsx scripts/vehicle-data/merge.ts
 */
import fs from "fs";
import path from "path";

const base = path.join(process.cwd(), "scripts", "vehicle-data");
const out  = path.join(process.cwd(), "src", "data", "vehicles.json");

const categories = ["otomobil", "motosiklet", "kamyonet", "e-scooter", "karavan"] as const;

const result: Record<string, unknown[]> = {};

for (const cat of categories) {
  const dir = path.join(base, cat);
  if (!fs.existsSync(dir)) { console.warn(`Eksik klasör: ${cat}`); continue; }

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort();
  result[cat] = [];

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    result[cat].push(data);
  }
  console.log(`${cat}: ${files.length} marka eklendi`);
}

fs.writeFileSync(out, JSON.stringify(result, null, 2), "utf-8");
console.log(`\nOluşturuldu: ${out}`);
