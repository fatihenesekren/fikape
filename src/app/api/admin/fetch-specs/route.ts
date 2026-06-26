import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

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
  const l = (d ?? "").toLowerCase();
  if (l.includes("front") || l === "fwd") return "FWD";
  if (l.includes("rear") || l === "rwd") return "RWD";
  if (l.includes("all") || l.includes("awd") || l.includes("4wd") || l.includes("4x4")) return "AWD";
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
  const l = (b ?? "").toLowerCase();
  if (l.includes("suv") || l.includes("crossover") || l.includes("cuv")) return "suv";
  if (l.includes("sedan") || l.includes("saloon")) return "sedan";
  if (l.includes("hatch")) return "hatchback";
  if (l.includes("mpv") || l.includes("minivan")) return "mpv";
  if (l.includes("coupe")) return "coupe";
  if (l.includes("cabrio") || l.includes("convert") || l.includes("roadster")) return "cabrio";
  if (l.includes("pickup")) return "pickup";
  if (l.includes("van") || l.includes("kombi")) return "van";
  return "";
}

function stripHtml(s: string) {
  return s
    .replace(/<br\s*\/?>/gi, " | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstNumber(s: string): string | null {
  const m = s.match(/[\d]+/);
  return m ? m[0] : null;
}

// ── CarQuery ─────────────────────────────────────────────────────────────────

type CQTrim = Record<string, string>;

async function fetchCarQuery(
  brand: string, model: string, year: string | null, trimHint: string | null
): Promise<{ specs: Record<string, string>; found: boolean }> {
  const makeSlug  = slugifyMake(brand);
  const modelNorm = normalize(model);

  // Her iki URL'yi paralel dene
  const urls: string[] = [
    `https://www.carqueryapi.com/api/0.3/?callback=fn&cmd=getTrims&make=${makeSlug}${year ? `&year=${year}` : ""}`,
    `https://www.carqueryapi.com/api/0.3/?callback=fn&cmd=getTrims&make=${makeSlug}`,
  ];

  let bestTrims: CQTrim[] = [];

  for (const url of urls) {
    let raw = "";
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } });
      raw = await res.text();
    } catch { continue; }

    const jsonStr = raw.replace(/^[a-zA-Z_$][\w$]*\s*\(/, "").replace(/\);\s*$/, "").replace(/\)\s*$/, "");
    let data: { Trims?: CQTrim[] } = {};
    try { data = JSON.parse(jsonStr); } catch { continue; }

    const all = data.Trims ?? [];
    const filtered = all.filter((t) => {
      const mn = normalize(t.model_name ?? "");
      return mn.includes(modelNorm) || modelNorm.includes(mn);
    });

    if (filtered.length > 0) { bestTrims = filtered; break; }
  }

  if (bestTrims.length === 0) return { specs: {}, found: false };

  let best = bestTrims[0];
  if (trimHint) {
    const tnorm = normalize(trimHint).slice(0, 8);
    const m = bestTrims.find((t) => normalize(t.model_trim ?? "").includes(tnorm));
    if (m) best = m;
  }

  const specs: Record<string, string> = {};
  if (best.model_engine_cc)         specs.engine_cc     = String(Math.round(+best.model_engine_cc));
  if (best.model_engine_power_ps)   specs.power_hp      = String(Math.round(+best.model_engine_power_ps));
  if (best.model_engine_torque_nm)  specs.torque_nm     = String(Math.round(+best.model_engine_torque_nm));
  if (best.model_0_to_100_kph)      specs.zero_to_100   = best.model_0_to_100_kph;
  if (best.model_top_speed_kph)     specs.top_speed_kmh = best.model_top_speed_kph;
  if (best.model_weight_kg)         specs.weight_kg     = String(Math.round(+best.model_weight_kg));
  if (best.model_fuel_cap_l)        specs.tank_l        = String(Math.round(+best.model_fuel_cap_l));
  if (best.model_drive)             { const v = mapDrivetrain(best.model_drive); if (v) specs.drivetrain = v; }
  if (best.model_transmission_type) { const v = mapTransmission(best.model_transmission_type); if (v) specs.transmission = v; }
  if (best.model_body)              { const v = mapBodyType(best.model_body); if (v) specs.body_type = v; }

  return { specs, found: Object.keys(specs).length > 0 };
}

// ── Wikipedia HTML infobox parser ─────────────────────────────────────────

async function fetchWikipediaSpecs(
  brand: string, model: string, trimHint: string | null
): Promise<Record<string, string>> {
  // 1. Makale başlığını bul
  let title = "";
  try {
    const sr = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${brand} ${model} automobile`)}&srlimit=3&format=json&origin=*`,
      { signal: AbortSignal.timeout(5000) }
    );
    const sd = await sr.json();
    // Araç adını içeren ilk sonucu seç
    const modelNorm = normalize(model);
    const hit = (sd.query?.search ?? []).find(
      (r: { title: string }) => normalize(r.title).includes(modelNorm)
    );
    title = hit?.title ?? sd.query?.search?.[0]?.title ?? "";
    if (!title) return {};
  } catch { return {}; }

  // 2. Sadece section 0 (lead + infobox) HTML'ini çek
  let html = "";
  try {
    const pr = await fetch(
      `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&section=0&format=json&origin=*`,
      { signal: AbortSignal.timeout(7000) }
    );
    const pd = await pr.json();
    html = pd.parse?.text?.["*"] ?? "";
    if (!html) return {};
  } catch { return {}; }

  // 3. Infobox tablosunu bul ve satırları çıkar
  const tableMatch = html.match(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return {};

  const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const fields: Record<string, string> = {};
  for (const row of rows) {
    const thRaw = row[1].match(/<th[^>]*>([\s\S]*?)<\/th>/i)?.[1] ?? "";
    const tdRaw = row[1].match(/<td[^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? "";
    const th = stripHtml(thRaw).toLowerCase();
    const td = stripHtml(tdRaw);
    if (th && td) fields[th] = td;
  }

  const specs: Record<string, string> = {};

  // Kasa tipi
  const clsRaw = fields["class"] ?? fields["body style"] ?? fields["type"] ?? "";
  if (clsRaw) {
    const v = mapBodyType(clsRaw.split("|")[0]);
    if (v) specs.body_type = v;
  }

  // Motor cc
  const engRaw = fields["engine"] ?? fields["engines"] ?? "";
  if (engRaw) {
    // Trim'e uyan satırı seç
    const lines = engRaw.split("|");
    const engLine = (trimHint && lines.find((l) => l.toLowerCase().includes(
      trimHint.toLowerCase().split(" ")[0].replace(/[^a-z0-9]/gi, "").slice(0, 4)
    ))) ?? lines[0];

    const ccMatch = engLine.match(/(\d[\d,]*)\s*(?:cc|cm³)/i);
    if (ccMatch) {
      specs.engine_cc = ccMatch[1].replace(/,/g, "");
    } else {
      const lMatch = engLine.match(/(\d+\.?\d*)\s*[Ll](?:\s|$)/);
      if (lMatch) specs.engine_cc = String(Math.round(parseFloat(lMatch[1]) * 1000));
    }
    // HP / PS
    const hpMatch = engLine.match(/(\d+)\s*(?:hp|PS|cv|bhp|kW)/i);
    if (hpMatch) specs.power_hp = hpMatch[1];
  }

  // Güç (ayrı field varsa)
  if (!specs.power_hp) {
    const pwrRaw = fields["power"] ?? fields["power output"] ?? "";
    if (pwrRaw) {
      const lines = pwrRaw.split("|");
      const line = lines[0];
      const m = line.match(/(\d+)\s*(?:hp|PS|cv|bhp)/i);
      if (m) specs.power_hp = m[1];
      else { const n = firstNumber(line); if (n) specs.power_hp = n; }
    }
  }

  // Tork
  const trqRaw = fields["torque"] ?? "";
  if (trqRaw) {
    const line = trqRaw.split("|")[0];
    const m = line.match(/(\d+)\s*(?:N·?m|Nm)/i);
    if (m) specs.torque_nm = m[1];
    else { const n = firstNumber(line); if (n) specs.torque_nm = n; }
  }

  // Vites
  const txRaw = fields["transmission"] ?? fields["gearbox"] ?? "";
  if (txRaw) {
    const v = mapTransmission(txRaw.split("|")[0]);
    if (v) specs.transmission = v;
  }

  // Çekiş
  const drRaw = fields["drive"] ?? fields["drivetrain"] ?? fields["drive wheels"] ?? "";
  if (drRaw) {
    const v = mapDrivetrain(drRaw.split("|")[0]);
    if (v) specs.drivetrain = v;
  }

  // Ağırlık
  const wtRaw = fields["curb weight"] ?? fields["weight"] ?? fields["kerb weight"] ?? "";
  if (wtRaw) {
    const line = wtRaw.split("|")[0];
    // "1,490 kg" veya "1490 kg" veya "1490–1700 kg" → ilk sayıyı al
    const m = line.match(/([\d,]+)\s*kg/i);
    if (m) specs.weight_kg = m[1].replace(/,/g, "");
    else { const n = firstNumber(line); if (n) specs.weight_kg = n; }
  }

  // Yakıt deposu
  const tankRaw = fields["fuel capacity"] ?? fields["fuel tank"] ?? "";
  if (tankRaw) {
    const m = tankRaw.match(/([\d.]+)\s*(?:L|litres?)/i);
    if (m) specs.tank_l = m[1];
    else { const n = firstNumber(tankRaw); if (n) specs.tank_l = n; }
  }

  return specs;
}

// ── Ana GET handler ──────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const brand    = searchParams.get("brand") ?? "";
  const model    = searchParams.get("model") ?? "";
  const year     = searchParams.get("year") ?? null;
  const trimName = searchParams.get("trim") ?? null;

  if (!brand || !model) return NextResponse.json({ specs: {} });

  // CarQuery ve Wikipedia'yı paralel dene
  const [cqResult, wikiSpecs] = await Promise.all([
    fetchCarQuery(brand, model, year, trimName),
    fetchWikipediaSpecs(brand, model, trimName),
  ]);

  // Önce CarQuery verisi (genellikle sayısal olarak daha doğru), üstüne Wikipedia'yı birleştir
  const merged: Record<string, string> = { ...wikiSpecs, ...cqResult.specs };

  if (Object.keys(merged).length === 0) {
    return NextResponse.json({ specs: {}, source: null });
  }

  const source = cqResult.found ? "CarQuery" : Object.keys(wikiSpecs).length > 0 ? "Wikipedia" : null;
  return NextResponse.json({ specs: merged, source });
}
