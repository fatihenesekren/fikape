import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchVehicleSpecsWithConfidence } from "@/lib/vehicleSpecs";
import { findVerifiedVehicleImage } from "@/lib/wikidataImage";
import { CRITICAL_FIELDS } from "@/lib/specFields";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const brand        = searchParams.get("brand") ?? "";
  const model        = searchParams.get("model") ?? "";
  const year         = searchParams.get("year") ?? null;
  const trimName     = searchParams.get("trim") ?? null;
  const categorySlug = searchParams.get("category") ?? "";

  if (!brand || !model) return NextResponse.json({ specs: {} });

  const yearNum = year ? parseInt(year, 10) : null;
  const [specResult, imageUrl] = await Promise.all([
    fetchVehicleSpecsWithConfidence(brand, model, yearNum, trimName),
    findVerifiedVehicleImage(brand, model, yearNum),
  ]);

  const criticalFields = CRITICAL_FIELDS[categorySlug] ?? [];
  const criticalFieldsMissing = criticalFields.filter(
    (f) => specResult.specs[f]?.confidence !== "high"
  );

  return NextResponse.json({
    specs: specResult.specs,
    imageUrl,
    readyForAutoApprove: criticalFields.length > 0 && criticalFieldsMissing.length === 0,
    criticalFieldsMissing,
  });
}
