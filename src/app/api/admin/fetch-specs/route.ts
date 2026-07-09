import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchVerifiedVehicleSpecs } from "@/lib/vehicleSpecs";
import { findVerifiedVehicleImage } from "@/lib/wikidataImage";

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

  const yearNum = year ? parseInt(year, 10) : null;
  const [specResult, imageUrl] = await Promise.all([
    fetchVerifiedVehicleSpecs(brand, model, yearNum, trimName),
    findVerifiedVehicleImage(brand, model, yearNum),
  ]);

  return NextResponse.json({ specs: specResult.specs, source: specResult.source, imageUrl });
}
