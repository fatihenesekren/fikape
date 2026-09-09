import { prisma } from "@/lib/prisma";
import { OnerilerClient } from "./OnerilerClient";
import { findExistingVehicles } from "@/lib/existingVehicle";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Araç Önerileri",
  robots: { index: false },
};

export default async function AdminOnerilerPage() {

  const suggestions = await prisma.vehicleSuggestion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { displayName: true, email: true } },
      product: { select: { slug: true, status: true } },
    },
  });

  // Faz 2 — "olası kopya" rozeti: bekleyen her öneri için katalogda (ACTIVE
  // Product) aynı marka+model var mı? Faz 1 (canlı kontrol + 409) bypass
  // edilebiliyor; moderatör kataloğu elle aramadan görsün diye.
  const dupBySuggestionId = new Map<
    number,
    { slug: string; name: string; reviewCount: number }[]
  >();
  await Promise.all(
    suggestions
      .filter((s) => s.status === "PENDING")
      .map(async (s) => {
        const matches = await findExistingVehicles(s.brandName, s.modelName, s.categorySlug);
        // Önerinin KENDİ ürünü PENDING olduğu için findExistingVehicles'a
        // (status: ACTIVE) takılmaz; yine de emniyet için slug'ını çıkar.
        const filtered = matches.filter((m) => m.slug !== s.product?.slug);
        if (filtered.length > 0) {
          dupBySuggestionId.set(
            s.id,
            filtered.slice(0, 3).map((m) => ({
              slug: m.slug,
              name: m.name,
              reviewCount: m.reviewCount,
            })),
          );
        }
      }),
  );

  const serialized = suggestions.map((s) => ({
    id: s.id,
    brandName: s.brandName,
    modelName: s.modelName,
    year: s.year,
    categorySlug: s.categorySlug,
    fuelType: s.fuelType,
    transmission: s.transmission,
    trimName: s.trimName,
    notes: s.notes,
    status: s.status,
    adminNote: s.adminNote,
    createdAt: s.createdAt.toISOString(),
    user: s.user ? { displayName: s.user.displayName, email: s.user.email } : null,
    productId: s.productId,
    productSlug: s.product?.slug ?? null,
    productStatus: s.product?.status ?? null,
    dupMatches: dupBySuggestionId.get(s.id) ?? [],
  }));

  const pendingCount = serialized.filter((s) => s.status === "PENDING").length;

  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          Araç Önerileri
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
              {pendingCount} bekliyor
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Kullanıcıların önerdiği araçları incele ve kataloğa ekle.
        </p>
      </div>

      <OnerilerClient initialSuggestions={serialized} />
    </div>
  );
}
