import Image from "next/image";
import Link from "next/link";
import type { CompareProductView } from "./CompareResultsGrid";

// Skor karşılaştırması artık ayrı bir satır-bazlı bölümde (CompareScoreRow) —
// kart burada sadece hızlı kimlik doğrulama için genel skoru kısaca gösteriyor,
// detaylı FI-KA-PE kırılımı için kullanıcı aşağı kaydırır.
export function VehicleIdentityCard({ product }: { product: CompareProductView }) {
  const { slug, imageUrl, brandName, displayName, subtitle, altText, year, agg } = product;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 min-w-[240px] sm:min-w-0 shrink-0 sm:shrink snap-start shadow-sm hover:shadow-md transition-shadow">
      {imageUrl && (
        <div className="relative w-full aspect-[4/3] mb-3 rounded-xl overflow-hidden bg-gray-50">
          <Image src={imageUrl} alt={altText} fill className="object-contain p-2" />
        </div>
      )}
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{brandName}</div>
      <Link href={`/araclar/${slug}`} className="font-bold text-gray-900 hover:underline">
        {displayName}{year ? ` ${year}` : ""}
      </Link>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}

      {agg.count > 0 ? (
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-gray-900">{agg.avg.toFixed(1)}</span>
          <span className="text-xs text-gray-400">/10 · {agg.count} yorum</span>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-3">Veri birikiyor — henüz yorum yok. Aşağıda AI izlenimine bakabilirsin.</p>
      )}
    </div>
  );
}
