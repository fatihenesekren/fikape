import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchVehicleSpecs } from "@/lib/vehicleSpecs";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const brand    = searchParams.get("brand") ?? "";
  const model    = searchParams.get("model") ?? "";
  const year     = searchParams.get("year") ?? null;
  const trimName = searchParams.get("trim") ?? null;

  if (!brand || !model) return NextResponse.json({ specs: {} });

  const { specs, source } = await fetchVehicleSpecs(brand, model, year, trimName);
  return NextResponse.json({ specs, source });
}
