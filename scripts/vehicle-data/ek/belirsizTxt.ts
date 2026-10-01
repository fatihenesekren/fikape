// ek/belirsiz/*.json + ek/rapor/*.md → kullanıcıya verilecek TEK metin dosyası.
// Çalıştır: npx tsx scripts/vehicle-data/ek/belirsizTxt.ts "<çıktı yolu>.txt"
import fs from "fs";
import path from "path";

const kok = path.join(process.cwd(), "scripts", "vehicle-data", "ek");
const cikti = process.argv[2];
if (!cikti) throw new Error("Çıktı yolu verilmedi");

type Belirsiz = { marka: string; model: string; versiyon?: string; paket?: string; neden: string };

const slugler = fs.readdirSync(path.join(kok, "belirsiz")).filter((f) => f.endsWith(".json")).sort();
const markaBelirsiz = new Map<string, Belirsiz[]>();
const markaRapor = new Map<string, string[]>();
for (const f of slugler) {
  const liste = JSON.parse(fs.readFileSync(path.join(kok, "belirsiz", f), "utf8")) as Belirsiz[];
  const rapor = fs.readFileSync(path.join(kok, "rapor", f.replace(".json", ".md")), "utf8").split("\n");
  const marka = rapor[0].replace(/^###\s*/, "") || liste[0]?.marka || f;
  markaBelirsiz.set(marka, liste);
  markaRapor.set(marka, rapor);
}
const markalar = [...markaBelirsiz.keys()].sort((a, b) => a.localeCompare(b, "tr"));

const satirlar: string[] = [];
const yaz = (...s: string[]) => satirlar.push(...s);

const tumu = [...markaBelirsiz.values()].flat();
const markaAtlanan = markalar.filter((m) => markaBelirsiz.get(m)!.some((b) => b.model === "(tüm marka)"));
yaz(
  "FİKAPE — EKLENEMEYEN / NET OLMAYAN ARAÇLAR",
  "Kaynak: Fikape Araç Katalog\\Otomobil-Kamyonet (marka marka paylaştığınız katalog metinleri)",
  `Oluşturulma: ${new Date().toISOString().slice(0, 10)}`,
  "",
  `Bu dosya, paylaştığınız katalogdan mevcut Fikape kataloğuna KOPYA OLUŞTURMADAN eklenemeyen ya da internetten doğrulanamayan kayıtları içerir.`,
  `Toplam ${markalar.length} marka işlendi; bu listede ${tumu.length} satır var. "Bakılacak" olan her satırın nedeni yanında yazılıdır.`,
  "",
  "NASIL OKUNUR",
  "  • 'yıl yok'      : Katalogda (resmi listede) bu kombinasyon yok ve model 2012 sonrasına uzanıyor; kaynak listede model yılı olmadığı için hangi yıllara yazılacağı bilinemedi.",
  "  • 'nesil belli değil': Modelin birden fazla eski nesli var; satırın hangisine ait olduğu kaynakta yazmıyor.",
  "  • 'model yok'    : Model katalogda yok ve internetten üretim yılı doğrulanamadı (doğrulananlar otomatik eklendi — son bölüme bakın).",
  "  • 'yazım'        : Paket/versiyon adı katalogdaki bir yazımdan 1 harf farklı (kaynak hatası olabilir), kopya olmasın diye eklenmedi.",
  "  • 'kasa tipi'    : Cabrio/Coupe/Sportback gibi gövde adı; formda kasa adımı kalktığı için versiyon/paket olarak eklenmedi.",
  "",
  "=".repeat(78),
  "A) MARKA / KATEGORİ KARARI GEREKENLER (hiçbir satır eklenmedi)",
  "=".repeat(78),
);
for (const m of markaAtlanan) yaz("", `• ${m}`, `  ${markaBelirsiz.get(m)![0].neden}`);

yaz("", "=".repeat(78), "B) MARKA MARKA BELİRSİZ / EKLENEMEYEN KAYITLAR", "=".repeat(78));
const sinif = (neden: string) =>
  neden.startsWith("Katalogda (resmi") ? "yıl yok"
    : neden.startsWith("Eski nesillerin") || neden.startsWith("Birden fazla eski") || neden.startsWith("Katalogda aynı adlı") ? "nesil belli değil"
      : neden.startsWith("Kasa") ? "kasa tipi"
        : neden.includes("yazım") || neden.includes("Yazım") ? "yazım"
          : neden.startsWith("Kaynak dosya") ? "kaynak dosya hatası"
            : "diğer";
for (const m of markalar) {
  if (markaAtlanan.includes(m)) continue;
  const liste = markaBelirsiz.get(m)!;
  if (!liste.length) continue;
  yaz("", `■ ${m}  (${liste.length} satır)`);
  // model + neden sınıfına göre grupla; aynı neden metni tekrar etmesin
  const gruplar = new Map<string, Belirsiz[]>();
  for (const b of liste) {
    const anahtar = `${b.model}\u0000${b.versiyon === undefined && b.paket === undefined ? b.neden : sinif(b.neden) + "|" + b.neden.replace(/\(.*?\)/g, "()").slice(0, 60)}`;
    gruplar.set(anahtar, [...(gruplar.get(anahtar) ?? []), b]);
  }
  for (const arr of gruplar.values()) {
    const ilk = arr[0];
    const etiket = ilk.versiyon === undefined && ilk.paket === undefined ? "model" : sinif(ilk.neden);
    yaz(`  - [${ilk.model}] ${etiket}: ${ilk.neden}`);
    const detay = arr.filter((b) => b.versiyon !== undefined || b.paket !== undefined).map((b) => [b.versiyon, b.paket].filter(Boolean).join(" › "));
    if (detay.length) {
      const dilim = 8;
      for (let i = 0; i < detay.length; i += dilim) yaz(`      ${detay.slice(i, i + dilim).join(" | ")}`);
    }
  }
}

yaz("", "=".repeat(78), "C) KOPYA OLMASIN DİYE KATALOGDAKİ BAŞKA ADA EŞLEDİĞİM MODELLER (gözden geçirin)", "=".repeat(78));
for (const m of markalar) {
  const eslemeler = (markaRapor.get(m) ?? []).filter((r) => r.includes("~ eşleme:")).map((r) => r.replace(/^\s*-\s*~ eşleme:\s*/, ""));
  if (eslemeler.length) yaz("", `■ ${m}`, ...eslemeler.map((e) => `  ${e}`));
}

yaz("", "=".repeat(78), "D) İNTERNETTEN YILI DOĞRULANARAK YENİ EKLENEN MODELLER (kaynak ile)", "=".repeat(78));
for (const m of markalar) {
  const yeni = (markaRapor.get(m) ?? []).filter((r) => r.includes("Yeni model:")).map((r) => r.replace(/^\s*-\s*\+\s*/, ""));
  if (yeni.length) yaz("", `■ ${m}`, ...yeni.map((e) => `  ${e}`));
}
yaz("", "Not: Çok nesilli modellerde yıl aralığı tüm nesilleri kapsar (1990 öncesi kırpıldı). Türkiye'de satılan yıllar bu aralığın içinde kalır.");

fs.writeFileSync(cikti, satirlar.join("\r\n") + "\r\n", "utf8");
console.log(`Yazıldı: ${cikti} (${satirlar.length} satır)`);
