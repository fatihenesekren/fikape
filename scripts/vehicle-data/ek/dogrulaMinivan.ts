// Minivan & Panelvan kaynağındaki HER satırın sonuçta (a) katalogda var, (b) belirsiz listesinde olduğunu bağımsız olarak sınar.
// Çalıştır: npx tsx scripts/vehicle-data/ek/dogrulaMinivan.ts
import fs from "fs";
import path from "path";
import { parseEk } from "./parseEk";
import type { KatalogMarkaDosyasi } from "../../../src/lib/katalog/tipler";

const kok = path.join(process.cwd(), "scripts", "vehicle-data", "ek");
const anahtar = (s: string) => s.normalize("NFD").replace(/\p{Mn}/gu, "").replace(/³/g, "3").toUpperCase().replace(/[^A-Z0-9]/g, "");
const jetonlar = (s: string) => new Set(s.normalize("NFD").replace(/\p{Mn}/gu, "").replace(/³/g, "3").toUpperCase().replace(/\+/g, " PLUS ").split(/[^A-Z0-9.]+/).filter((j) => j && !/^\d{2,4}$/.test(j)));
const kapsar = (buyuk: Set<string>, kucuk: Set<string>) => [...kucuk].every((j) => buyuk.has(j));
const slug = (s: string) => s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let toplam = 0, bulundu = 0, belirsizde = 0;
const eksik: string[] = [];
for (const f of fs.readdirSync(path.join(kok, "kaynak-minivan")).filter((x) => x.endsWith(".txt")).sort()) {
  const ek = parseEk(fs.readFileSync(path.join(kok, "kaynak-minivan", f), "utf8"));
  const dosyalar: KatalogMarkaDosyasi[] = [];
  for (const kat of ["kamyonet", "otomobil"]) {
    const yol = path.join(process.cwd(), "public", "katalog", kat, slug(ek.marka) + ".json");
    if (fs.existsSync(yol)) dosyalar.push(JSON.parse(fs.readFileSync(yol, "utf8")));
  }
  const belirsiz = JSON.parse(fs.readFileSync(path.join(kok, "belirsiz-minivan", slug(ek.marka) + ".json"), "utf8")) as { model: string; versiyon?: string; paket?: string }[];
  for (const [mAd, m] of ek.modeller) {
    // modeli (ad anahtarı eşit) bul
    const modeller = dosyalar.flatMap((d) => d.modeller).filter((x) => anahtar(x.ad.replace(/\([^)]*\)/g, "")) === anahtar(mAd.replace(/\([^)]*\)/g, "")));
    toplam++;
    if (!modeller.length) { eksik.push(`${ek.marka} › ${mAd}: MODEL katalogda yok`); continue; }
    bulundu++;
    const havuzV = new Set<string>(), havuzP = new Set<string>();
    for (const mo of modeller) {
      for (const t of mo.tipler) { havuzV.add(anahtar(t.v)); if (t.p) havuzP.add(anahtar(t.p)); }
      for (const n of mo.nesiller) {
        for (const v of n.el?.versiyonlar ?? []) havuzV.add(anahtar(v));
        for (const p of n.el?.paketler ?? []) havuzP.add(anahtar(p));
        for (const ps of Object.values(n.el?.paketlerVersiyona ?? {})) for (const p of ps) havuzP.add(anahtar(p));
      }
    }
    // Resmi (TSB) satırlar: v + p + k jetonları; el seçenekleri: versiyon / paket listeleri
    const tipJetonlari = modeller.flatMap((mo) => mo.tipler.map((t) => jetonlar(`${t.v} ${t.p ?? ""} ${t.k ?? ""}`)));
    const elV = modeller.flatMap((mo) => mo.nesiller.flatMap((n) => (n.el?.versiyonlar ?? []).map(jetonlar)));
    const elP = modeller.flatMap((mo) => mo.nesiller.flatMap((n) => [...(n.el?.paketler ?? []), ...Object.values(n.el?.paketlerVersiyona ?? {}).flat()].map(jetonlar)));
    for (const [v, paketler] of m.versiyonlar) {
      if (!v) continue;
      const satirlar = paketler.size ? [...paketler] : [""];
      for (const p of satirlar) {
        toplam++;
        const bel = belirsiz.some((b) => b.model === mAd && (b.versiyon !== undefined && anahtar(b.versiyon) === anahtar(v)) && (b.paket === undefined || anahtar(b.paket) === anahtar(p || "Standart")));
        const satirJ = jetonlar(`${v} ${p}`);
        const vJ = jetonlar(v), pJ = jetonlar(p);
        const kapli =
          anahtar(v) === anahtar(mAd) ||
          tipJetonlari.some((t) => kapsar(t, satirJ)) ||
          (elV.some((e) => kapsar(e, vJ)) && (!p || elP.some((e) => kapsar(e, pJ)) || tipJetonlari.some((t) => kapsar(t, pJ))));
        if (kapli) bulundu++;
        else if (bel) belirsizde++;
        else eksik.push(`${ek.marka} › ${mAd} › ${v}${p ? " › " + p : ""}: katalogda/belirsizde yok`);
      }
    }
  }
}
console.log(`toplam kontrol: ${toplam} · katalogda: ${bulundu} · belirsiz listesinde: ${belirsizde} · EKSİK: ${eksik.length}`);
for (const e of eksik.slice(0, 80)) console.log("  " + e);
