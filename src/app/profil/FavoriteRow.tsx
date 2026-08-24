import Link from "next/link";
import Image from "next/image";
import { stripModelGenRange, splitTrimName } from "@/lib/modelDisplay";
import { FUEL_ICONS } from "@/lib/fuel";
import { isDomesticBrand } from "@/lib/domesticBrands";
import { TrFlagIcon } from "@/components/VehicleCard";
import { FavoriteRemoveButton } from "./FavoriteRemoveButton";

interface FavoriteProduct {
  id: number;
  slug: string;
  year: number | null;
  trimName: string | null;
  attributes: unknown;
  brand: { name: string };
  model: { name: string };
  category: { slug: string } | null;
}

export function FavoriteRow({
  product,
  imageUrl,
  score,
}: {
  product: FavoriteProduct;
  imageUrl: string | null;
  score: { avg: number; count: number } | null;
}) {
  const attrs = (product.attributes as Record<string, unknown>) ?? {};
  const fuelType = String(attrs.fuel_type ?? "");
  const isDomestic = isDomesticBrand(product.brand.name);
  const categorySlug = product.category?.slug ?? "otomobil";
  // 56x40'lık minik kutuda VehicleCard'daki (h-44, geniş kutu) object-cover
  // dikey/dar fotoğraflarda (scooter, motosiklet) aracı neredeyse tamamen
  // kırpıyor — burada motosikleti de "dar araç" grubuna dahil ediyoruz.
  const isNarrowVehicle = categorySlug === "e-scooter" || categorySlug === "e-bisiklet" || categorySlug === "motosiklet";
  const trimSplit = splitTrimName(product.trimName);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-2.5 flex items-center gap-3">
      <Link
        href={`/araclar/${product.slug}`}
        className="flex-1 min-w-0 flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div
          className="relative w-14 h-10 shrink-0 rounded-lg overflow-hidden"
          style={{ background: isNarrowVehicle ? "#f5f5f5" : "#f3f4f6" }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="56px"
              className={isNarrowVehicle ? "object-contain p-1" : "object-cover"}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-lg opacity-30">
              {isNarrowVehicle ? "🛴" : "🚗"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 truncate flex items-center gap-1">
            {product.brand.name}
            {isDomestic && <TrFlagIcon />}
            {fuelType && <span>{FUEL_ICONS[fuelType]}</span>}
          </div>
          <div className="font-semibold text-gray-900 truncate text-sm">
            {trimSplit ? trimSplit.version : stripModelGenRange(product.model.name)}
            {product.year && <span className="text-gray-400 font-normal ml-1">{product.year}</span>}
          </div>
          {trimSplit && (
            <div className="text-[10px] text-gray-400 truncate">{trimSplit.donanim}</div>
          )}
        </div>
      </Link>

      <div className="text-right shrink-0">
        {score && score.count > 0 ? (
          <>
            <div className="text-base font-black text-gray-900">{score.avg.toFixed(1)}</div>
            <div className="text-[10px] text-gray-400">{score.count} yorum</div>
          </>
        ) : (
          <Link
            href={`/yorum-yaz?arac=${product.slug}`}
            className="text-[11px] text-gray-400 hover:text-gray-600 underline whitespace-nowrap"
          >
            İlk yorumu sen yaz →
          </Link>
        )}
      </div>

      <FavoriteRemoveButton productId={product.id} />
    </div>
  );
}
