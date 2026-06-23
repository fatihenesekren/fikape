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
  "e-scooter": "🔋",
  karavan:     "🏕️",
  kamyonet:    "🛻",
};

interface Props {
  slug: string;
  brandName: string;
  modelName: string;
  trimName: string | null;
  year: number | null;
  categorySlug: string;
  fuelType: string;
  bodyType: string;
  scores: FikapeScores | null;
  totalReviews: number;
  imageUrl?: string | null;
}

export function VehicleCard({
  slug, brandName, modelName, trimName, year,
  categorySlug, fuelType, bodyType,
  scores, totalReviews, imageUrl,
}: Props) {
  const bodyLabel = BODY_LABELS[bodyType];
  const placeholderIcon = bodyLabel
    ? (BODY_ICONS[bodyType] ?? "🚗")
    : (CATEGORY_ICONS[categorySlug] ?? "🚗");
  const isScooter = categorySlug === "e-scooter";
  const placeholderBg = isScooter ? "#f5f5f5" : fuelType === "EV" ? "#0f2027" : "#1a1a2e";

  const typeLabel = bodyLabel ?? CATEGORY_LABELS[categorySlug] ?? categorySlug;
  const fuelColor = FUEL_COLORS[fuelType] ?? FUEL_COLORS.GASOLINE;

  return (
    <Link
      href={`/araclar/${slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Görsel */}
      <div
        className="relative w-full h-44 flex items-center justify-center overflow-hidden border-b border-gray-100"
        style={{ background: placeholderBg }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`${brandName} ${modelName}${trimName ? ` ${trimName}` : ""}`}
            className={`absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-300 ${
              isScooter ? "object-contain p-2" : "object-cover"
            }`}
          />
        ) : (
          <span className="text-5xl opacity-20 select-none">{placeholderIcon}</span>
        )}

        {!isScooter && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        )}

        {/* Sol üst — yakıt tipi */}
        <span
          className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full z-10"
          style={{ background: fuelColor.bg, color: fuelColor.text }}
        >
          {FUEL_ICONS[fuelType]} {FUEL_LABELS[fuelType] ?? fuelType}
        </span>

        {/* Sağ alt — toplam yorum */}
        {totalReviews > 0 && (
          <span className="absolute bottom-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-black/60 text-white z-10">
            {totalReviews} yorum
          </span>
        )}

        {/* Plaka blur — sadece kara araçlarında (e-scooter'da plaka yok) */}
        {imageUrl && !isScooter && (
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
            style={{
              height: "26%",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 50%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 50%)",
            }}
          />
        )}
      </div>

      {/* Kart gövdesi */}
      <div className="px-4 pt-4 pb-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
          {brandName}
        </div>
        <div className="text-base font-bold text-gray-900 leading-tight">
          {year && <span className="text-gray-400 font-medium mr-1">{year}</span>}
          {modelName}
        </div>
        {trimName && (
          <div className="text-sm text-gray-600 font-medium mt-0.5">{trimName}</div>
        )}
        <div className="text-xs text-gray-400 mt-0.5 mb-3">{typeLabel}</div>

        {scores ? (
          <FikapeScore scores={scores} variant="chips" />
        ) : (
          <div className="flex items-center justify-center h-14 rounded-xl border-2 border-dashed border-gray-100 text-xs text-gray-400">
            İlk yorumu sen yaz →
          </div>
        )}
      </div>
    </Link>
  );
}
