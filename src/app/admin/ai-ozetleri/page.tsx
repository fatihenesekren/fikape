import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AiSummaryList } from "./AiSummaryList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "AI Araç Özetleri — Admin",
  robots: { index: false },
};

export default async function AiOzetleriPage() {
  const pending = await prisma.aiVehicleSummary.findMany({
    where: { status: "PENDING_APPROVAL" },
    orderBy: { generatedAt: "asc" },
    select: {
      id: true, summaryText: true, generatedAt: true, modelVersion: true,
      product: { select: { slug: true, name: true, brand: { select: { name: true } }, model: { select: { name: true } } } },
    },
  });

  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          AI Araç Özetleri
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
              {pending.length} bekliyor
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Ürün aktive edilirken üretilen ilk AI izlenim metni — gerçek yorum yokken araç
          kartında gösterilir. Yayına çıkmadan önce onayınız gerekiyor. (≥5 gerçek yorumdan
          üretilen &quot;AI Yorum Özeti&quot; otomatik yayınlanır, bu listeye düşmez.)
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-gray-400">Onay bekleyen AI özeti yok.</p>
      ) : (
        <AiSummaryList
          items={pending.map((s) => ({
            id: s.id,
            slug: s.product.slug,
            title: `${s.product.brand.name} ${s.product.model.name}`,
            // Arama: marka + model + ürün adı (versiyon/donanım dahil).
            searchText: `${s.product.brand.name} ${s.product.model.name} ${s.product.name}`,
            summaryText: s.summaryText,
            generatedLabel: s.generatedAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }),
            modelVersion: s.modelVersion,
          }))}
        />
      )}
    </div>
  );
}
