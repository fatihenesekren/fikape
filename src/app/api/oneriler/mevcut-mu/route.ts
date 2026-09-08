import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findExistingVehicles } from "@/lib/existingVehicle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// /oner formunda marka + model seçilince çağrılır: bu araç zaten katalogda
// (ACTIVE Product) mı? Varsa kullanıcı formu doldurmadan "yorum yaz"a
// yönlendirilir; yoksa öneri akışı devam eder.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekiyor" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const brand = searchParams.get("brand") ?? "";
  const model = searchParams.get("model") ?? "";
  const category = searchParams.get("category") ?? undefined;

  if (!brand.trim() || !model.trim()) {
    return NextResponse.json({ matches: [] });
  }

  const matches = await findExistingVehicles(brand, model, category);
  return NextResponse.json({ matches });
}
