import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";

function slugifyMake(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function mapDrivetrain(drive: string): string {
  const d = drive.toLowerCase();
  if (d === "front") return "FWD";
  if (d === "rear") return "RWD";
  if (d === "all") return "AWD";
  return drive.toUpperCase();
}

function mapTransmission(tx: string): string {
  const t = tx.toLowerCase();
  if (t.includes("automatic")) return "Otomatik";
  if (t.includes("manual")) return "Manuel";
  if (t.includes("cvt")) return "CVT";
  return tx;
}

function mapBodyType(body: string): string {
  const b = body.toLowerCase();
  if (b.includes("suv") || b.includes("crossover")) return "suv";
  if (b.includes("sedan") || b.includes("saloon")) return "sedan";
  if (b.includes("hatchback")) return "hatchback";
  if (b.includes("mpv") || b.includes("minivan") || b.includes("van")) return "mpv";
  if (b.includes("coupe")) return "coupe";
  if (b.includes("cabrio") || b.includes("convert")) return "cabrio";
  if (b.includes("pickup")) return "pickup";
  return b;
}

function pickBest(trims: Record<string, string>[], trimName?: string): Record<string, string> {
  if (trims.length === 0) return {};
  if (!trimName) return trims[0];
  const lower = trimName.toLowerCase();
  const match = trims.find((t) =>
    (t.model_trim ?? "").toLowerCase().includes(lower.split(" ")[0])
  );
  return match ?? trims[0];
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const brand    = searchParams.get("brand") ?? "";
  const model    = searchParams.get("model") ?? "";
  const year     = searchParams.get("year") ?? "";
  const trimName = searchParams.get("trim") ?? "";

  if (!brand || !model) {
    return NextResponse.json({ specs: {} });
  }

  const makeSlug  = slugifyMake(brand);
  const modelSlug = model.toLowerCase().replace(/[^a-z0-9]+/g, "+");

  const url = `https://www.carqueryapi.com/api/0.3/?callback=fn&cmd=getTrims&make=${makeSlug}&model=${encodeURIComponent(modelSlug)}${year ? `&year=${year}` : ""}`;

  let raw: string;
  try {
    const res = await fetch(url, { headers: { "Accept": "*/*" }, next: { revalidate: 86400 } });
    raw = await res.text();
  } catch {
    return NextResponse.json({ specs: {} });
  }

  // Strip JSONP wrapper: fn({...}); or fn({...})
  const jsonStr = raw.replace(/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/, "").replace(/\s*\);\s*$/, "").replace(/\s*\)\s*$/, "");

  let data: { Trims?: Record<string, string>[] };
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ specs: {} });
  }

  const trims = data.Trims ?? [];
  if (trims.length === 0) return NextResponse.json({ specs: {} });

  const t = pickBest(trims, trimName);

  const specs: Record<string, string> = {};

  if (t.model_engine_cc)       specs.engine_cc    = String(Math.round(Number(t.model_engine_cc)));
  if (t.model_engine_power_ps) specs.power_hp     = String(Math.round(Number(t.model_engine_power_ps)));
  if (t.model_engine_torque_nm)specs.torque_nm    = String(Math.round(Number(t.model_engine_torque_nm)));
  if (t.model_0_to_100_kph)    specs.zero_to_100  = t.model_0_to_100_kph;
  if (t.model_top_speed_kph)   specs.top_speed_kmh = t.model_top_speed_kph;
  if (t.model_weight_kg)       specs.weight_kg    = String(Math.round(Number(t.model_weight_kg)));
  if (t.model_fuel_cap_l)      specs.tank_l       = String(Math.round(Number(t.model_fuel_cap_l)));
  if (t.model_drive)           specs.drivetrain   = mapDrivetrain(t.model_drive);
  if (t.model_transmission_type) specs.transmission = mapTransmission(t.model_transmission_type);
  if (t.model_body)            specs.body_type    = mapBodyType(t.model_body);

  return NextResponse.json({ specs, source: `CarQuery (${trims.length} trim)` });
}
