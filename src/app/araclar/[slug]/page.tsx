import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { FikapeScore } from "@/components/FikapeScore";
import { ReviewCard } from "@/components/ReviewCard";
import { GarageButton } from "./GarageButton";
import { PhotoSlider } from "./PhotoSlider";
import { TabView } from "./TabView";
import { calcOverall } from "@/lib/fikape";
import { getVehicleImageUrl } from "@/lib/vehicleImages";
import type { FikapeScores } from "@/lib/fikape";
import { FUEL_LABELS, FUEL_ICONS, FUEL_COLORS } from "@/lib/fuel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { brand: true, model: true },
  });
  if (!product) return {};

  const attrs = product.attributes as Record<string, unknown>;
  const fuelType = String(attrs.fuel_type ?? "");
  const fuelLabel = FUEL_LABELS[fuelType] ?? "";
  const name = `${product.brand.name} ${product.model.name}${product.year ? ` ${product.year}` : ""}`;
  const title = `${name} Kullanıcı Yorumları`;
  const description = `${name}${fuelLabel ? ` (${fuelLabel})` : ""} hakkında gerçek kullanıcı yorumları ve fi·ka·pe puanları. Fiyat, kalite ve performans değerlendirmeleri.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
  };
}

const BODY_LABELS: Record<string, string> = {
  sedan: "Sedan", suv: "SUV", hatchback: "Hatchback",
  mpv: "MPV", coupe: "Coupe", cabrio: "Cabriolet",
  pickup: "Pickup", van: "Van",
};

const BODY_ICONS: Record<string, string> = {
  suv: "🚙", sedan: "🚗", hatchback: "🚗", mpv: "🚐", coupe: "🏎", cabrio: "🏎",
  pickup: "🛻", van: "🚐",
};

const MOTO_TYPE_LABELS: Record<string, string> = {
  naked: "Naked", sport: "Spor", adventure: "Adventure", touring: "Touring", elektrikli: "Elektrikli",
};

const KARAVAN_TYPE_LABELS: Record<string, string> = {
  cekme: "Çekme Karavan", motorlu: "Motorlu Karavan",
};

const CATEGORY_FALLBACK_ICONS: Record<string, string> = {
  otomobil: "🚗", motosiklet: "🏍️", "e-scooter": "🛴", karavan: "🏕️", kamyonet: "🛻",
};

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ yorum?: string }>;
}) {
  const { slug } = await params;
  const { yorum } = await searchParams;

  const [product, session] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        model: true,
        category: true,
        photos: {
          where: { status: "APPROVED" },
          orderBy: { order: "asc" },
          select: { url: true },
        },
      },
    }),
    auth(),
    prisma.product.updateMany({
      where: { slug },
      data: { viewCount: { increment: 1 }, weeklyViewCount: { increment: 1 } },
    }).catch(() => {}),
  ]);

  if (!product) notFound();

  const attrs = product.attributes as Record<string, unknown>;
  const categorySlug = product.category?.slug ?? "";
  const imageUrl = product.imageUrl ?? await getVehicleImageUrl(slug);

  const sliderPhotos: string[] = [
    ...(imageUrl ? [imageUrl] : []),
    ...product.photos.map((p) => p.url),
  ];

  const fuelType = String(attrs.fuel_type ?? "");
  const bodyType = attrs.body_type ? String(attrs.body_type) : null;
  const motoType = attrs.moto_type ? String(attrs.moto_type) : null;
  const karavanType = attrs.karavan_type ? String(attrs.karavan_type) : null;
  const fuelColor = FUEL_COLORS[fuelType] ?? FUEL_COLORS.GASOLINE;

  const userId = session?.user?.id ? Number(session.user.id) : null;
  const inGarage = userId
    ? !!(await prisma.userProduct.findUnique({
        where: { userId_productId: { userId, productId: product.id } },
      }))
    : false;

  const agg = await prisma.review.aggregate({
    where: { productId: product.id, status: "PUBLISHED" },
    _avg: {
      scoreFiyat: true,
      scoreKalite: true,
      scorePerformans: true,
      scoreOverall: true,
    },
    _count: { id: true },
  });

  const reviewCount = agg._count.id;
  const scores: FikapeScores | null =
    reviewCount > 0
      ? {
          scoreFiyat:      agg._avg.scoreFiyat      ?? 0,
          scoreKalite:     agg._avg.scoreKalite     ?? 0,
          scorePerformans: agg._avg.scorePerformans ?? 0,
          scoreOverall:    agg._avg.scoreOverall    ?? 0,
        }
      : null;

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "PUBLISHED" },
    include: {
      user: { select: { displayName: true, trustLevel: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  // ── Spec strip — kategori bazlı 5 öne çıkan özellik ──
  type SpecItem = { label: string; value: string };

  const heroSpecsRaw: (SpecItem | null)[] = (() => {
    if (categorySlug === "e-scooter") return [
      attrs.motor_watt     ? { label: "Motor",      value: `${attrs.motor_watt} W` }         : null,
      attrs.range_km       ? { label: "Menzil",     value: `${attrs.range_km} km` }           : null,
      attrs.max_speed_kmh  ? { label: "Maks. Hız",  value: `${attrs.max_speed_kmh} km/s` }   : null,
      attrs.battery_wh     ? { label: "Batarya",    value: `${attrs.battery_wh} Wh` }         : null,
      attrs.weight_kg      ? { label: "Ağırlık",    value: `${attrs.weight_kg} kg` }          : null,
    ];
    if (categorySlug === "motosiklet") return [
      attrs.engine_cc      ? { label: "Motor",      value: `${attrs.engine_cc} cc` }          : (attrs.ev_range_km ? { label: "Menzil", value: `${attrs.ev_range_km} km` } : null),
      attrs.power_hp       ? { label: "Güç",        value: `${attrs.power_hp} HP` }           : null,
      attrs.torque_nm      ? { label: "Tork",       value: `${attrs.torque_nm} Nm` }          : null,
      attrs.seat_height_mm ? { label: "Sele Yüksekliği", value: `${attrs.seat_height_mm} mm` } : null,
      attrs.tank_l         ? { label: "Depo",       value: `${attrs.tank_l} L` }              : null,
    ];
    if (categorySlug === "karavan") return [
      attrs.berth            ? { label: "Yatak Kapasitesi", value: `${attrs.berth} kişi` }       : null,
      attrs.length_cm        ? { label: "Uzunluk",         value: `${attrs.length_cm} cm` }     : null,
      attrs.total_weight_kg  ? { label: "Toplam Ağırlık",  value: `${attrs.total_weight_kg} kg` } : null,
      attrs.has_bathroom != null ? { label: "Banyo",  value: attrs.has_bathroom ? "Var" : "Yok" } : null,
      attrs.has_kitchen  != null ? { label: "Mutfak", value: attrs.has_kitchen  ? "Var" : "Yok" } : null,
    ];
    if (categorySlug === "kamyonet") return [
      attrs.power_hp         ? { label: "Güç",              value: `${attrs.power_hp} HP` }        : null,
      attrs.payload_kg       ? { label: "Yük Kapasitesi",   value: `${attrs.payload_kg} kg` }      : null,
      attrs.torque_nm        ? { label: "Tork",             value: `${attrs.torque_nm} Nm` }       : null,
      attrs.tow_capacity_kg  ? { label: "Çekme Kapasitesi", value: `${attrs.tow_capacity_kg} kg` } : null,
      attrs.four_wd != null  ? { label: "4×4",        value: attrs.four_wd ? "Var" : "Yok" }  : null,
    ];
    return [
      attrs.engine_cc    ? { label: "Motor",     value: `${attrs.engine_cc} cc` }             : (attrs.battery_kwh ? { label: "Batarya", value: `${attrs.battery_kwh} kWh` } : null),
      attrs.power_hp     ? { label: "Güç",       value: `${attrs.power_hp} HP` }              : null,
      attrs.zero_to_100  ? { label: "0–100",     value: `${attrs.zero_to_100} sn` }           : null,
      attrs.transmission ? { label: "Vites",     value: String(attrs.transmission) }           : null,
      attrs.ev_range_km  ? { label: "Menzil",    value: `${attrs.ev_range_km} km` }           : (attrs.tank_l ? { label: "Yakıt Deposu", value: `${attrs.tank_l} L` } : null),
    ];
  })();
  const heroSpecs = heroSpecsRaw.filter(Boolean) as SpecItem[];

  // ── Tab: Teknik Özellikler (tam liste) ──
  const specsRaw: (SpecItem | null)[] = (() => {
    if (categorySlug === "e-scooter") return [
      attrs.motor_watt    ? { label: "Motor Gücü",     value: `${attrs.motor_watt} W` }       : null,
      attrs.range_km      ? { label: "Menzil",         value: `${attrs.range_km} km` }         : null,
      attrs.max_speed_kmh ? { label: "Maks. Hız",      value: `${attrs.max_speed_kmh} km/s` } : null,
      attrs.battery_wh    ? { label: "Batarya",        value: `${attrs.battery_wh} Wh` }       : null,
      attrs.weight_kg     ? { label: "Ağırlık",        value: `${attrs.weight_kg} kg` }        : null,
      attrs.charge_hours  ? { label: "Şarj Süresi",    value: `~${attrs.charge_hours} saat` }  : null,
      attrs.ip_rating     ? { label: "Su Geçirmezlik", value: String(attrs.ip_rating) }        : null,
      attrs.max_load_kg   ? { label: "Maks. Yük",      value: `${attrs.max_load_kg} kg` }      : null,
      attrs.tire_inch     ? { label: "Lastik",         value: `${attrs.tire_inch}"` }           : null,
    ];
    if (categorySlug === "motosiklet") return [
      fuelType              ? { label: "Yakıt",        value: FUEL_LABELS[fuelType] ?? fuelType } : null,
      motoType              ? { label: "Tip",          value: MOTO_TYPE_LABELS[motoType] ?? motoType } : null,
      attrs.engine_cc       ? { label: "Motor",        value: `${attrs.engine_cc} cc` }        : null,
      attrs.power_hp        ? { label: "Güç",          value: `${attrs.power_hp} HP` }         : null,
      attrs.torque_nm       ? { label: "Tork",         value: `${attrs.torque_nm} Nm` }        : null,
      attrs.gearbox         ? { label: "Şanzıman",     value: `${attrs.gearbox} vites` }       : null,
      attrs.abs != null     ? { label: "ABS",          value: attrs.abs ? "Var" : "Yok" }      : null,
      attrs.tank_l          ? { label: "Depo",         value: `${attrs.tank_l} L` }            : null,
      attrs.weight_kg       ? { label: "Ağırlık",      value: `${attrs.weight_kg} kg` }        : null,
      attrs.seat_height_mm  ? { label: "Sele Yüks.",   value: `${attrs.seat_height_mm} mm` }   : null,
      attrs.ev_range_km     ? { label: "Menzil",       value: `${attrs.ev_range_km} km (WLTP)` } : null,
    ];
    if (categorySlug === "karavan") return [
      karavanType            ? { label: "Tip",         value: KARAVAN_TYPE_LABELS[karavanType] ?? karavanType } : null,
      attrs.berth            ? { label: "Yatak Kap.",  value: `${attrs.berth} kişi` }          : null,
      attrs.length_cm        ? { label: "Uzunluk",     value: `${attrs.length_cm} cm` }        : null,
      attrs.width_cm         ? { label: "Genişlik",    value: `${attrs.width_cm} cm` }         : null,
      attrs.total_weight_kg  ? { label: "Toplam Ağ.",  value: `${attrs.total_weight_kg} kg` }  : null,
      attrs.tow_weight_kg    ? { label: "Çekme Ağ.",   value: `${attrs.tow_weight_kg} kg` }    : null,
      attrs.has_bathroom != null ? { label: "Banyo",   value: attrs.has_bathroom ? "Var" : "Yok" } : null,
      attrs.has_kitchen  != null ? { label: "Mutfak",  value: attrs.has_kitchen  ? "Var" : "Yok" } : null,
      attrs.has_ac       != null ? { label: "Klima",   value: attrs.has_ac       ? "Var" : "Yok" } : null,
    ];
    if (categorySlug === "kamyonet") return [
      fuelType               ? { label: "Yakıt",       value: FUEL_LABELS[fuelType] ?? fuelType } : null,
      bodyType               ? { label: "Kasa",        value: BODY_LABELS[bodyType] ?? bodyType } : null,
      attrs.engine_cc        ? { label: "Motor",       value: `${attrs.engine_cc} cc` }        : null,
      attrs.power_hp         ? { label: "Güç",         value: `${attrs.power_hp} HP` }         : null,
      attrs.torque_nm        ? { label: "Tork",        value: `${attrs.torque_nm} Nm` }        : null,
      attrs.four_wd != null  ? { label: "4×4",         value: attrs.four_wd ? "Var" : "Yok" }  : null,
      attrs.payload_kg       ? { label: "Yük Kap.",    value: `${attrs.payload_kg} kg` }       : null,
      attrs.tow_capacity_kg  ? { label: "Çekme Kap.",  value: `${attrs.tow_capacity_kg} kg` }  : null,
      attrs.tank_l           ? { label: "Yakıt Dep.",  value: `${attrs.tank_l} L` }            : null,
    ];
    return [
      fuelType             ? { label: "Yakıt",         value: FUEL_LABELS[fuelType] ?? fuelType } : null,
      bodyType             ? { label: "Kasa",          value: BODY_LABELS[bodyType] ?? bodyType } : null,
      attrs.segment        ? { label: "Segment",       value: `${attrs.segment} Segment` }     : null,
      attrs.drivetrain     ? { label: "Çekiş",         value: String(attrs.drivetrain) }        : null,
      attrs.transmission   ? { label: "Vites",         value: String(attrs.transmission) }      : null,
      attrs.engine_cc      ? { label: "Motor",         value: `${attrs.engine_cc} cc` }         : null,
      attrs.power_hp       ? { label: "Güç",           value: `${attrs.power_hp} HP` }          : null,
      attrs.torque_nm      ? { label: "Tork",          value: `${attrs.torque_nm} Nm` }         : null,
      attrs.zero_to_100    ? { label: "0–100 km/s",    value: `${attrs.zero_to_100} sn` }       : null,
      attrs.top_speed_kmh  ? { label: "Azami Hız",     value: `${attrs.top_speed_kmh} km/s` }   : null,
      attrs.ev_range_km    ? { label: "Menzil",        value: `${attrs.ev_range_km} km (WLTP)` } : null,
      attrs.battery_kwh    ? { label: "Batarya",       value: `${attrs.battery_kwh} kWh` }      : null,
      attrs.tank_l         ? { label: "Yakıt Dep.",    value: `${attrs.tank_l} L` }             : null,
      attrs.boot_l         ? { label: "Bagaj",         value: `${attrs.boot_l} L` }             : null,
      attrs.weight_kg      ? { label: "Ağırlık",       value: `${attrs.weight_kg} kg` }         : null,
    ];
  })();
  const specs = specsRaw.filter(Boolean) as SpecItem[];

  // ── Tab içerikleri (server render) ──
  const reviewsContent = reviews.length === 0 ? (
    <div className="p-10 text-center space-y-3">
      <div className="text-3xl">✍️</div>
      <p className="font-semibold text-gray-800">Bu araç için ilk yorumu sen yaz</p>
      <p className="text-sm text-gray-400">Gerçek deneyimini paylaş, diğer kullanıcılara yol göster.</p>
      <Link
        href={`/yorum-yaz?arac=${slug}`}
        className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: "#111" }}
      >
        Yorum Yaz →
      </Link>
    </div>
  ) : (
    <div className="divide-y divide-gray-50">
      {reviews.map((r) => (
        <div key={r.id} className="px-5 py-1">
          <ReviewCard
            displayName={r.user.displayName}
            trustLevel={r.user.trustLevel}
            ownershipMonths={r.ownershipMonthsAtReview}
            scoreFiyat={r.scoreFiyat}
            scoreKalite={r.scoreKalite}
            scorePerformans={r.scorePerformans}
            summaryText={r.summaryText}
            detailText={r.detailText}
            wouldBuyAgain={r.wouldBuyAgain}
            createdAt={r.createdAt}
          />
        </div>
      ))}
    </div>
  );

  const left = specs.filter((_, i) => i % 2 === 0);
  const right = specs.filter((_, i) => i % 2 === 1);

  const specsContent = specs.length === 0 ? (
    <p className="p-6 text-sm text-gray-400 text-center">Teknik özellik bulunamadı.</p>
  ) : (
    <div className="grid grid-cols-2 divide-x divide-gray-50">
      <div className="px-5 py-2">
        {left.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-baseline py-2.5 border-b border-gray-50 text-sm last:border-b-0">
            <span className="text-gray-400">{label}</span>
            <span className="font-semibold text-gray-800 text-right ml-4">{value}</span>
          </div>
        ))}
      </div>
      <div className="px-5 py-2">
        {right.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-baseline py-2.5 border-b border-gray-50 text-sm last:border-b-0">
            <span className="text-gray-400">{label}</span>
            <span className="font-semibold text-gray-800 text-right ml-4">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Hero ── */}
      <div
        className="w-full relative"
        style={{ background: fuelType === "EV" ? "#0d1117" : "#111" }}
      >
        {imageUrl && (
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${product.brand.name} ${product.model.name}`}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
          </div>
        )}

        <div className="relative max-w-5xl mx-auto px-4 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 mb-6 transition-colors"
          >
            ← Tüm araçlar
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 overflow-hidden"
              style={{ background: categorySlug === "e-scooter" ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {imageUrl
                ? <img
                    src={imageUrl}
                    alt=""
                    className={`w-full h-full ${categorySlug === "e-scooter" || categorySlug === "motosiklet" ? "object-contain p-1.5" : "object-cover"}`}
                  />
                : (bodyType ? BODY_ICONS[bodyType] : null) ?? CATEGORY_FALLBACK_ICONS[categorySlug] ?? "🚗"
              }
            </div>

            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-400 mb-1 tracking-wide uppercase">
                {product.brand.name}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {product.model.name}
                {product.year && <span className="text-gray-400 font-light ml-2">{product.year}</span>}
              </h1>
              <div className="flex flex-wrap gap-2 mt-3">
                {fuelType && (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: fuelColor.bg, color: fuelColor.text }}
                  >
                    {FUEL_ICONS[fuelType] && `${FUEL_ICONS[fuelType]} `}{FUEL_LABELS[fuelType] ?? fuelType}
                  </span>
                )}
                {bodyType && BODY_LABELS[bodyType] && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    {BODY_LABELS[bodyType]}
                  </span>
                )}
                {motoType && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    {MOTO_TYPE_LABELS[motoType] ?? motoType}
                  </span>
                )}
                {karavanType && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    {KARAVAN_TYPE_LABELS[karavanType] ?? karavanType}
                  </span>
                )}
                {attrs.segment != null && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    {String(attrs.segment)} Segment
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fotoğraf slider ── */}
      <PhotoSlider
        photos={sliderPhotos}
        alt={`${product.brand.name} ${product.model.name}`}
      />

      {/* ── Spec strip ── */}
      {heroSpecs.length > 0 && (
        <div className="w-full bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto">
            <div
              className="divide-x divide-gray-100"
              style={{ display: "grid", gridTemplateColumns: `repeat(${heroSpecs.length}, 1fr)` }}
            >
              {heroSpecs.map(({ label, value }) => (
                <div key={label} className="text-center py-4 px-3">
                  <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-1.5">{label}</div>
                  <div className="text-sm font-semibold text-gray-900">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Yorum gönderildi banner ── */}
      {yorum === "gonderildi" && (
        <div className="bg-green-50 border-b border-green-100">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-green-600 text-lg">✓</span>
            <p className="text-sm font-semibold text-green-800">
              Yorumunuz alındı — inceleme sonrası yayınlanacak.
            </p>
          </div>
        </div>
      )}

      {/* ── Ana içerik ── */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">

        {/* Puan varken: score kartı + butonlar */}
        {scores ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <FikapeScore scores={scores} variant="bars" reviewCount={reviewCount} />
            <div className="flex gap-2 mt-4">
              <Link
                href={`/yorum-yaz?arac=${slug}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: "#111" }}
              >
                Yorum Yaz →
              </Link>
              {userId ? (
                <GarageButton productId={product.id} initialInGarage={inGarage} />
              ) : (
                <Link
                  href="/giris"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-500 hover:border-gray-300 transition-colors"
                >
                  🚗 Bu araç benim
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Puan yokken: sadece "Bu araç benim" */
          <div className="flex justify-end">
            {userId ? (
              <GarageButton productId={product.id} initialInGarage={inGarage} />
            ) : (
              <Link
                href="/giris"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors bg-white"
              >
                🚗 Bu araç benim
              </Link>
            )}
          </div>
        )}

        {/* Tab: Yorumlar / Teknik Özellikler */}
        <TabView
          reviewCount={reviewCount}
          reviewsContent={reviewsContent}
          specsContent={specsContent}
        />

      </div>
    </>
  );
}
