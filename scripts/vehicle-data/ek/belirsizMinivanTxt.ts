// ek/belirsiz-minivan/*.json + ek/rapor-minivan/*.md → kullanıcıya verilecek TEK metin dosyası.
// Çalıştır: npx tsx scripts/vehicle-data/ek/belirsizMinivanTxt.ts "<çıktı yolu>.txt"
import fs from "fs";
import path from "path";

const kok = path.join(process.cwd(), "scripts", "vehicle-data", "ek");
const cikti = process.argv[2];
if (!cikti) throw new Error("Çıktı yolu verilmedi");

type Belirsiz = { marka: string; model: string; versiyon?: string; paket?: string; neden: string };
const dosyalar = fs.readdirSync(path.join(kok, "belirsiz-minivan")).filter((f) => f.endsWith(".json")).sort();
const markalar: { marka: string; belirsiz: Belirsiz[]; rapor: string[] }[] = [];
for (const f of dosyalar) {
  const rapor = fs.readFileSync(path.join(kok, "rapor-minivan", f.replace(".json", ".md")), "utf8").split(/\r?\n/);
  markalar.push({ marka: rapor[0].replace(/^###\s*/, ""), belirsiz: JSON.parse(fs.readFileSync(path.join(kok, "belirsiz-minivan", f), "utf8")), rapor });
}
markalar.sort((a, b) => a.marka.localeCompare(b.marka, "tr"));

const sayim = (r: string[], kat: string) => {
  const m = r.find((x) => x.startsWith(`- ${kat}:`))?.match(/zaten vardı (\d+) · eklendi (\d+) · belirsiz (\d+)/);
  return m ? { var: +m[1], eklendi: +m[2], belirsiz: +m[3] } : { var: 0, eklendi: 0, belirsiz: 0 };
};
let toplamVar = 0, toplamEklendi = 0, toplamBelirsiz = 0;
for (const m of markalar) for (const kat of ["kamyonet", "otomobil"]) {
  const s = sayim(m.rapor, kat);
  toplamVar += s.var; toplamEklendi += s.eklendi; toplamBelirsiz += s.belirsiz;
}

const out: string[] = [];
const yaz = (...s: string[]) => out.push(...s);
const cizgi = "=".repeat(78);
yaz(
  "FİKAPE — MİNİVAN & PANELVAN: EKLENEMEYEN / NET OLMAYAN KAYITLAR",
  "Kaynak: Fikape Araç Katalog\\Minivan & Panelvan\\Minivan-Panelvan_katalog.txt",
  `Oluşturulma: ${new Date().toISOString().slice(0, 10)}`,
  "",
  `${markalar.length} marka işlendi. Kamyonet kategorisine eklendi; katalogda adıyla zaten otomobil kategorisinde bulunan modellere (ör. Chrysler Grand Voyager) kopya açmamak için kayıtlar orada işlendi.`,
  `Sonuç: ${toplamVar} satır katalogda zaten vardı (eklenmedi) · ${toplamEklendi} satır/model eklendi · ${toplamBelirsiz} satır belirsiz olduğu için EKLENMEDİ.`,
  "",
  "KURALLAR (yorum/tahmin yok):",
  "  • Katalogda adıyla bulunan model (aksan/boşluk/büyük-küçük harf duyarsız) varsa satırlar o modele işlendi; resmi listede ya da eski seçeneklerde zaten olan satırlar tekrar eklenmedi.",
  "  • Satırın TÜM sözcükleri mevcut bir kayıtta geçmiyorsa 'zaten var' sayılmadı (ör. '1.6 HDi Combi SX' ile '1.6 HDi X' aynı sayılmadı).",
  "  • Kaynakta model yılı yok: yılı olmayan satırlar ve yeni modeller 1986-2026 arası seçilebilir (daha önce otomobil için verdiğiniz karar).",
  "  • Adı katalogdakine benzeyen ama aynı olmayan modeller (ör. 'Doblo Cargo' ↔ 'Doblo') birleştirilmedi, kendi adıyla ayrı model açıldı; B bölümünde listeli.",
  "  • Paketi olmayan satırlar 'Standart' paketiyle yazıldı. 'm³' → 'm3' (yabancı simge kuralı).",
  "",
  cizgi, "A) EKLENMEYEN (BELİRSİZ) SATIRLAR", cizgi,
);
const belirsizler = markalar.flatMap((m) => m.belirsiz);
if (!belirsizler.length) yaz("", "(yok)");
for (const m of markalar) {
  if (!m.belirsiz.length) continue;
  yaz("", `■ ${m.marka}  (${m.belirsiz.length} satır)`);
  for (const b of m.belirsiz) yaz(`  - [${b.model}] ${[b.versiyon, b.paket].filter(Boolean).join(" › ")}: ${b.neden}`);
}

yaz("", cizgi, "B) ADI KATALOGDAKİNE BENZEYEN AMA AYNI OLMAYAN → AYRI MODEL OLARAK AÇILANLAR (gözden geçirin)", cizgi);
for (const m of markalar) {
  const l = m.rapor.filter((r) => r.includes("~ benzer ad:")).map((r) => r.replace(/^\s*-\s*~ benzer ad:\s*/, "").replace(/^[^:]+:\s*/, ""));
  if (l.length) yaz("", `■ ${m.marka}`, ...l.map((x) => `  ${x}`));
}

yaz("", cizgi, "C) KATALOGDA OLMAYAN VE YENİ AÇILAN MODELLER (yıl: 1986-2026 arası seçilebilir)", cizgi);
for (const m of markalar) {
  const l = m.rapor.filter((r) => r.includes("Yeni model:")).map((r) => r.replace(/^\s*-\s*\+\s*Yeni model:\s*/, "").replace(/\s*—.*$/, ""));
  if (l.length) yaz("", `■ ${m.marka}: ${l.join(" · ")}`);
}

yaz("", cizgi, "D) OTOMOBİL KATEGORİSİNDEKİ MODELLERE İŞLENENLER (kopya açılmasın diye)", cizgi);
for (const m of markalar) {
  const s = sayim(m.rapor, "otomobil");
  if (s.var + s.eklendi + s.belirsiz === 0) continue;
  yaz("", `■ ${m.marka}: zaten vardı ${s.var} · eklendi ${s.eklendi} · belirsiz ${s.belirsiz}`);
}

fs.writeFileSync(cikti, out.join("\r\n") + "\r\n", "utf8");
console.log(`Yazıldı: ${cikti} (${out.length} satır)`);
