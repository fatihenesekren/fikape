import Image from "next/image";
import Link from "next/link";
import { FikapeScore } from "@/components/FikapeScore";
import type { CompareProductView } from "./CompareResultsGrid";

export function VehicleIdentityCard({ product }: { product: CompareProductView }) {
  const { slug, imageUrl, brandName, displayName, subtitle, altText, year, agg } = product;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 min-w-[240px] sm:min-w-0 shrink-0 sm:shrink snap-start">
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
        <div className="mt-3">
          <FikapeScore
            variant="bars"
            reviewCount={agg.count}
            scores={{ scoreFiyat: agg.fi, scoreKalite: agg.ka, scorePerformans: agg.pe, scoreOverall: agg.avg }}
          />
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-3">Veri birikiyor — henüz yorum yok.</p>
      )}
    </div>
  );
}
