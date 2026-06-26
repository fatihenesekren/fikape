import { prisma } from "@/lib/prisma";
import { OnerilerClient } from "./OnerilerClient";
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

  const serialized = suggestions.map((s) => ({
    id: s.id,
    brandName: s.brandName,
    modelName: s.modelName,
    year: s.year,
    categorySlug: s.categorySlug,
    fuelType: s.fuelType,
    trimName: s.trimName,
    notes: s.notes,
    status: s.status,
    adminNote: s.adminNote,
    createdAt: s.createdAt.toISOString(),
    user: s.user ? { displayName: s.user.displayName, email: s.user.email } : null,
    productId: s.productId,
    productSlug: s.product?.slug ?? null,
    productStatus: s.product?.status ?? null,
  }));

  const pendingCount = serialized.filter((s) => s.status === "PENDING").length;

  return (
    <div className="px-8 py-10 max-w-3xl">
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
