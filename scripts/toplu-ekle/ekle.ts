// Admin akışıyla (aracEkle: aynı doğrulama + kopya/benzerlik kontrolü + denetim kaydı) toplu araç ekleme.
// Veri uydurmaz: her araç public/katalog/<kategori>/<marka>.json'daki RESMİ bir tipten (yıl, versiyon, paket, yakıt, vites, beygir) üretilir.
//
// Kullanım:  npx tsx scripts/toplu-ekle/ekle.ts <hedef.json> <kategori>            → kuru çalıştırma (yazmaz)
//            npx tsx scripts/toplu-ekle/ekle.ts <hedef.json> <kategori> --yaz       → gerçekten ekler
// hedef.json: [{ "marka": "Toyota", "model": "Corolla", "yil"?: 2026, "paket"?: "Dream", "yakit"?: "DIESEL" }]
import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { aracEkle, IsHatasi } from "@/lib/katalog/urunServis";
import { aracEkleSema } from "@/lib/katalog/urunDogrula";
import type { KatalogMarkaDosyasi, KatalogTip } from "@/lib/katalog/tipler";
import { slugify } from "@/lib/slugify";
import { stripModelGenRange } from "@/lib/modelDisplay";

const [hedefYol, kategori, bayrak] = process.argv.slice(2);
if (!hedefYol || !kategori) throw new Error("Kullanım: ekle.ts <hedef.json> <kategori> [--yaz]");
const YAZ = bayrak === "--yaz";
/** "Güncel" ölçüsü: yalnız bu yıl ve sonrası satılan resmi tipler (daha eskisi güncel model sayılmaz, atlanır ve raporlanır). */
const ENAZ_YIL = 2024;

type Hedef = { marka: string; model: string; yil?: number; paket?: string; yakit?: string; vites?: string; dogrudan?: boolean; versiyon?: string | null };

/** Resmi tipler arasından örnek seç: en güncel yıl; yakıt+vites belli olanlar; beygire göre ortadaki. */
function tipSec(tipler: KatalogTip[], h: Hedef): { tip: KatalogTip; yil: number } | null {
  // En güncel yıl: yakıt+vites belli (eklenebilir) resmi tipler arasından; güncel yılda eksik veri varsa bir önceki yıla düşer.
  // Katalogda vites hiç belli değilse (ör. motosiklet) hedef dosyasındaki açık `vites` kullanılır.
  const uygun = tipler.filter((t) => !t.g && t.f && (t.t || h.vites) && (!h.yakit || t.f === h.yakit));
  const yillar = uygun.flatMap((t) => t.y).filter((y) => y >= ENAZ_YIL && (!h.yil || y === h.yil));
  if (!yillar.length) return null;
  const yil = Math.max(...yillar);
  let adaylar = uygun.filter((t) => t.y.includes(yil));
  if (h.paket) adaylar = adaylar.filter((t) => (t.p ?? "").toLowerCase() === h.paket!.toLowerCase());
  if (h.yakit) adaylar = adaylar.filter((t) => t.f === h.yakit);
  if (!adaylar.length) return null;
  adaylar.sort((a, b) => (a.hp ?? 0) - (b.hp ?? 0));
  return { tip: adaylar[Math.floor((adaylar.length - 1) / 2)], yil };
}

async function main() {
  const hedefler: Hedef[] = JSON.parse(fs.readFileSync(hedefYol, "utf8"));
  const admin = await prisma.user.findFirst({ where: { trustLevel: { gte: 5 } }, orderBy: { id: "asc" }, select: { id: true, displayName: true } });
  if (!admin) throw new Error("Admin kullanıcı bulunamadı");
  const kimlik = { userId: admin.id, label: `${admin.displayName ?? "admin"} (toplu giriş betiği)` };

  const markaSay = new Map<string, number>();
  const ozet = { eklendi: 0, atlandi: 0 };
  for (const h of hedefler) {
    let girdi: Record<string, unknown>;
    let etiket: string;
    if (h.dogrudan) {
      // Eski biçimli kategoriler (e-scooter, e-bisiklet, karavan): alanlar hedef dosyasında hazır (yıl model adından okunmuş).
      // Kart adı temiz olsun (mevcut eski kategori kartları gibi): model adından '(2026-)' aralığı ve baştaki tekrar eden marka adı atılır.
      let modelAdi = stripModelGenRange(h.model);
      if (modelAdi.toLowerCase().startsWith(h.marka.toLowerCase() + " ")) modelAdi = modelAdi.slice(h.marka.length + 1);
      girdi = { kategori, marka: h.marka, model: modelAdi, versiyon: h.versiyon ?? null, paket: null, yil: h.yil, benzerlikOnayi: false, bildirimGonder: false };
      etiket = `${h.marka} ${modelAdi} ${h.yil}${h.versiyon ? ` · ${h.versiyon}` : ""}`;
    } else {
      const dosya = path.join(process.cwd(), "public", "katalog", kategori, `${slugify(h.marka)}.json`);
      if (!fs.existsSync(dosya)) { console.log(`✗ ${h.marka} ${h.model}: katalog dosyası yok`); ozet.atlandi++; continue; }
      const katalog = JSON.parse(fs.readFileSync(dosya, "utf8")) as KatalogMarkaDosyasi;
      const model = katalog.modeller.find((m) => m.ad.toLowerCase() === h.model.toLowerCase());
      if (!model) { console.log(`✗ ${h.marka} ${h.model}: katalogda model yok`); ozet.atlandi++; continue; }
      const secim = tipSec(model.tipler, h);
      if (!secim) { console.log(`✗ ${h.marka} ${h.model}: yakıt+vites belli resmi tip yok`); ozet.atlandi++; continue; }
      const { tip, yil } = secim;
      girdi = {
        kategori, marka: katalog.marka, model: model.ad, versiyon: tip.v || null, paket: tip.p ?? null, yil,
        yakit: tip.f, vites: tip.t ?? h.vites ?? null, beygir: tip.hp ?? null, benzerlikOnayi: false, bildirimGonder: false,
      };
      etiket = `${katalog.marka} ${model.ad} ${yil} · ${tip.v || "-"}${tip.hp ? ` ${tip.hp}hp` : ""} · ${tip.p ?? "Standart"} · ${tip.f}/${tip.t ?? h.vites}${tip.t ? "" : " (varsayım)"}`;
    }
    const ok = aracEkleSema.safeParse(girdi);
    if (!ok.success) { console.log(`✗ ${etiket}: doğrulama — ${ok.error.issues.map((i) => i.message).join("; ")}`); ozet.atlandi++; continue; }
    if (!YAZ) { console.log(`• ${etiket}`); continue; }
    try {
      const r = await aracEkle(kimlik, ok.data);
      markaSay.set(h.marka, (markaSay.get(h.marka) ?? 0) + 1);
      // Geri alma kaydı: eklenen her aracın id/slug'ı (aracSil ile toplu geri alınabilsin)
      fs.appendFileSync(path.join(process.cwd(), "scripts", "toplu-ekle", "eklenenler.jsonl"), JSON.stringify({ id: r.id, slug: r.slug, kategori, tarih: new Date().toISOString() }) + "\n");
      console.log(`✓ ${etiket} → /araclar/${r.slug}`);
      ozet.eklendi++;
    } catch (e) {
      if (e instanceof IsHatasi) { console.log(`✗ ${etiket}: ${e.status} ${String(e.govde.error)}`); ozet.atlandi++; }
      else throw e;
    }
  }
  console.log(YAZ ? `\nEklendi ${ozet.eklendi} · atlandı ${ozet.atlandi}` : "\n(kuru çalıştırma — hiçbir şey yazılmadı)");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
