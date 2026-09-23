/**
 * TSB Kasko Değer Listesi'ndeki "MOTORSIKLET" satırlarını katalog taslağına
 * çevirir. Otomobil/kamyonet'in build.ts'inden ayrı — motosiklette model/
 * motor/paket ayrımı yapılmıyor (bkz. parseMotoTip.ts).
 *
 * Çalıştır: npx tsx scripts/vehicle-data/tsb/motoBuild.ts [xlsx yolu]
 * Varsayılan girdi: scripts/vehicle-data/_kaynak/ içindeki en yeni .xlsx
 *
 * vehicles.json'a DOKUNMAZ. Çıktı: scripts/vehicle-data/_inceleme/tsb-moto-katalog.json + moto-rapor.md
 */
import fs from "fs";
import path from "path";
import { readTsbXlsx } from "./xlsx";
import { parseMotoTip, type ParsedMotoTip } from "./parseMotoTip";

const root = path.join(process.cwd(), "scripts", "vehicle-data");
const kaynakDir = path.join(root, "_kaynak");
const outDir = path.join(root, "_inceleme");

const input =
  process.argv[2] ??
  path.join(kaynakDir, fs.readdirSync(kaynakDir).filter((f) => f.endsWith(".xlsx")).sort().at(-1) ?? "");

const { baslik, rows } = readTsbXlsx(input);
const motoRows = rows.filter((r) => r.marka === "MOTORSIKLET");

export type MotoKatalogTip = ParsedMotoTip & { tsbKod: string; ham: string; yillar: number[] };

const tipler: MotoKatalogTip[] = [];
const disarida: Record<string, number> = {};
for (const r of motoRows) {
  const res = parseMotoTip(r.tip);
  if (!res.ok) { disarida[res.neden] = (disarida[res.neden] ?? 0) + 1; continue; }
  tipler.push({ ...res.value, tsbKod: `${r.markaKodu}-${r.tipKodu}`, ham: r.tip, yillar: r.yillar });
}

// ─── Gruplama ─────────────────────────────────────────────────────────────
type ModelOut = { model: string; yilAraligi: [number, number]; tipler: MotoKatalogTip[] };
const katalog: Record<string, Record<string, ModelOut>> = {};
for (const t of tipler) {
  const byMake = (katalog[t.make] ??= {});
  const m = (byMake[t.modelKey] ??= { model: t.model, yilAraligi: [9999, 0], tipler: [] });
  m.tipler.push(t);
  for (const y of t.yillar) {
    m.yilAraligi[0] = Math.min(m.yilAraligi[0], y);
    m.yilAraligi[1] = Math.max(m.yilAraligi[1], y);
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "tsb-moto-katalog.json"),
  JSON.stringify({ kaynak: path.basename(input), baslik, katalog }, null, 1) + "\n",
);

// ─── Rapor ────────────────────────────────────────────────────────────────
const say = <T,>(arr: T[], f: (x: T) => string | null) => {
  const o: Record<string, number> = {};
  for (const x of arr) { const k = f(x) ?? "(boş)"; o[k] = (o[k] ?? 0) + 1; }
  return Object.entries(o).sort((a, b) => b[1] - a[1]);
};

const lines: string[] = [];
lines.push(`# TSB motosiklet dönüşüm raporu — ${baslik}`, "");
lines.push(`Toplam MOTORSIKLET satırı: ${motoRows.length} · Kataloğa giren: ${tipler.length} · marka: ${Object.keys(katalog).length}`, "");
lines.push("## Dışarıda kalanlar", ...Object.entries(disarida).map(([k, v]) => `- ${k}: ${v}`), "");
lines.push(`## Yakıt dağılımı`, ...say(tipler, (t) => t.yakit).map(([k, v]) => `- ${k}: ${v}`), "");

lines.push("## Marka → model sayısı (tip sayısı, yıl aralığı)", "");
for (const [make, models] of Object.entries(katalog).sort((a, b) => a[0].localeCompare(b[0], "tr"))) {
  const list = Object.values(models)
    .sort((a, b) => b.tipler.length - a.tipler.length)
    .map((m) => `${m.model} (${m.yilAraligi[0]}–${m.yilAraligi[1]})`);
  lines.push(`- **${make}** (${Object.keys(models).length} model): ${list.slice(0, 40).join(" · ")}${list.length > 40 ? " …" : ""}`);
}
lines.push("");

fs.writeFileSync(path.join(outDir, "moto-rapor.md"), lines.join("\n") + "\n");
console.log(`✓ ${tipler.length} tip, ${Object.keys(katalog).length} marka → ${path.relative(process.cwd(), outDir)}`);
console.log(`Dışarıda kalan: ${JSON.stringify(disarida)}`);
