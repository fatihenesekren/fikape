// Toplu eklenen kartlar admin onay akışından geçmediği için, o akıştaki kontrolleri bu kartlara uygular:
//  1) özellik doğrulaması (tanımsız anahtar, geçersiz seçenek, tür, showIf'e uymayan alan) + normalizeAttributeValues eşdeğeri
//  2) birebir kopya taraması (findExistingVehicles + birebirAyniArac)
//  3) AI özeti (syncAiVehicleSummary → SINGLE_CARD, PENDING_APPROVAL: admin /admin/ai-ozetleri'nden onaylar)
//  4) görsel/atıf eksiği raporu
// Kullanım: npx tsx scripts/toplu-ekle/onay-kontrolleri.ts [--yaz] [--ai]
import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { SPEC_FIELDS } from "@/lib/specFields";
import { normalizeAttributeValues } from "@/lib/vehicleTypes";
import { findExistingVehicles, birebirAyniArac } from "@/lib/existingVehicle";
import { syncAiVehicleSummary } from "@/lib/ai/vehicleSummary";

const YAZ = process.argv.includes("--yaz");
const AI = process.argv.includes("--ai");
const KAYIT = path.join(process.cwd(), "scripts", "toplu-ekle", "spec-doldur-kayit.jsonl");
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const ids = [...new Set(fs.readFileSync(path.join(process.cwd(), "scripts", "toplu-ekle", "eklenenler.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l).id as number))];
  const urunler = await prisma.product.findMany({ where: { id: { in: ids } }, include: { brand: true, model: true, category: true, aiSummary: { select: { id: true } } }, orderBy: { id: "asc" } });
  console.log("denetlenen:", urunler.length);

  // 1) özellikler
  let duzeltilen = 0;
  for (const p of urunler) {
    const attrs = p.attributes as Record<string, unknown>;
    const alanlar = new Map((SPEC_FIELDS[p.category.slug] ?? []).map((f) => [f.key, f]));
    const strAttrs = Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, String(v)]));
    const yeni: Record<string, unknown> = {};
    const sorunlar: string[] = [];
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "fuel_type") { if (["GASOLINE", "DIESEL", "EV", "PHEV", "HYBRID", "LPG"].includes(String(v))) yeni[k] = v; else sorunlar.push(`geçersiz yakıt:${v}`); continue; }
      const f = alanlar.get(k);
      if (!f) { sorunlar.push(`tanımsız:${k}`); continue; }
      if (f.showIf && !f.showIf(strAttrs)) { sorunlar.push(`koşula uymaz:${k}`); continue; }
      if (f.type === "select" && !f.options.some((o) => o.value === String(v))) { sorunlar.push(`geçersiz seçenek:${k}=${v}`); continue; }
      if (f.type === "number" && (typeof v !== "number" || !Number.isFinite(v))) { const n = Number(v); if (Number.isFinite(n) && v !== "") { yeni[k] = n; sorunlar.push(`tür:${k} sayıya çevrildi`); continue; } sorunlar.push(`sayı değil:${k}=${v}`); continue; }
      if (f.type === "boolean" && typeof v !== "boolean") { sorunlar.push(`bool değil:${k}`); continue; }
      yeni[k] = v;
    }
    const norm = normalizeAttributeValues(yeni);
    if (sorunlar.length) {
      duzeltilen++;
      console.log(`  ${p.id} ${p.slug.slice(0, 44).padEnd(44)} ${sorunlar.join("; ")}`);
      if (YAZ) {
        fs.appendFileSync(KAYIT, JSON.stringify({ id: p.id, slug: p.slug, once: p.attributes, eklenen: {}, kaynak: "onay-kontrolleri", tarih: new Date().toISOString() }) + "\n");
        await prisma.product.update({ where: { id: p.id }, data: { attributes: norm as never } });
      }
    }
  }
  console.log(`özellik sorunu olan kart: ${duzeltilen}`);

  // 2) kopya taraması
  let kopya = 0;
  for (const p of urunler) {
    const attrs = p.attributes as Record<string, unknown>;
    const benzerler = await findExistingVehicles(p.brand.name, p.model.name, p.category.slug);
    const ayni = benzerler.filter((m) => m.slug !== p.slug && birebirAyniArac(m, { year: p.year, trimName: p.trimName, fuelType: (attrs.fuel_type as string) ?? null, transmission: (attrs.transmission as string) ?? null }));
    if (ayni.length) { kopya++; console.log(`  KOPYA? ${p.slug} ↔ ${ayni.map((a) => a.slug).join(", ")}`); }
  }
  console.log(`birebir kopya şüphesi: ${kopya}`);

  // 4) görsel/atıf
  const gorselsiz = urunler.filter((p) => !p.imageUrl).length;
  const atifsiz = urunler.filter((p) => p.imageUrl && !p.imageCredit).length;
  const pasif = urunler.filter((p) => p.status !== "ACTIVE" || !p.isActive).length;
  console.log(`görselsiz: ${gorselsiz} · görselli ama atıfsız: ${atifsiz} · aktif olmayan: ${pasif}`);

  // 3) AI özeti
  if (AI) {
    const eksik = urunler.filter((p) => !p.aiSummary && p.status === "ACTIVE");
    console.log(`AI özeti olmayan: ${eksik.length}`);
    let olusan = 0;
    for (const p of eksik) {
      await syncAiVehicleSummary(p.id).catch((e) => console.error("  [ai]", p.id, String(e).slice(0, 80)));
      const var_ = await prisma.aiVehicleSummary.findUnique({ where: { productId: p.id }, select: { id: true } });
      if (var_) olusan++;
      await bekle(1200);
    }
    console.log(`AI özeti oluşan: ${olusan}/${eksik.length}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
