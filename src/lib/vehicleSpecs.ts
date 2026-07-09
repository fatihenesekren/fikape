// Otomobil teknik özelliklerini CarQuery API + Wikipedia'dan çekip birleştiren
// paylaşılan mantık. /api/admin/fetch-specs (interaktif, admin öneri onayı) ve
// prisma/enrich-otomobil-bulk.ts (toplu zenginleştirme) tarafından ortak kullanılır.

import { WIKI_HEADERS } from "@/lib/vehicleImages";
import { stripModelGenRange } from "@/lib/modelDisplay";

function norm(s: string) { return (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

function slugifyMake(name: string) {
  return name.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function mapDrivetrain(d: string) {
  const l = norm(d);
  if (l.includes("front") || l === "fwd") return "FWD";
  if (l.includes("rear")  || l === "rwd") return "RWD";
  if (l.includes("all")   || l.includes("awd") || l.includes("4wd") || l.includes("4x4")) return "AWD";
  return "";
}
function mapTransmission(t: string) {
  const l = (t ?? "").toLowerCase();
  if (l.includes("auto")) return "Otomatik";
  if (l.includes("manual") || l.includes("manuel")) return "Manuel";
  if (l.includes("cvt")) return "CVT";
  return "";
}
function mapBodyType(b: string) {
  const l = norm(b);
  if (l.includes("suv") || l.includes("crossover") || l.includes("cuv")) return "suv";
  if (l.includes("sedan") || l.includes("saloon")) return "sedan";
  if (l.includes("hatch")) return "hatchback";
  if (l.includes("mpv") || l.includes("minivan")) return "mpv";
  if (l.includes("coupe")) return "coupe";
  if (l.includes("cabrio") || l.includes("convert") || l.includes("roadster")) return "cabrio";
  if (l.includes("pickup")) return "pickup";
  return "";
}

function stripHtml(s: string) {
  return s
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNumber(s: string): string | null {
  const cleaned = s.replace(/(\d)\s+(\d)/g, "$1$2").replace(/,/g, "");
  const m = cleaned.match(/\d+\.?\d*/);
  return m ? m[0] : null;
}

// ── Wikipedia helpers ────────────────────────────────────────────────────────

async function wikiSearch(brand: string, model: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${brand} ${model} automobile`)}&srlimit=5&format=json&origin=*`,
      { signal: AbortSignal.timeout(5000), headers: WIKI_HEADERS }
    );
    const data = await res.json();
    // Model.name'e gömülü nesil aralığı ("Corolla (2019-)") normalize sonrası
    // rakamlara dönüşüp eşleşmeyi bozuyordu — temiz isimle karşılaştır.
    const modelN = norm(stripModelGenRange(model));
    const hit = (data.query?.search ?? []).find((r: { title: string }) =>
      norm(r.title).includes(modelN.slice(0, 8))
    );
    return hit?.title ?? data.query?.search?.[0]?.title ?? null;
  } catch { return null; }
}

async function wikiSections(title: string): Promise<{ index: string; line: string }[]> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=sections&format=json&origin=*`,
      { signal: AbortSignal.timeout(5000), headers: WIKI_HEADERS }
    );
    const data = await res.json();
    return data.parse?.sections ?? [];
  } catch { return []; }
}

async function wikiSectionHtml(title: string, sectionIdx: string): Promise<string> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&section=${sectionIdx}&format=json&origin=*`,
      { signal: AbortSignal.timeout(8000), headers: WIKI_HEADERS }
    );
    const data = await res.json();
    return data.parse?.text?.["*"] ?? "";
  } catch { return ""; }
}

// ── Spec tablosu parse: satırlar = spec adı, sütunlar = trim varyantları ────

function parseSpecTable(
  html: string,
  trimHint: string | null
): Record<string, string> {
  const specs: Record<string, string> = {};

  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return {};

  const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  if (rows.length < 2) return {};

  let headerRowIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const cells = [...rows[i][1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
      .map((m) => stripHtml(m[1]));
    if (cells.length >= 2) { headers = cells; headerRowIdx = i; break; }
  }
  if (headerRowIdx === -1 || headers.length < 2) return {};

  let colIdx = 1;
  if (trimHint) {
    const tn = norm(trimHint);
    let bestScore = -1;
    headers.forEach((h, i) => {
      if (i === 0) return;
      const hn = norm(h);
      let score = 0;
      for (const c of hn) if (tn.includes(c)) score++;
      if (score > bestScore) { bestScore = score; colIdx = i; }
    });
  }

  const rowMap: Record<string, string> = {};
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const cells = [...rows[i][1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
      .map((m) => stripHtml(m[1]));
    if (cells.length < 2) continue;
    const key = cells[0].toLowerCase();
    const val = cells[colIdx] ?? cells[1] ?? "";
    if (key && val) rowMap[key] = val;
  }

  const get = (keys: string[]): string =>
    Object.entries(rowMap).find(([k]) => keys.some((kk) => k.includes(kk)))?.[1] ?? "";

  const engCC = get(["displacement", "engine", "cubic", "cc", "cm"]);
  if (engCC) {
    const ccNorm = engCC.replace(/(\d)\s+(\d)/g, "$1$2");
    const ccM = ccNorm.match(/([\d]+)\s*cm\s*[³3u]?/i) || ccNorm.match(/([\d]+)\s*cc/i);
    if (ccM && +ccM[1] > 400) { specs.engine_cc = ccM[1]; }
    else {
      const lM = ccNorm.match(/(\d+\.?\d*)\s*[Ll]/);
      if (lM) specs.engine_cc = String(Math.round(parseFloat(lM[1]) * 1000));
      else { const n = extractNumber(engCC); if (n && +n > 400 && +n < 15000) specs.engine_cc = n; }
    }
  }

  const pwr = get(["power", "output", "max. power"]);
  if (pwr) {
    const m = pwr.match(/(\d+)\s*(?:hp|ps|cv|bhp)/i);
    if (m) specs.power_hp = m[1];
    else {
      const kwM = pwr.match(/(\d+)\s*kw/i);
      if (kwM) specs.power_hp = String(Math.round(+kwM[1] * 1.341));
      else { const n = extractNumber(pwr); if (n && +n > 30) specs.power_hp = n; }
    }
  }

  const trq = get(["torque", "max. torque"]);
  if (trq) {
    const m = trq.match(/([\d]+)\s*n.?m/i);
    if (m) specs.torque_nm = m[1];
    else { const n = extractNumber(trq); if (n && +n > 50 && +n < 2000) specs.torque_nm = n; }
  }

  const acc = get(["0–100", "0-100", "acceleration", "0 to 100"]);
  if (acc) {
    const n = extractNumber(acc.replace(/(\d),(\d)/g, "$1.$2"));
    if (n) specs.zero_to_100 = n;
  }

  const spd = get(["top speed", "maximum speed", "max speed", "max. speed"]);
  if (spd) { const n = extractNumber(spd); if (n && +n > 80) specs.top_speed_kmh = n; }

  const wt = get(["curb weight", "kerb weight", "weight", "mass"]);
  if (wt) {
    const m = wt.match(/([\d,]+)\s*kg/i);
    if (m) { const n = m[1].replace(/,/g, ""); if (+n > 500) specs.weight_kg = n; }
    else { const n = extractNumber(wt); if (n && +n > 500) specs.weight_kg = n; }
  }

  const tank = get(["fuel capacity", "fuel tank", "tank"]);
  if (tank) {
    const m = tank.match(/([\d.]+)\s*(?:l|litre|liter)/i);
    if (m) specs.tank_l = m[1];
    else { const n = extractNumber(tank); if (n && +n > 20) specs.tank_l = n; }
  }

  const tx = get(["transmission", "gearbox"]);
  if (tx) { const v = mapTransmission(tx); if (v) specs.transmission = v; }

  const dr = get(["drive", "drivetrain", "drive type", "drive wheels"]);
  if (dr) { const v = mapDrivetrain(dr); if (v) specs.drivetrain = v; }

  return specs;
}

// ── Wikipedia: madde metninden ağırlık / bagaj çıkar ────────────────────────

function extractBootFromText(text: string): string | null {
  const patterns = [
    /boot\s+(?:space\s+)?(?:capacity\s+)?(?:of\s+)?([\d,]+)\s*(?:l|litre|liter)/i,
    /([\d,]+)\s*(?:l|litre|liter)[- ]boot/i,
    /luggage\s+(?:space\s+)?(?:of\s+)?([\d,]+)\s*(?:l|litre|liter)/i,
    /cargo\s+(?:volume\s+)?(?:of\s+)?([\d,]+)\s*(?:l|litre|liter)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { const n = m[1].replace(/,/g, ""); if (+n > 50 && +n < 5000) return n; }
  }
  return null;
}

function extractWeightFromText(text: string): string | null {
  const patterns = [
    /(?:kerb|curb)\s+weight[:\s]+(?:of\s+)?([\d,]+)/i,
    /([\d,]+)\s*kg\s+(?:kerb|curb)/i,
    /weighs?\s+([\d,]+)\s*kg/i,
    /(?:unladen|empty)\s+weight[:\s]+([\d,]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { const n = m[1].replace(/,/g, ""); if (+n > 500 && +n < 10000) return n; }
  }
  return null;
}

// ── Wikipedia: section 0 infobox (kasa, predecessor vs.) ───────────────────

function parseInfoboxSpecs(html: string): Record<string, string> {
  const specs: Record<string, string> = {};
  const tableMatch = html.match(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return {};

  const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const fields: Record<string, string> = {};
  for (const row of rows) {
    const th = stripHtml(row[1].match(/<th[^>]*>([\s\S]*?)<\/th>/i)?.[1] ?? "").toLowerCase();
    const td = stripHtml(row[1].match(/<td[^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? "");
    if (th && td) fields[th] = td;
  }

  const cls = fields["class"] ?? fields["body style"] ?? fields["type"] ?? "";
  if (cls) {
    const v = mapBodyType(cls.split("|")[0]);
    if (v) specs.body_type = v;
    const seg = cls.match(/\b([A-E])\s*[-–]?\s*(?:segment|class|seg)?\b/i);
    if (seg) specs.segment = seg[1].toUpperCase();
  }

  const dr = fields["drive"] ?? fields["drivetrain"] ?? "";
  if (dr) { const v = mapDrivetrain(dr.split("|")[0]); if (v) specs.drivetrain = v; }

  return specs;
}

// ── Ana Wikipedia fetch ───────────────────────────────────────────────────────

async function fetchWikipediaSpecs(
  brand: string, model: string, trimHint: string | null
): Promise<Record<string, string>> {
  const title = await wikiSearch(brand, model);
  if (!title) return {};

  const [section0Html, sections] = await Promise.all([
    wikiSectionHtml(title, "0"),
    wikiSections(title),
  ]);

  const infoSpecs = parseInfoboxSpecs(section0Html);

  const techKeywords = /technical|specification|powertrain|engine|performance|data/i;
  const sectionsToTry: { index: string; line: string }[] = [];
  let techFound = false;
  for (const s of sections) {
    if (techKeywords.test(s.line)) {
      techFound = true;
      sectionsToTry.push(s);
    } else if (techFound) {
      sectionsToTry.push(s);
      if (sectionsToTry.length >= 6) break;
    }
  }
  if (sectionsToTry.length === 0) return infoSpecs;

  let tableSpecs: Record<string, string> = {};
  for (const sec of sectionsToTry) {
    const html = await wikiSectionHtml(title, sec.index);
    tableSpecs = parseSpecTable(html, trimHint);
    if (Object.keys(tableSpecs).length >= 2) break;
  }

  const merged = { ...infoSpecs, ...tableSpecs };

  if (!merged.weight_kg || !merged.boot_l) {
    const s0text = stripHtml(section0Html);
    if (!merged.boot_l) { const v = extractBootFromText(s0text); if (v) merged.boot_l = v; }
    if (!merged.weight_kg) { const v = extractWeightFromText(s0text); if (v) merged.weight_kg = v; }

    if (!merged.weight_kg || !merged.boot_l) {
      for (const sec of ["1", "2"]) {
        if (merged.weight_kg && merged.boot_l) break;
        try {
          const res = await fetch(
            `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&section=${sec}&format=json&origin=*`,
            { signal: AbortSignal.timeout(4000), headers: WIKI_HEADERS }
          );
          const data = await res.json();
          const text = stripHtml(data.parse?.text?.["*"] ?? "");
          if (!merged.boot_l) { const v = extractBootFromText(text); if (v) merged.boot_l = v; }
          if (!merged.weight_kg) { const v = extractWeightFromText(text); if (v) merged.weight_kg = v; }
        } catch { /* geç */ }
      }
    }
  }

  return merged;
}

// ── CarQuery ──────────────────────────────────────────────────────────────────

async function fetchCarQuery(
  brand: string, model: string, year: string | null, trimHint: string | null
): Promise<{ specs: Record<string, string>; found: boolean }> {
  const makeSlug  = slugifyMake(brand);
  const modelNorm = norm(model);

  const urls = [
    year ? `https://www.carqueryapi.com/api/0.3/?callback=fn&cmd=getTrims&make=${makeSlug}&year=${year}` : null,
    `https://www.carqueryapi.com/api/0.3/?callback=fn&cmd=getTrims&make=${makeSlug}`,
  ].filter(Boolean) as string[];

  type CQTrim = Record<string, string>;
  let bestTrims: CQTrim[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } });
      const raw = await res.text();
      const jsonStr = raw.replace(/^[a-zA-Z_$][\w$]*\s*\(/, "").replace(/\);\s*$/, "").replace(/\)\s*$/, "");
      const data: { Trims?: CQTrim[] } = JSON.parse(jsonStr);
      const filtered = (data.Trims ?? []).filter((t) => {
        const mn = norm(t.model_name ?? "");
        return mn.includes(modelNorm.slice(0, 8)) || modelNorm.includes(mn.slice(0, 8));
      });
      if (filtered.length > 0) { bestTrims = filtered; break; }
    } catch { continue; }
  }

  if (bestTrims.length === 0) return { specs: {}, found: false };

  let best = bestTrims[0];
  if (trimHint) {
    const tn = norm(trimHint).slice(0, 8);
    const m = bestTrims.find((t) => norm(t.model_trim ?? "").includes(tn));
    if (m) best = m;
  }

  const specs: Record<string, string> = {};
  if (best.model_engine_cc)          specs.engine_cc     = String(Math.round(+best.model_engine_cc));
  if (best.model_engine_power_ps)    specs.power_hp      = String(Math.round(+best.model_engine_power_ps));
  if (best.model_engine_torque_nm)   specs.torque_nm     = String(Math.round(+best.model_engine_torque_nm));
  if (best.model_0_to_100_kph)       specs.zero_to_100   = best.model_0_to_100_kph;
  if (best.model_top_speed_kph)      specs.top_speed_kmh = best.model_top_speed_kph;
  if (best.model_weight_kg)          specs.weight_kg     = String(Math.round(+best.model_weight_kg));
  if (best.model_fuel_cap_l)         specs.tank_l        = String(Math.round(+best.model_fuel_cap_l));
  if (best.model_drive)              { const v = mapDrivetrain(best.model_drive); if (v) specs.drivetrain = v; }
  if (best.model_transmission_type)  { const v = mapTransmission(best.model_transmission_type); if (v) specs.transmission = v; }
  if (best.model_body)               { const v = mapBodyType(best.model_body); if (v) specs.body_type = v; }

  return { specs, found: Object.keys(specs).length > 0 };
}

// ── Herkese açık API ──────────────────────────────────────────────────────────

export async function fetchVehicleSpecs(
  brand: string, model: string, year: string | null, trimHint: string | null
): Promise<{ specs: Record<string, string>; source: string | null }> {
  const [cqResult, wikiSpecs] = await Promise.all([
    fetchCarQuery(brand, model, year, trimHint),
    fetchWikipediaSpecs(brand, model, trimHint),
  ]);

  const merged: Record<string, string> = { ...wikiSpecs, ...cqResult.specs };
  if (Object.keys(merged).length === 0) return { specs: {}, source: null };

  const source = cqResult.found ? "CarQuery" : Object.keys(wikiSpecs).length > 0 ? "Wikipedia" : null;
  return { specs: merged, source };
}
