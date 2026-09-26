/**
 * TSB Kasko Değer Listesi → otomobil/kamyonet katalog taslağı.
 *
 * Çalıştır: npx tsx scripts/vehicle-data/tsb/build.ts [xlsx yolu]
 * Varsayılan girdi: scripts/vehicle-data/_kaynak/ içindeki en yeni .xlsx
 *
 * vehicles.json'a DOKUNMAZ. Çıktılar scripts/vehicle-data/_inceleme/ altına:
 *   tsb-katalog.json  — marka → model → tip kayıtları (tüm alanlar + kaynak)
 *   rapor.md          — kapsam, alan doluluk oranları, model listesi, şüpheli kelimeler
 */
import fs from "fs";
import path from "path";
import { readTsbXlsx } from "./xlsx";
import { parseTip, type Deglue, type ParsedTip } from "./parseTip";
import { EV_ONLY_MODELS, fold } from "./rules";
import { motorMetinleriniTutarliYap } from "./motorTutarlilik";

const root = path.join(process.cwd(), "scripts", "vehicle-data");
const kaynakDir = path.join(root, "_kaynak");
const outDir = path.join(root, "_inceleme");

const input =
  process.argv[2] ??
  path.join(
    kaynakDir,
    fs.readdirSync(kaynakDir).filter((f) => f.endsWith(".xlsx")).sort().at(-1) ?? "",
  );

const { baslik, rows } = readTsbXlsx(input);

export type KatalogTip = ParsedTip & { tsbKod: string; ham: string; yillar: number[] };

// ─── Bitişik kelime ayırıcı ──────────────────────────────────────────────
// TSB bazı satırlarda boşlukları atlamış ("C5AIRCROSS FEELADVENTURE"). Tüm
// listede sık geçen kelimelerden bir sözlük kurup, nadir ve uzun bir kelimeyi
// bu sözlükteki kelimelere TAMAMEN bölünebiliyorsa bölüyoruz.
const frekans = new Map<string, number>();
for (const r of rows) {
  for (const w of fold(r.tip).replace(/\\/g, " ").replace(/[()]/g, " ").split(" ")) {
    if (w) frekans.set(w, (frekans.get(w) ?? 0) + 1);
  }
}
const sozluk = new Set(
  [...frekans].filter(([w, n]) => (/^\d+(\.\d+)?[A-Z]?$/.test(w) ? n >= 2 : n >= 5 && w.length >= 3)).map(([w]) => w),
);
const deglue: Deglue = (token) => {
  if (token.length < 8 || (frekans.get(token) ?? 0) > 2 || sozluk.has(token)) return null;
  // En az parçalı bölünme (dinamik programlama)
  const best: (string[] | null)[] = Array(token.length + 1).fill(null);
  best[0] = [];
  for (let i = 0; i < token.length; i++) {
    if (!best[i]) continue;
    for (let j = i + 2; j <= token.length; j++) {
      const piece = token.slice(i, j);
      if (!sozluk.has(piece)) continue;
      const cand = [...best[i]!, piece];
      if (!best[j] || cand.length < best[j]!.length) best[j] = cand;
    }
  }
  const out = best[token.length];
  return out && out.length >= 2 ? out : null;
};

// ─── Rakamlı model adları ────────────────────────────────────────────────
// Bir ilk kelimenin TÜM satırlarında ardından tek rakam geliyor ve en az iki farklı
// rakam görülüyorsa rakam model adının parçasıdır: ATTO 2 / ATTO 3, TIGGO 7 / TIGGO 8,
// DELIVER 7 / DELIVER 9. Rakamdan sonra kapı/kişi/kasa kelimesi geliyorsa sayılmaz
// ("4x4 2 KAPI", "H-1 3 PANELVAN").
const KAPI_KASA_RE = /^(KAPI|KOLTUK\w*|KISI\w*|PANELVAN|VAN|MINIBUS|KAMYONET|CAMLIVAN|K)$/;
const ilkKelime = new Map<string, { rakamlar: Set<string>; hepsiRakam: boolean }>();
for (const r of rows) {
  const t = fold(r.tip).replace(/\\/g, " ").split(" ");
  const k = `${r.marka}|${t[0]}`;
  const e = ilkKelime.get(k) ?? { rakamlar: new Set<string>(), hepsiRakam: true };
  if (t[1] && /^\d$/.test(t[1]) && !KAPI_KASA_RE.test(t[2] ?? "")) e.rakamlar.add(t[1]);
  else e.hepsiRakam = false;
  ilkKelime.set(k, e);
}
const rakamliModeller = new Set<string>();
for (const [k, e] of ilkKelime) {
  if (e.hepsiRakam && e.rakamlar.size >= 2) for (const d of e.rakamlar) rakamliModeller.add(`${k} ${d}`);
}

console.log("Rakamlı modeller:", [...rakamliModeller].join(", "));
const tipler: KatalogTip[] = [];
const disarida: Record<string, number> = {};
for (const r of rows) {
  const res = parseTip(r.marka, r.tip, deglue, rakamliModeller);
  if (!res.ok) { disarida[res.neden] = (disarida[res.neden] ?? 0) + 1; continue; }
  tipler.push({ ...res.value, tsbKod: `${r.markaKodu}-${r.tipKodu}`, ham: r.tip, yillar: r.yillar });
}

// Not: "otomatik eşi varsa işaretsiz olan manueldir" (kardeş satır) kuralı
// denendi ve KALDIRILDI (2026-09-23 denetimi): TSB yalnız otomatik satılan
// araçlarda da vites işaretini bazı satırlarda atlıyor (C 180 Coupe 2016,
// Mokka X 1.6 Dizel FWD). İşaretsiz vites kullanıcıya sorulur.

// ─── Gruplama ─────────────────────────────────────────────────────────────
type ModelOut = { model: string; yilAraligi: [number, number]; tipler: KatalogTip[] };
const katalog: Record<string, Record<string, Record<string, ModelOut>>> = { otomobil: {}, kamyonet: {} };
for (const t of tipler) {
  const byMake = (katalog[t.category][t.make] ??= {});
  const m = (byMake[t.modelKey] ??= { model: t.model, yilAraligi: [9999, 0], tipler: [] });
  m.tipler.push(t);
  for (const y of t.yillar) {
    m.yilAraligi[0] = Math.min(m.yilAraligi[0], y);
    m.yilAraligi[1] = Math.max(m.yilAraligi[1], y);
  }
}
for (const kategori in katalog) {
  for (const marka in katalog[kategori]) {
    for (const modelKey in katalog[kategori][marka]) {
      motorMetinleriniTutarliYap(katalog[kategori][marka][modelKey].tipler);
    }
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "tsb-katalog.json"),
  JSON.stringify({ kaynak: path.basename(input), baslik, katalog }, null, 1) + "\n",
);

// ─── Rapor ────────────────────────────────────────────────────────────────
const pct = (n: number, d: number) => `${((n / d) * 100).toFixed(1)}%`;
const say = <T,>(arr: T[], f: (x: T) => string | null) => {
  const o: Record<string, number> = {};
  for (const x of arr) { const k = f(x) ?? "(boş)"; o[k] = (o[k] ?? 0) + 1; }
  return Object.entries(o).sort((a, b) => b[1] - a[1]);
};

const lines: string[] = [];
lines.push(`# TSB dönüşüm raporu — ${baslik} (${path.basename(input)})`, "");
lines.push(`Toplam TSB satırı: ${rows.length} · Kataloğa giren: ${tipler.length}`, "");
lines.push("## Dışarıda kalanlar", ...Object.entries(disarida).map(([k, v]) => `- ${k}: ${v}`), "");

for (const cat of ["otomobil", "kamyonet"] as const) {
  const ts = tipler.filter((t) => t.category === cat);
  lines.push(`## ${cat} — ${ts.length} tip, ${Object.keys(katalog[cat]).length} marka`, "");
  lines.push("| Alan | Dolu | Kaynak dağılımı |", "|---|---|---|");
  lines.push(`| Motor | ${pct(ts.filter((t) => t.motor).length, ts.length)} | |`);
  lines.push(`| Beygir | ${pct(ts.filter((t) => t.hp).length, ts.length)} | |`);
  lines.push(`| Paket | ${pct(ts.filter((t) => t.paket).length, ts.length)} | |`);
  lines.push(`| Kasa | ${pct(ts.filter((t) => t.kasa).length, ts.length)} | |`);
  lines.push(`| Yakıt | ${pct(ts.filter((t) => t.yakit).length, ts.length)} | ${say(ts, (t) => t.yakit).map(([k, v]) => `${k}:${v}`).join(" ")} |`);
  lines.push(`| Vites | ${pct(ts.filter((t) => t.vites).length, ts.length)} | ${say(ts, (t) => t.vitesKaynak).map(([k, v]) => `${k}:${v}`).join(" ")} |`);
  lines.push("");
}

lines.push("## Marka → modeller (tip sayısı, yıl aralığı)", "");
for (const cat of ["otomobil", "kamyonet"] as const) {
  lines.push(`### ${cat}`);
  for (const [make, models] of Object.entries(katalog[cat]).sort()) {
    const list = Object.values(models)
      .sort((a, b) => b.tipler.length - a.tipler.length)
      .map((m) => `${m.model} (${m.tipler.length}, ${m.yilAraligi[0]}–${m.yilAraligi[1]})`);
    lines.push(`- **${make}**: ${list.join(" · ")}`);
  }
  lines.push("");
}

// Paket alanına düşen kelimeler — motor/kasa/vites sözlüğünde eksik kalanları yakalamak için
const kelime: Record<string, number> = {};
for (const t of tipler) for (const w of (t.paket ?? "").split(" ")) if (w) kelime[w] = (kelime[w] ?? 0) + 1;
lines.push("## Paket alanındaki en sık 400 kelime", "");
lines.push(Object.entries(kelime).sort((a, b) => b[1] - a[1]).slice(0, 400).map(([k, v]) => `${k}:${v}`).join(" · "), "");

lines.push("## Kaynağa uygulanan düzeltmeler (yazım hatası / bitişik kelime)", "");
lines.push(...say(tipler.flatMap((t) => t.duzeltmeler), (x) => x).map(([k, v]) => `- ${k} (${v})`), "");

// Ölü kural kontrolü: sözlükte adı geçen ama katalogda hiçbir modele denk gelmeyen
// kurallar sessizce işlevsiz kalır (ör. model "E-DELIVER" → "E-DELIVER 3" olarak
// bölününce "yalnız elektrikli" kuralı kopmuştu). Her çalıştırmada listelenir.
const mevcutModeller = new Set(tipler.map((t) => `${t.make}|${t.modelKey}`));
const olu = Object.entries(EV_ONLY_MODELS).flatMap(([mk, ms]) => ms.filter((m) => !mevcutModeller.has(`${mk}|${m}`)).map((m) => `${mk} ${m}`));
lines.push("## Hiçbir modele denk gelmeyen 'yalnız elektrikli' kuralları", olu.length ? olu.join(" · ") : "(yok)", "");
if (olu.length) console.warn(`⚠️ Eşleşmeyen EV kuralı: ${olu.join(", ")}`);

lines.push("## Uyarılar", ...say(tipler.flatMap((t) => t.uyarilar), (x) => x).map(([k, v]) => `- ${k}: ${v}`), "");

fs.writeFileSync(path.join(outDir, "rapor.md"), lines.join("\n") + "\n");
console.log(`✓ ${tipler.length} tip → ${path.relative(process.cwd(), outDir)}`);
console.log(lines.slice(0, 40).join("\n"));
