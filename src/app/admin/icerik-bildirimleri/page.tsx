import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SPEC_FIELDS } from "@/lib/specFields";
import { ContentReportActions } from "./ContentReportActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "İçerik Bildirimleri — Admin",
  robots: { index: false },
};

const TARGET_LABELS: Record<string, string> = {
  SPEC: "Teknik Özellik",
  PHOTO: "Fotoğraf",
  REVIEW: "Yorum",
  QNA: "Soru-Cevap",
};

const FIX_LINKS: Record<string, { href: string; label: string }> = {
  SPEC: { href: "/admin/urunler", label: "Teknik özellikleri düzenle →" },
  PHOTO: { href: "/admin/araclar", label: "Görselleri yönet →" },
  REVIEW: { href: "/admin/yorumlar", label: "Yorumları yönet →" },
};

export default async function IcerikBildirimleriPage() {
  const reports = await prisma.contentReport.findMany({
    where: { status: "PENDING" },
    include: {
      product: { select: { slug: true, name: true, brand: { select: { name: true } }, model: { select: { name: true } }, category: { select: { slug: true } } } },
      reporter: { select: { displayName: true } },
      review: { select: { summaryText: true } },
      photo: { select: { url: true } },
      question: { select: { text: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-8 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          İçerik Bildirimleri
          {reports.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
              {reports.length} bekliyor
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Kullanıcıların teknik özellik, fotoğraf, yorum veya soru-cevap içeriğinde bildirdiği hatalar.
        </p>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-gray-400">Bekleyen bildirim yok.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const productName = `${r.product.brand.name} ${r.product.model.name}`;
            const fieldLabel = r.field
              ? (SPEC_FIELDS[r.product.category?.slug ?? ""] ?? []).find((f) => f.key === r.field)?.label ?? r.field
              : null;
            const fixLink = FIX_LINKS[r.targetType];

            return (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600">
                      {TARGET_LABELS[r.targetType] ?? r.targetType}
                    </span>
                    <Link href={`/araclar/${r.product.slug}`} className="font-semibold text-gray-800 hover:underline">
                      {productName}
                    </Link>
                  </div>
                  <span className="text-xs text-gray-400">
                    {r.reporter.displayName ?? "Kullanıcı"} bildirdi
                  </span>
                </div>

                {fieldLabel && (
                  <p className="text-xs text-gray-500">Alan: <span className="font-semibold">{fieldLabel}</span></p>
                )}
                {r.review && (
                  <p className="text-sm text-gray-700">&quot;{r.review.summaryText}&quot;</p>
                )}
                {r.question && (
                  <p className="text-sm text-gray-700">&quot;{r.question.text}&quot;</p>
                )}
                {r.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.photo.url} alt="" className="h-20 rounded-lg object-cover" />
                )}

                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{r.note}</p>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {fixLink ? (
                    <Link href={fixLink.href} className="text-xs font-semibold text-gray-900 hover:underline">
                      {fixLink.label}
                    </Link>
                  ) : (
                    <Link href={`/araclar/${r.product.slug}?sekme=soru-cevap`} className="text-xs font-semibold text-gray-900 hover:underline">
                      Soru-Cevap sekmesini görüntüle →
                    </Link>
                  )}
                  <ContentReportActions reportId={r.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
