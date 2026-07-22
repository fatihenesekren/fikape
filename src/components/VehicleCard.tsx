import Link from "next/link";
import Image from "next/image";
import { FikapeScore } from "@/components/FikapeScore";
import type { FikapeScores } from "@/lib/fikape";
import { FUEL_LABELS, FUEL_ICONS, FUEL_COLORS } from "@/lib/fuel";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { isDomesticBrand } from "@/lib/domesticBrands";

export function TrFlagIcon() {
  return (
    <svg
      viewBox="0 0 30 20"
      width="14"
      height="9.5"
      role="img"
      aria-label="Yerli üretim"
    >
      <rect width="30" height="20" fill="#E30A17" />
      <circle cx="12" cy="10" r="5.5" fill="#fff" />
      <circle cx="13.5" cy="10" r="4.4" fill="#E30A17" />
      <polygon
        fill="#fff"
        points="18.5,10 20.9,10.75 19.45,8.73 19.45,11.27 20.9,9.25"
      />
    </svg>
  );
}

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
  otomobil:     "Otomobil",
  motosiklet:   "Motosiklet",
  "e-scooter":  "E-Scooter",
  "e-bisiklet": "E-Bisiklet",
  karavan:      "Karavan",
  kamyonet:     "Kamyonet",
};

const KARAVAN_TYPE_LABELS: Record<string, string> = {
  cekme:       "Çekme",
  motorlu:     "Motorlu",
  "kamper-van": "Kamper-Van",
};

const CATEGORY_ICONS: Record<string, string> = {
  otomobil:     "🚗",
  motosiklet:   "🏍️",
  "e-scooter":  "🔋",
  "e-bisiklet": "🚴",
  karavan:      "🏕️",
  kamyonet:     "🛻",
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
  motorType?: string | null;
  karavanType?: string | null;
  motorWatt?: number | null;
  scores: FikapeScores | null;
  imageUrl?: string | null;
}

export function VehicleCard({
  slug, brandName, modelName, trimName, year,
  categorySlug, fuelType, bodyType, motorType, karavanType, motorWatt,
  scores, imageUrl,
}: Props) {
  const bodyLabel = BODY_LABELS[bodyType];
  const placeholderIcon = bodyLabel
    ? (BODY_ICONS[bodyType] ?? "🚗")
    : (CATEGORY_ICONS[categorySlug] ?? "🚗");
  const isScooter = categorySlug === "e-scooter" || categorySlug === "e-bisiklet";
  const placeholderBg = isScooter ? "#f5f5f5" : fuelType === "EV" ? "#0f2027" : "#1a1a2e";

  const typeLabel = bodyLabel ?? CATEGORY_LABELS[categorySlug] ?? categorySlug;
  const fuelColor = FUEL_COLORS[fuelType] ?? FUEL_COLORS.GASOLINE;
  const cleanModelName = stripModelGenRange(modelName);
  const isDomestic = isDomesticBrand(brandName);

  return (
    <Link
      href={`/araclar/${slug}`}
      className={`group relative block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
    >
      {isDomestic && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-[3px] z-10"
          style={{
            background:
              "linear-gradient(to bottom, #E30A17 0, #E30A17 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #E30A17 66.66%, #E30A17 100%)",
          }}
        />
      )}
      {/* Görsel */}
      <div
        className="relative w-full h-44 flex items-center justify-center overflow-hidden border-b border-gray-100"
        style={{ background: placeholderBg }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${brandName} ${cleanModelName}${trimName ? ` ${trimName}` : ""}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`group-hover:scale-105 transition-transform duration-300 ${
              isScooter ? "object-contain p-2" : "object-cover"
            }`}
          />
        ) : (
          <span className="text-5xl opacity-20 select-none">{placeholderIcon}</span>
        )}

        {!isScooter && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        )}

        {/* Sol üst rozet — kategori bazlı */}
        {categorySlug === "e-bisiklet" ? (
          motorType && (
            <span className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full z-10 bg-white/90 text-gray-700">
              {motorType === "mid-drive" ? "Mid-Drive" : "Hub-Drive"}
            </span>
          )
        ) : categorySlug === "karavan" ? (
          karavanType && (
            <span className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full z-10 bg-white/90 text-gray-700">
              {KARAVAN_TYPE_LABELS[karavanType] ?? karavanType}
            </span>
          )
        ) : categorySlug === "e-scooter" ? (
          motorWatt != null && (
            <span className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full z-10 bg-white/90 text-gray-700">
              {motorWatt}W
            </span>
          )
        ) : fuelType ? (
          <span
            className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full z-10"
            style={{ background: fuelColor.bg, color: fuelColor.text }}
          >
            {FUEL_ICONS[fuelType]} {FUEL_LABELS[fuelType] ?? fuelType}
          </span>
        ) : null}

        {/* Plaka blur — sadece kara araçlarında (e-scooter'da plaka yok) */}
        {imageUrl && !isScooter && (
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
            style={{
              height: "10%",
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
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5 flex items-center gap-1">
          {brandName}
          {isDomestic && <TrFlagIcon />}
        </div>
        <div className="text-base font-bold text-gray-900 leading-tight">
          {year && <span className="text-gray-400 font-medium mr-1">{year}</span>}
          {cleanModelName}
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
