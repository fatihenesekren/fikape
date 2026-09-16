import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AiSummaryActions } from "./AiSummaryActions";

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
        <div className="space-y-3">
          {pending.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/araclar/${s.product.slug}`} target="_blank" className="font-semibold text-gray-800 hover:underline">
                  {s.product.brand.name} {s.product.model.name}
                </Link>
                <span className="text-[11px] text-gray-400">{s.modelVersion}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">
                {s.summaryText}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {s.generatedAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                </span>
                <AiSummaryActions summaryId={s.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
