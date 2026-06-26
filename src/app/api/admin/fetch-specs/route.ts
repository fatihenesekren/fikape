import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

// ── Yardımcı dönüşümler ────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function slugifyMake(name: string) {
  return name.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, "-");
}

function mapDrivetrain(d: string) {
  const l = d.toLowerCase();
  if (l.includes("front") || l === "fwd") return "FWD";
  if (l.includes("rear") || l === "rwd") return "RWD";
  if (l.includes("all") || l.includes("awd") || l.includes("4wd")) return "AWD";
  return d.toUpperCase();
}

function mapTransmission(t: string) {
  const l = t.toLowerCase();
  if (l.includes("auto")) return "Otomatik";
  if (l.includes("manual")) return "Manuel";
  if (l.includes("cvt")) return "CVT";
  return t;
}

function mapBodyType(b: string) {
  const l = b.toLowerCase();
  if (l.includes("suv") || l.includes("crossover")) return "suv";
  if (l.includes("sedan") || l.includes("saloon")) return "sedan";
  if (l.includes("hatch")) return "hatchback";
  if (l.includes("mpv") || (l.includes("van") && !l.includes("mini"))) return "mpv";
  if (l.includes("coupe")) return "coupe";
  if (l.includes("cabrio") || l.includes("convert")) return "cabrio";
  if (l.includes("pickup")) return "pickup";
  return l;
}

type CarQueryTrim = Record<string, string>;

// ── CarQuery: tüm trims çek, model adıyla filtrele ─────────────────────────

async function fetchCarQuery(
  brand: string, model: string, year: string | null, trimName: string | null
): Promise<Record<string, string>> {
  const makeSlug = slugifyMake(brand);
  const modelNorm = normalize(model);

  const urls = [
    // 1. Make + Year (en kısıtlı)
    year ? `https://www.carqueryapi.com/api/0.3/?callback=fn&cmd=getTrims&make=${makeSlug}&year=${year}` : null,
    // 2. Make only (yıl filtresi olmadan)
    `https://www.carqueryapi.com/api/0.3/?callback=fn&cmd=getTrims&make=${makeSlug}`,
  ].filter(Boolean) as string[];

  for (const url of urls) {
    let raw: string;
    try {
      const res = await fetch(url, { next: { revalidate: 86400 } });
      raw = await res.text();
    } catch { continue; }

    const jsonStr = raw.replace(/^[a-zA-Z_$][\w$]*\s*\(/, "").replace(/\);\s*$/, "").replace(/\)\s*$/, "");
    let data: { Trims?: CarQueryTrim[] };
    try { data = JSON.parse(jsonStr); } catch { continue; }

    const trims = (data.Trims ?? []).filter((t) =>
      normalize(t.model_name ?? "").includes(modelNorm) ||
      modelNorm.includes(normalize(t.model_name ?? ""))
    );
    if (trims.length === 0) continue;

    // trimName varsa o trim'i tercih et
    let best = trims[0];
    if (trimName) {
      const tnorm = normalize(trimName);
      const matched = trims.find((t) => normalize(t.model_trim ?? "").includes(tnorm.slice(0, 6)));
      if (matched) best = matched;
    }

    const specs: Record<string, string> = {};
    if (best.model_engine_cc)        specs.engine_cc     = String(Math.round(Number(best.model_engine_cc)));
    if (best.model_engine_power_ps)  specs.power_hp      = String(Math.round(Number(best.model_engine_power_ps)));
    if (best.model_engine_torque_nm) specs.torque_nm     = String(Math.round(Number(best.model_engine_torque_nm)));
    if (best.model_0_to_100_kph)     specs.zero_to_100   = best.model_0_to_100_kph;
    if (best.model_top_speed_kph)    specs.top_speed_kmh = best.model_top_speed_kph;
    if (best.model_weight_kg)        specs.weight_kg     = String(Math.round(Number(best.model_weight_kg)));
    if (best.model_fuel_cap_l)       specs.tank_l        = String(Math.round(Number(best.model_fuel_cap_l)));
    if (best.model_drive)            specs.drivetrain    = mapDrivetrain(best.model_drive);
    if (best.model_transmission_type) specs.transmission = mapTransmission(best.model_transmission_type);
    if (best.model_body)             specs.body_type     = mapBodyType(best.model_body);

    if (Object.keys(specs).length > 0) return specs;
  }
  return {};
}

// ── Wikipedia infobox fallback ─────────────────────────────────────────────

function parseWikiValue(raw: string): string {
  // {{convert|1,598|cc|...}} → 1598
  raw = raw.replace(/\{\{convert\|([0-9,\.]+)\|([^|{}]+)[^}]*\}\}/gi, (_, v, unit) =>
    v.replace(/,/g, "") + " " + unit.trim()
  );
  // [[Link|Text]] veya [[Link]] → Text veya Link
  raw = raw.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1");
  // <br> → pipe
  raw = raw.replace(/<br\s*\/?>/gi, " | ");
  // HTML tagları
  raw = raw.replace(/<[^>]+>/g, "");
  // {{...}} temizle
  raw = raw.replace(/\{\{[^}]*\}\}/g, "");
  // Fazla boşluk
  raw = raw.replace(/\s+/g, " ").trim();
  return raw;
}

function extractNumber(s: string): string | null {
  const m = s.match(/[\d,]+\.?\d*/);
  return m ? m[0].replace(/,/g, "") : null;
}

async function fetchWikipediaSpecs(
  brand: string, model: string, year: string | null, trimHint: string | null
): Promise<Record<string, string>> {
  // 1. Makale başlığını bul
  const query = `${brand} ${model} automobile`;
  let title: string;
  try {
    const sr = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`,
      { signal: AbortSignal.timeout(4000) }
    );
    const sd = await sr.json();
    title = sd.query?.search?.[0]?.title;
    if (!title) return {};
  } catch { return {}; }

  // 2. Wikitext çek
  let wikitext: string;
  try {
    const wr = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=revisions&rvprop=content&format=json&origin=*`,
      { signal: AbortSignal.timeout(6000) }
    );
    const wd = await wr.json();
    const pages = wd.query?.pages ?? {};
    const page = Object.values(pages)[0] as { revisions?: { "*": string }[] };
    wikitext = page?.revisions?.[0]?.["*"] ?? "";
    if (!wikitext) return {};
  } catch { return {}; }

  // 3. Infobox alanlarını çıkar
  const infoMatch = wikitext.match(/\{\{Infobox automobile([\s\S]*?)^\}\}/m);
  const infoRaw = infoMatch?.[1] ?? wikitext;

  const fieldRe = /^\|\s*([\w_]+)\s*=\s*(.+?)(?=^\||\{\{|\}\})/gm;
  const fields: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = fieldRe.exec(infoRaw)) !== null) {
    fields[m[1].trim().toLowerCase()] = parseWikiValue(m[2]);
  }

  const specs: Record<string, string> = {};

  // Kasa tipi
  const cls = fields.class ?? fields.body_style ?? "";
  if (cls) specs.body_type = mapBodyType(cls.split("|")[0].trim());

  // Motor (cc)
  const eng = fields.engine ?? "";
  if (eng) {
    // Önce trimHint ile eşleşen satırı bul, yoksa ilkini kullan
    const lines = eng.split("|");
    const engineLine = trimHint
      ? (lines.find((l) => l.toLowerCase().includes(trimHint.toLowerCase().split(" ")[0])) ?? lines[0])
      : lines[0];
    const ccMatch = engineLine.match(/(\d[\d,]*)\s*(?:cc|cm³|cm3)/i);
    if (ccMatch) specs.engine_cc = ccMatch[1].replace(/,/g, "");
    // Litreden cc hesapla
    else {
      const lMatch = engineLine.match(/(\d+\.\d+)\s*[Ll]/);
      if (lMatch) specs.engine_cc = String(Math.round(parseFloat(lMatch[1]) * 1000));
    }
  }

  // Güç (HP/PS)
  const pwr = fields.power ?? "";
  if (pwr) {
    const lines = pwr.split("|");
    const line = trimHint
      ? (lines.find((l) => l.toLowerCase().includes(trimHint.toLowerCase().split(" ")[0])) ?? lines[0])
      : lines[0];
    const psMatch = line.match(/(\d+)\s*(?:PS|hp|cv|kW)/i);
    if (psMatch) specs.power_hp = psMatch[1];
    else {
      const n = extractNumber(line);
      if (n) specs.power_hp = n;
    }
  }

  // Tork
  const trq = fields.torque ?? "";
  if (trq) {
    const lines = trq.split("|");
    const line = lines[0];
    const nmMatch = line.match(/(\d+)\s*(?:N·?m|Nm)/i);
    if (nmMatch) specs.torque_nm = nmMatch[1];
    else {
      const n = extractNumber(line);
      if (n) specs.torque_nm = n;
    }
  }

  // Vites
  const tx = fields.transmission ?? "";
  if (tx) {
    const lines = tx.split("|");
    const line = lines[0];
    specs.transmission = mapTransmission(line);
  }

  // Ağırlık
  const wt = fields.weight ?? fields.curb_weight ?? "";
  if (wt) {
    const n = extractNumber(wt.split("|")[0]);
    if (n) specs.weight_kg = n;
  }

  // Uzunluk/Genişlik/Yükseklik (opsiyonel ekstra bilgi, alanlarımızda yok — yorum satırı)

  return specs;
}

// ── Ana GET handler ────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const brand    = searchParams.get("brand") ?? "";
  const model    = searchParams.get("model") ?? "";
  const year     = searchParams.get("year") ?? null;
  const trimName = searchParams.get("trim") ?? null;

  if (!brand || !model) return NextResponse.json({ specs: {} });

  // 1. CarQuery dene
  const cqSpecs = await fetchCarQuery(brand, model, year, trimName);
  if (Object.keys(cqSpecs).length >= 3) {
    return NextResponse.json({ specs: cqSpecs, source: "CarQuery" });
  }

  // 2. Wikipedia infobox fallback
  const wikiSpecs = await fetchWikipediaSpecs(brand, model, year, trimName);
  const merged = { ...cqSpecs, ...wikiSpecs };

  if (Object.keys(merged).length === 0) {
    return NextResponse.json({ specs: {}, source: null });
  }
  return NextResponse.json({ specs: merged, source: "Wikipedia" });
}
