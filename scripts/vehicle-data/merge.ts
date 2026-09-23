/**
 * Tüm marka JSON dosyalarını birleştirip src/data/vehicles.json oluşturur.
 * Çalıştır: npx tsx scripts/vehicle-data/merge.ts [--out <yol>]
 *
 * Marka sırası mevcut vehicles.json'daki sıradan alınır; yeni markalar
 * kategorinin sonuna dosya adına göre alfabetik eklenir. Mevcut dosyada olup
 * kaynak dosyası bulunmayan bir marka varsa hiçbir şey yazılmaz (sessiz veri
 * kaybını önlemek için).
 */
import fs from "fs";
import path from "path";

type Entry = { make: string; models: unknown[] };

const base = path.join(process.cwd(), "scripts", "vehicle-data");
const defaultOut = path.join(process.cwd(), "src", "data", "vehicles.json");
const outArg = process.argv.indexOf("--out");
const out = outArg !== -1 ? path.resolve(process.argv[outArg + 1]) : defaultOut;

const categories = ["otomobil", "motosiklet", "kamyonet", "e-scooter", "e-bisiklet", "karavan"] as const;

const existing: Record<string, Entry[]> = fs.existsSync(defaultOut)
  ? JSON.parse(fs.readFileSync(defaultOut, "utf-8"))
  : {};

const result: Record<string, Entry[]> = {};
const dropped: string[] = [];

for (const cat of categories) {
  const dir = path.join(base, cat);
  if (!fs.existsSync(dir)) { console.warn(`Eksik klasör: ${cat}`); continue; }

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort();
  const entries: Entry[] = files.map(file => JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")));

  const order = new Map((existing[cat] ?? []).map((e, i) => [e.make, i]));
  const known = entries.filter(e => order.has(e.make)).sort((a, b) => order.get(a.make)! - order.get(b.make)!);
  const added = entries.filter(e => !order.has(e.make));
  result[cat] = [...known, ...added];

  const sourceMakes = new Set(entries.map(e => e.make));
  for (const e of existing[cat] ?? []) {
    if (!sourceMakes.has(e.make)) dropped.push(`${cat}/${e.make}`);
  }

  console.log(`${cat}: ${entries.length} marka eklendi` + (added.length ? ` (yeni: ${added.map(e => e.make).join(", ")})` : ""));
}

if (dropped.length) {
  console.error(`\nKaynak dosyası olmayan markalar vehicles.json'dan silinecekti, yazılmadı:\n  ${dropped.join("\n  ")}`);
  process.exit(1);
}

fs.writeFileSync(out, JSON.stringify(result, null, 2) + "\n", "utf-8");
console.log(`\nOluşturuldu: ${out}`);
