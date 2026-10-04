// E-scooter / e-bisiklet kartlarında trimName'e yazılmış teknik özellik dizgesinden ("250W 25 km/h 487Wh") değerleri ayrıştırıp
// attributes'a yazar. Tahmin YOK: yalnız metinde açıkça yazanlar; "tepe" (peak) güç nominal motor gücü sayılmaz; V×Ah → Wh çarpımı hesaplanır.
// Kullanım: npx tsx scripts/toplu-ekle/spec-trim-ayristir.ts [--yaz]
import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const YAZ = process.argv.includes("--yaz");
const KAYIT = path.join(process.cwd(), "scripts", "toplu-ekle", "spec-doldur-kayit.jsonl");

export function ayristir(trim: string): Record<string, number> {
  const out: Record<string, number> = {};
  const t = trim.replace(/,/g, ".");
  // nominal güç: "250W" (hemen ardından "tepe" gelmeyen ilk W); "300W (500W tepe)" → 300
  const w = [...t.matchAll(/(\d+(?:\.\d+)?)\s*W(?!h)\b(\s*(?:\(|)?\s*tepe)?/gi)].filter((m) => !m[2]);
  if (w.length && !/(^|\s)çift(\s|$)/i.test(t)) out.motor_watt = Number(w[0][1]); // "Çift" motorda toplam/motor başı belirsiz → yazılmaz
  const wh = t.match(/(\d+(?:\.\d+)?)\s*Wh\b/i);
  if (wh) out.battery_wh = Number(wh[1]);
  else { const va = t.match(/(\d+(?:\.\d+)?)\s*V\b\s*(\d+(?:\.\d+)?)\s*Ah\b/i); if (va) out.battery_wh = Math.round(Number(va[1]) * Number(va[2])); }
  const kmh = t.match(/(\d+)\s*km\s*\/\s*[hs]\b/i);
  if (kmh) out.max_speed_kmh = Number(kmh[1]);
  return out;
}

async function main() {
  const ids = new Set(fs.readFileSync(path.join(process.cwd(), "scripts", "toplu-ekle", "eklenenler.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l).id as number));
  const urunler = await prisma.product.findMany({ where: { id: { in: [...ids] }, status: "ACTIVE", category: { slug: { in: ["e-scooter", "e-bisiklet"] } } }, include: { category: true }, orderBy: { id: "asc" } });
  let yazilan = 0;
  for (const p of urunler) {
    const attrs = { ...(p.attributes as Record<string, unknown>) };
    const bulunan = ayristir(p.trimName ?? "");
    const yeni = Object.fromEntries(Object.entries(bulunan).filter(([k]) => attrs[k] == null));
    console.log(`${p.id} ${p.slug.slice(0, 44).padEnd(44)} "${p.trimName}" → ${JSON.stringify(yeni)}`);
    if (!Object.keys(yeni).length) continue;
    yazilan++;
    if (YAZ) {
      fs.appendFileSync(KAYIT, JSON.stringify({ id: p.id, slug: p.slug, once: p.attributes, eklenen: yeni, kaynak: "trim-ayristir", tarih: new Date().toISOString() }) + "\n");
      await prisma.product.update({ where: { id: p.id }, data: { attributes: { ...attrs, ...yeni } as never } });
    }
  }
  console.log(`\n${YAZ ? "YAZILDI" : "KURU ÇALIŞTIRMA"}: ${yazilan}/${urunler.length}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
