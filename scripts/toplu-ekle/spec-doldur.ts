// Toplu eklenen araçlar için teknik özellikleri Gemini (2 bağımsız çağrı, yalnız "medium" = iki çağrı örtüşen) ile doldurur.
// Kurallar: mevcut alanların üzerine yazılmaz; katalogdan gelen beygir korunur; motor hacmi versiyondaki litreyle çelişirse atılır;
// değerler aralık sağlamasından geçer (vehicleSpecs.ts). Her ürünün önceki hali spec-doldur-kayit.jsonl'e yazılır (geri alma).
// Kullanım: npx tsx scripts/toplu-ekle/spec-doldur.ts <kategori[,kategori]> [--yaz] [--limit N]
import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { fetchVehicleSpecsWithConfidence } from "@/lib/vehicleSpecs";
import { SPEC_FIELDS } from "@/lib/specFields";

const [kategoriler, ...bayraklar] = process.argv.slice(2);
if (!kategoriler) throw new Error("Kullanım: spec-doldur.ts <kategori[,kategori]> [--yaz] [--limit N]");
const YAZ = bayraklar.includes("--yaz");
const li = bayraklar.indexOf("--limit");
const LIMIT = li >= 0 ? Number(bayraklar[li + 1]) : Infinity;
const KAYIT = path.join(process.cwd(), "scripts", "toplu-ekle", "spec-doldur-kayit.jsonl");
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

function litre(trim: string | null): number | null {
  const m = (trim ?? "").match(/(?:^|\s)(\d)[.,](\d)(?!\d)/);
  return m ? Number(`${m[1]}.${m[2]}`) : null;
}

async function main() {
  const ids = new Set(fs.readFileSync(path.join(process.cwd(), "scripts", "toplu-ekle", "eklenenler.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l).id as number));
  const kats = kategoriler.split(",");
  const urunler = await prisma.product.findMany({
    where: { id: { in: [...ids] }, status: "ACTIVE", category: { slug: { in: kats } } },
    include: { brand: true, model: true, category: true }, orderBy: { id: "asc" },
  });
  let sayi = 0, yazilan = 0, bos = 0;
  for (const p of urunler) {
    if (sayi++ >= LIMIT) break;
    const attrs = { ...(p.attributes as Record<string, unknown>) };
    if (Object.keys(attrs).length >= 8) continue;                   // yeterince dolu, tekrar sorma
    const yakit = typeof attrs.fuel_type === "string" ? attrs.fuel_type : null;
    const alanlar = new Map((SPEC_FIELDS[p.category.slug] ?? []).map((f) => [f.key, f]));
    const sor = async () => { try { return await fetchVehicleSpecsWithConfidence(p.brand.name, p.model.name, p.year, p.trimName, p.category.slug, yakit); } catch (e) { console.log(`  (hata: ${(e as Error).name})`); return { specs: {} }; } };
    let sonuc = await sor();
    if (!Object.keys(sonuc.specs).length) { await bekle(8000); sonuc = await sor(); }
    const yeni: Record<string, unknown> = {};
    const atlanan: string[] = [];
    const L = litre(p.trimName);
    for (const [k, m] of Object.entries(sonuc.specs)) {
      if (attrs[k] != null && attrs[k] !== "") continue;            // mevcut alan korunur
      if (m.confidence !== "medium") { atlanan.push(`${k}:${m.confidence}`); continue; }
      const f = alanlar.get(k); if (!f) continue;
      if (k === "engine_cc" && L && yakit !== "EV" && Math.abs(Number(m.value) - L * 1000) / (L * 1000) > 0.12) { atlanan.push(`${k}:versiyonla çelişir(${m.value}≠${L}L)`); continue; }
      yeni[k] = f.type === "number" ? Number(m.value) : f.type === "boolean" ? m.value === "true" : m.value;
    }
    const n = Object.keys(yeni).length;
    n ? yazilan++ : bos++;
    console.log(`${p.id} ${p.slug.slice(0, 48).padEnd(48)} +${n} ${n ? JSON.stringify(yeni) : ""}${atlanan.length ? `  | atlanan: ${atlanan.join(", ")}` : ""}`);
    if (YAZ && n) {
      fs.appendFileSync(KAYIT, JSON.stringify({ id: p.id, slug: p.slug, once: p.attributes, eklenen: yeni, tarih: new Date().toISOString() }) + "\n");
      await prisma.product.update({ where: { id: p.id }, data: { attributes: { ...attrs, ...yeni } as never } });
    }
    await bekle(1500);
  }
  console.log(`\n${YAZ ? "YAZILDI" : "KURU ÇALIŞTIRMA"}: alan eklenen ${yazilan}, boş ${bos}, işlenen ${Math.min(sayi, urunler.length)}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
