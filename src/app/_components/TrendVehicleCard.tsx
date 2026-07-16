import Image from "next/image";
import Link from "next/link";
import { FUEL_ICONS, FUEL_LABELS } from "@/lib/fuel";
import { stripModelGenRange } from "@/lib/modelDisplay";

// FI (mavi) · KA (yeşil) · PE (kahve) — sayfanın altındaki FI·KA·PE açıklama
// bloğuyla aynı "açık ton wash" dili: 50 seviyesi arka plan + kendi renginin
// koyu tonunda metin. Doygun/koyu dolgu bilinçli olarak kullanılmıyor — hero
// zaten koyu bir blok, hemen altında ikinci bir koyu şerit sayfayı ağırlaştırıyordu.
const CARD_COLORS = [
  { bg: "#E6F1FB", mid: "#185FA5", dark: "#0C447C", chip: "rgba(12,68,124,0.12)" },
  { bg: "#EAF3DE", mid: "#3B6D11", dark: "#27500A", chip: "rgba(39,80,10,0.12)" },
  { bg: "#FAECE7", mid: "#993C1D", dark: "#712B13", chip: "rgba(113,43,19,0.12)" },
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
  const { bg, mid, dark, chip } = CARD_COLORS[colorIndex % CARD_COLORS.length];

  return (
    <Link
      href={`/araclar/${slug}`}
      data-scroll-card
      className="shrink-0 snap-start w-56 rounded-2xl p-3.5 transition-transform hover:scale-[1.02]"
      style={{ background: bg }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-lg" style={{ background: chip }}>
          {imageUrl ? (
            <Image src={imageUrl} alt="" width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            categoryIcon
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide truncate" style={{ color: mid }}>
            {brandName}
          </div>
          <div className="text-sm font-semibold truncate" style={{ color: dark }}>
            {stripModelGenRange(modelName)}
            {year && <span className="font-normal ml-1" style={{ color: mid }}>{year}</span>}
          </div>
        </div>
      </div>

      <div className="text-xs truncate mt-1.5 mb-2.5 h-4" style={{ color: mid }}>
        {trimName ?? " "}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {fuelType && FUEL_LABELS[fuelType] && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: chip, color: dark }}>
            {FUEL_ICONS[fuelType]} {FUEL_LABELS[fuelType]}
          </span>
        )}
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: chip, color: dark }}>
          {categoryLabel}
        </span>
        {garageCount > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: chip, color: dark }}>
            {garageCount} garajda
          </span>
        )}
      </div>
    </Link>
  );
}
