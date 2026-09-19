import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { ComparePicker } from "../ComparePicker";
import { CompareResultsGrid } from "../CompareResultsGrid";
import { dedupeAndLimitSlugs, loadCompareData, loadCompareMetaNames } from "../loadCompareData";
import { ScrollTopLogo } from "@/app/_components/ScrollTopLogo";

// URL şeması: /karsilastir/slug1-vs-slug2-vs-slug3 (SEO/paylaşım için path-based,
// eski `?urunler=slug1,slug2` query-string şemasından geçiş — bkz. karsilastir/page.tsx
// 301/308 yönlendirmesi). Ayırıcı "-vs-" seçildi çünkü ürün slug'ları (örn.
// "renault-clio-2023") kendi içinde tek tire kullanıyor, "-vs-" hiçbir gerçek
// slug'da geçmeyen belirgin bir ayraç.
function parseComparisonParam(comparison: string): string[] {
  return dedupeAndLimitSlugs(comparison.split("-vs-"));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparison: string }>;
}): Promise<Metadata> {
  const { comparison } = await params;
  const slugs = parseComparisonParam(decodeURIComponent(comparison));
  if (slugs.length < 2) {
    return {
      title: "Araç Karşılaştır",
      description: "İki veya daha fazla aracı fikape kullanıcı puanlarına göre yan yana karşılaştır.",
    };
  }
  const names = (await loadCompareMetaNames(slugs)).join(" vs ");
  if (!names) {
    return {
      title: "Araç Karşılaştır",
      description: "İki veya daha fazla aracı fikape kullanıcı puanlarına göre yan yana karşılaştır.",
    };
  }
  return {
    title: `${names} Karşılaştırma`,
    description: `${names} — fikape kullanıcı yorumlarına dayalı FI·KA·PE skor karşılaştırması.`,
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ comparison: string }>;
}) {
  const { comparison } = await params;
  const slugs = parseComparisonParam(decodeURIComponent(comparison));
  const { droppedCount, productViews, specRows, comparisonSchema, pickerInitial } = await loadCompareData(slugs);

  return (
    <>
      {comparisonSchema && <JsonLd data={comparisonSchema} />}

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Ana sayfaya dön
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Araç Karşılaştır</h1>
        <p className="text-sm text-gray-400 mb-8">
          fikape kullanıcı yorumlarına dayalı, iki veya daha fazla aracı yan yana karşılaştır.
        </p>

        {droppedCount > 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
            Farklı kategoriden {droppedCount} araç karşılaştırmadan çıkarıldı — aynı anda sadece aynı kategoriden araçlar (örn. hepsi otomobil) karşılaştırılabiliyor.
          </p>
        )}

        <ComparePicker initial={pickerInitial} />

        <CompareResultsGrid products={productViews} specRows={specRows} />
      </div>

      <section className="bg-[#111] text-white mt-4">
        <div className="max-w-7xl mx-auto px-4 py-14 text-center">
          <ScrollTopLogo />
          <p className="text-gray-300 text-lg font-bold mb-2">
            Hadi aracını değerlendirelim.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Yorumun bir sonraki alıcının kararını değiştirebilir.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="/yorum-yaz"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-[#111] bg-white hover:bg-gray-100 transition-colors"
            >
              Yorum Yaz →
            </a>
            <a
              href="/oner"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white border border-white/20 hover:border-white/40 transition-colors"
            >
              Araç Öner
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
