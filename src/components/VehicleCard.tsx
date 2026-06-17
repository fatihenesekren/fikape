import Link from "next/link";
import { FikapeScore } from "@/components/FikapeScore";
import type { FikapeScores } from "@/lib/fikape";
import { FUEL_LABELS, FUEL_ICONS, FUEL_COLORS } from "@/lib/fuel";

const BODY_LABELS: Record<string, string> = {
  suv: "SUV", sedan: "Sedan", hatchback: "Hatchback",
  mpv: "MPV", coupe: "Coupé", cabrio: "Cabrio",
  van: "Van", pickup: "Pickup",
};

const BODY_ICONS: Record<string, string> = {
  suv: "🚙", sedan: "🚗", hatchback: "🚗", mpv: "🚐",
  coupe: "🏎", cabrio: "🏎", van: "🚐", pickup: "🛻",
};

const CATEGORY_LABELS: Record<string, string> = {
  otomobil:    "Otomobil",
  motosiklet:  "Motosiklet",
  "e-scooter": "E-Scooter",
  karavan:     "Karavan",
  kamyonet:    "Kamyonet",
};

const CATEGORY_ICONS: Record<string, string> = {
  otomobil:    "🚗",
  motosiklet:  "🏍️",
  "e-scooter": "⚡",
  karavan:     "🏕️",
  kamyonet:    "🛻",
};

export interface Variant {
  slug: string;
  year: number | null;
  trimName: string | null;
  fuelType: string;
}

interface Props {
  primarySlug: string;
  brandName: string;
  modelName: string;
  categorySlug: string;
  attributes: Record<string, unknown>;
  scores: FikapeScores | null;
  totalReviews: number;
  imageUrl?: string | null;
  variants: Variant[];
}

export function VehicleCard({
  primarySlug, brandName, modelName, categorySlug,
  attributes, scores, totalReviews, imageUrl, variants,
}: Props) {
  const primaryFuelType = String(attributes.fuel_type ?? "");
  const bodyType = String(attributes.body_type ?? "");
  const bodyLabel = BODY_LABELS[bodyType];
  const placeholderIcon = bodyLabel
    ? (BODY_ICONS[bodyType] ?? "🚗")
    : (CATEGORY_ICONS[categorySlug] ?? "🚗");
  const placeholderBg = primaryFuelType === "EV" ? "#0f2027" : "#1a1a2e";

  // Kart gövdesinde gösterilecek tip etiketi: kasa tipi biliniyorsa onu, yoksa kategori adı
  const typeLabel = bodyLabel ?? CATEGORY_LABELS[categorySlug] ?? categorySlug;

  const uniqueFuels = [...new Set(variants.map((v) => v.fuelType).filter(Boolean))];
  const hasMultipleFuels = uniqueFuels.length > 1;
  const fuelColor = FUEL_COLORS[primaryFuelType] ?? FUEL_COLORS.GASOLINE;

  // Fotoğrafa tıklayınca açılacak varyantın etiketi
  const primaryVariant = variants.find((v) => v.slug === primarySlug) ?? variants[0];
  const primaryLabel = [primaryVariant?.trimName, primaryVariant?.year]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      <Link href={`/araclar/${primarySlug}`} className="block group">

        {/* Görsel */}
        <div
          className="relative w-full h-44 flex items-center justify-center overflow-hidden"
          style={{ background: placeholderBg }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`${brandName} ${modelName}`}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-5xl opacity-20 select-none">{placeholderIcon}</span>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          {/* Sol üst — yakıt tipi */}
          {hasMultipleFuels ? (
            <span className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full z-10 bg-black/50 text-white backdrop-blur-sm">
              {uniqueFuels.length} yakıt tipi
            </span>
          ) : (
            <span
              className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full z-10"
              style={{ background: fuelColor.bg, color: fuelColor.text }}
            >
              {FUEL_ICONS[primaryFuelType]} {FUEL_LABELS[primaryFuelType] ?? primaryFuelType}
            </span>
          )}

          {/* Sol alt — tıklayınca açılacak varyant */}
          {primaryLabel && (
            <span className="absolute bottom-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full z-10 bg-black/60 text-white">
              {primaryLabel}
            </span>
          )}

          {/* Sağ alt — toplam yorum */}
          {totalReviews > 0 && (
            <span className="absolute bottom-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-black/60 text-white z-10">
              {totalReviews} yorum
            </span>
          )}
        </div>

        {/* Kart gövdesi */}
        <div className="px-4 pt-4 pb-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
            {brandName}
          </div>
          <div className="text-base font-bold text-gray-900 leading-tight mb-1">
            {modelName}
          </div>
          <div className="text-xs text-gray-400 mb-3">{typeLabel}</div>

          {scores ? (
            <FikapeScore scores={scores} variant="chips" />
          ) : (
            <div className="flex items-center justify-center h-14 rounded-xl border-2 border-dashed border-gray-100 text-xs text-gray-400">
              İlk yorumu sen yaz →
            </div>
          )}
        </div>
      </Link>

      {/* Varyant chip'leri */}
      {variants.length > 0 && (
        <div className="px-4 pb-4 flex flex-wrap gap-1.5">
          {variants.map((v) => {
            const fc = FUEL_COLORS[v.fuelType] ?? FUEL_COLORS.GASOLINE;
            const icon = FUEL_ICONS[v.fuelType] ?? "";
            const label = [v.trimName, v.year].filter(Boolean).join(" · ");
            const isPrimary = v.slug === primarySlug;

            return (
              <Link
                key={v.slug}
                href={`/araclar/${v.slug}`}
                title={isPrimary ? "Kart tıklamasıyla açılan varyant" : undefined}
                className="text-xs px-2.5 py-1 rounded-lg border transition-all hover:opacity-80"
                style={
                  isPrimary
                    ? {
                        background: fc.bg,
                        color: fc.text,
                        borderColor: "transparent",
                        fontWeight: 700,
                      }
                    : {
                        background: "#fff",
                        color: fc.text,
                        borderColor: fc.bg,
                        fontWeight: 500,
                      }
                }
              >
                {icon} {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
