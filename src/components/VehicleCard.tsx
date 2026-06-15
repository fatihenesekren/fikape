import Link from "next/link";
import { FikapeScore } from "@/components/FikapeScore";
import type { FikapeScores } from "@/lib/fikape";

const FUEL_LABELS: Record<string, string> = {
  EV: "Elektrikli", GASOLINE: "Benzin", DIESEL: "Dizel",
  HYBRID: "Hibrit", LPG: "LPG",
};

const FUEL_COLORS: Record<string, { bg: string; text: string }> = {
  EV:       { bg: "#C0DD97", text: "#27500A" },
  GASOLINE: { bg: "#D3D1C7", text: "#444441" },
  DIESEL:   { bg: "#FAC775", text: "#412402" },
  HYBRID:   { bg: "#B5D4F4", text: "#0C447C" },
  LPG:      { bg: "#F4C0D1", text: "#4B1528" },
};

const BODY_ICONS: Record<string, string> = {
  suv: "🚙", sedan: "🚗", hatchback: "🚗", mpv: "🚐", coupe: "🏎", cabrio: "🏎",
};

interface Props {
  slug: string;
  brandName: string;
  modelName: string;
  trimName?: string | null;
  year: number | null;
  attributes: Record<string, unknown>;
  scores: FikapeScores | null;
  reviewCount: number;
  imageUrl?: string | null;
}

export function VehicleCard({
  slug, brandName, modelName, trimName, year, attributes,
  scores, reviewCount, imageUrl,
}: Props) {
  const fuelType = String(attributes.fuel_type ?? "");
  const bodyType = String(attributes.body_type ?? "sedan");
  const fuelLabel = FUEL_LABELS[fuelType] ?? fuelType;
  const fuelColor = FUEL_COLORS[fuelType] ?? FUEL_COLORS.GASOLINE;
  const bodyIcon = BODY_ICONS[bodyType] ?? "🚗";

  const placeholderBg = fuelType === "EV"
    ? "#0f2027"
    : "#1a1a2e";

  return (
    <Link href={`/araclar/${slug}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

        {/* Görsel alanı */}
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
            <span className="text-5xl opacity-20 select-none">
              {bodyIcon}
            </span>
          )}

          {/* Gradient overlay — rozet okunabilirliği için */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Yakıt rozeti */}
          <span
            className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full z-10"
            style={{ background: fuelColor.bg, color: fuelColor.text }}
          >
            {fuelType === "EV" && "⚡ "}{fuelLabel}
          </span>

          {/* Yorum sayısı */}
          {reviewCount > 0 && (
            <span className="absolute bottom-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-black/60 text-white z-10">
              {reviewCount} yorum
            </span>
          )}
        </div>

        {/* Kart gövdesi */}
        <div className="p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
            {brandName}
          </div>
          <div className="text-base font-bold text-gray-900 leading-tight">
            {modelName}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 mb-3">
            {trimName && (
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                {trimName}
              </span>
            )}
            {year && (
              <span className="text-xs text-gray-400">{year}</span>
            )}
          </div>

          {scores ? (
            <FikapeScore scores={scores} variant="chips" />
          ) : (
            <div className="flex items-center justify-center h-14 rounded-xl border-2 border-dashed border-gray-100 text-xs text-gray-400">
              İlk yorumu sen yaz →
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
