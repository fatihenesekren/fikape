import Image from "next/image";
import Link from "next/link";
import { FUEL_ICONS, FUEL_LABELS } from "@/lib/fuel";
import { stripModelGenRange } from "@/lib/modelDisplay";

// FI (mavi) · KA (yeşil) · PE (kahve) — sayfanın altındaki FI·KA·PE
// açıklama bloğuyla aynı palet, kart sırasına göre döngüsel atanır.
const CARD_COLORS = [
  { bg: "#0C447C", tint: "#B5D4F4" },
  { bg: "#27500A", tint: "#C0DD97" },
  { bg: "#712B13", tint: "#F5C4B3" },
] as const;

export function TrendVehicleCard({
  slug,
  brandName,
  modelName,
  trimName,
  year,
  imageUrl,
  categoryIcon,
  categoryLabel,
  fuelType,
  garageCount,
  colorIndex,
}: {
  slug: string;
  brandName: string;
  modelName: string;
  trimName: string | null;
  year: number | null;
  imageUrl: string | null;
  categoryIcon: string;
  categoryLabel: string;
  fuelType: string | null;
  garageCount: number;
  colorIndex: number;
}) {
  const { bg, tint } = CARD_COLORS[colorIndex % CARD_COLORS.length];

  return (
    <Link
      href={`/araclar/${slug}`}
      data-scroll-card
      className="shrink-0 snap-start w-56 rounded-2xl p-3.5 transition-transform hover:scale-[1.02]"
      style={{ background: bg }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/10 flex items-center justify-center text-lg">
          {imageUrl ? (
            <Image src={imageUrl} alt="" width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            categoryIcon
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide truncate" style={{ color: tint }}>
            {brandName}
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {stripModelGenRange(modelName)}
            {year && <span className="font-normal ml-1" style={{ color: tint }}>{year}</span>}
          </div>
        </div>
      </div>

      <div className="text-xs truncate mt-1.5 mb-2.5 h-4" style={{ color: tint }}>
        {trimName ?? " "}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {fuelType && FUEL_LABELS[fuelType] && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
            {FUEL_ICONS[fuelType]} {FUEL_LABELS[fuelType]}
          </span>
        )}
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
          {categoryLabel}
        </span>
        {garageCount > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
            {garageCount} garajda
          </span>
        )}
      </div>
    </Link>
  );
}
