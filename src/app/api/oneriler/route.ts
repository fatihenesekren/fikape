import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["otomobil", "motosiklet", "e-scooter", "karavan", "kamyonet"];
const VALID_FUEL_TYPES = ["GASOLINE", "DIESEL", "EV", "PHEV", "HYBRID", "LPG"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekiyor" }, { status: 401 });
  }

  const body = await req.json();
  const {
    brandName, modelName, year, categorySlug, fuelType, trimName, notes,
    carQueryData, reviewData, photoUrls,
  } = body;

  if (!brandName?.trim() || !modelName?.trim()) {
    return NextResponse.json({ error: "Marka ve model zorunludur" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(categorySlug)) {
    return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
  }
  if (fuelType && !VALID_FUEL_TYPES.includes(fuelType)) {
    return NextResponse.json({ error: "Geçersiz yakıt tipi" }, { status: 400 });
  }

  // reviewData validasyon
  if (reviewData) {
    const { scoreFiyat, scoreKalite, scorePerformans, summaryText } = reviewData;
    const scores = [scoreFiyat, scoreKalite, scorePerformans];
    if (scores.some((s) => !s || s < 1 || s > 5)) {
      return NextResponse.json({ error: "Geçersiz puan değerleri" }, { status: 400 });
    }
    if (!summaryText?.trim() || summaryText.trim().length < 10) {
      return NextResponse.json({ error: "Yorum en az 10 karakter olmalı" }, { status: 400 });
    }
  }

  const userId = Number(session.user.id);

  // Aynı kullanıcı aynı öneriyi birden fazla göndermesin
  const duplicate = await prisma.vehicleSuggestion.findFirst({
    where: {
      userId,
      brandName: { equals: brandName.trim(), mode: "insensitive" },
      modelName: { equals: modelName.trim(), mode: "insensitive" },
      status: "PENDING",
    },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "Bu aracı zaten önermişsiniz, inceleme bekleniyor" },
      { status: 409 }
    );
  }

  const safePhotoUrls = Array.isArray(photoUrls)
    ? photoUrls.filter((u: unknown) => typeof u === "string").slice(0, 5)
    : [];

  const suggestion = await prisma.vehicleSuggestion.create({
    data: {
      userId,
      brandName: brandName.trim(),
      modelName: modelName.trim(),
      year: year ? Number(year) : null,
      categorySlug,
      fuelType: fuelType || null,
      trimName: trimName?.trim() || null,
      notes: notes?.trim() || null,
      carQueryData: carQueryData ?? undefined,
      reviewData: reviewData ?? undefined,
      photoUrls: safePhotoUrls,
    },
  });

  return NextResponse.json({ ok: true, id: suggestion.id }, { status: 201 });
}
