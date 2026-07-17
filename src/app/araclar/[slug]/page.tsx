import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ReviewCard } from "@/components/ReviewCard";
import { PhotoSlider } from "./PhotoSlider";
import { TabView } from "./TabView";
import { OwnershipCard } from "./OwnershipCard";
import { calcOverall } from "@/lib/fikape";
import { getVehicleImageUrl } from "@/lib/vehicleImages";
import { FIKAPE } from "@/lib/fikape";
import type { FikapeScores } from "@/lib/fikape";
import { FUEL_LABELS, FUEL_ICONS, FUEL_COLORS } from "@/lib/fuel";
import { SOLD_REASON_LABEL } from "@/lib/soldReasons";
import { ScoreTrendChart } from "./ScoreTrendChart";
import { QnaSection } from "./QnaSection";
import { JsonLd } from "@/components/JsonLd";
import { BASE_URL } from "@/lib/baseUrl";
import { getFoundingReviewIds } from "@/lib/foundingReviewer";
import {
  MOTO_TYPES, OTOMOBIL_BODY_TYPES, KAMYONET_BODY_TYPES, KARAVAN_TYPES,
  BIKE_TYPES, EBIKE_MOTOR_TYPES, PEDELEC_CLASSES, toLabelMap,
} from "@/lib/vehicleTypes";
import { stripModelGenRange } from "@/lib/modelDisplay";

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
  const name = `${product.brand.name} ${stripModelGenRange(product.model.name)}${product.year ? ` ${product.year}` : ""}`;
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
  ...toLabelMap(OTOMOBIL_BODY_TYPES),
  ...toLabelMap(KAMYONET_BODY_TYPES),
};

const BODY_ICONS: Record<string, string> = {
  suv: "🚙", sedan: "🚗", hatchback: "🚗", station: "🚗", mpv: "🚐", coupe: "🏎", cabrio: "🏎",
  pickup: "🛻", van: "🚐", panelvan: "🚐", minivan: "🚐",
};

const MOTO_TYPE_LABELS = toLabelMap(MOTO_TYPES);

const KARAVAN_TYPE_LABELS = toLabelMap(KARAVAN_TYPES);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CATEGORY_FALLBACK_ICONS: Record<string, string> = {
  otomobil: "🚗", motosiklet: "🏍️", "e-scooter": "🛴", "e-bisiklet": "🚴", karavan: "🏕️", kamyonet: "🛻",
};

const BIKE_TYPE_LABELS = toLabelMap(BIKE_TYPES);

const MOTOR_TYPE_LABELS = toLabelMap(EBIKE_MOTOR_TYPES);

const PEDELEC_LABELS = toLabelMap(PEDELEC_CLASSES);

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ yorum?: string; sekme?: string }>;
}) {
  const { slug } = await params;
  const { yorum, sekme } = await searchParams;

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
          select: { url: true, uploadedBy: { select: { displayName: true } } },
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
  // Reddedilen öneri ürünleri URL'i bilenlere de gösterilmez (PENDING açık
  // kalıyor: öneren kullanıcı ve admin önizlemesi görebilsin)
  if (product.status === "REJECTED") notFound();

  const attrs = product.attributes as Record<string, unknown>;
  const categorySlug = product.category?.slug ?? "";
  const imageUrl = product.imageUrl ?? await getVehicleImageUrl(slug);

  const sliderPhotos = [
    ...(imageUrl ? [{ url: imageUrl, label: "Katalog" }] : []),
    ...product.photos.map((p) => ({
      url: p.url,
      label: p.uploadedBy?.displayName ?? "Kullanıcı fotoğrafı",
    })),
  ];

  const fuelType = String(attrs.fuel_type ?? "");
  const bodyType = attrs.body_type ? String(attrs.body_type) : null;
  const motoType = attrs.moto_type ? String(attrs.moto_type) : null;
  const karavanType = attrs.karavan_type ? String(attrs.karavan_type) : null;
  const bikeType = attrs.bike_type ? String(attrs.bike_type) : null;
  const motorType = attrs.motor_type ? String(attrs.motor_type) : null;
  const pedelecClass = attrs.pedelec_class ? String(attrs.pedelec_class) : null;
  const fuelColor = FUEL_COLORS[fuelType] ?? FUEL_COLORS.GASOLINE;

  const userId = session?.user?.id ? Number(session.user.id) : null;
  const [userGarageEntry, garageCount, currentUser, existingSaleLeads] = await Promise.all([
    userId
      ? prisma.userProduct.findUnique({
          where: { userId_productId: { userId, productId: product.id } },
          select: { ownershipStatus: true, soldReason: true },
        })
      : null,
    prisma.userProduct.count({ where: { productId: product.id, ownershipStatus: "CURRENT" } }),
    userId
      ? prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } })
      : null,
    userId
      ? prisma.saleLead.findMany({
          where: { userId, productId: product.id },
          select: { type: true },
        }).catch(() => [])
      : [],
  ]);
  const inGarage = userGarageEntry?.ownershipStatus === "CURRENT";
  const isSold   = userGarageEntry?.ownershipStatus === "PAST";
  const submittedSaleLeadTypes = existingSaleLeads.map((l) => l.type);

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

  const soldReasonData = await prisma.userProduct.groupBy({
    by: ["soldReason"],
    where: { productId: product.id, ownershipStatus: "PAST", soldReason: { not: null } },
    _count: { soldReason: true },
    orderBy: { _count: { soldReason: "desc" } },
  });
  const soldTotal = soldReasonData.reduce((s, d) => s + d._count.soldReason, 0);

  // ── Skor trendi ──
  // Her yorum, düzenleme sayısına bakılmaksızın ortalamaya HER ZAMAN en fazla
  // 1 kez katkıda bulunur — bir kullanıcının kendi yorumunu birden çok kez
  // düzenlemesi, sanki birden çok bağımsız yorumcu varmış gibi trendi şişirmez.
  // ScoreSnapshot geçmişi kullanılarak, her ay için "o ana kadar her yorumun
  // bilinen en güncel skoru" ortalaması alınır (zaman içinde ilerleyen anlık görüntü).
  const publishedReviewIds = (
    await prisma.review.findMany({
      where: { productId: product.id, status: "PUBLISHED" },
      select: { id: true },
    })
  ).map((r) => r.id);

  const scoreEvents = publishedReviewIds.length
    ? await prisma.scoreSnapshot.findMany({
        where: {
          reviewId: { in: publishedReviewIds },
          OR: [{ reason: "PUBLISHED" }, { reason: "EDITED", status: "PUBLISHED" }],
        },
        select: { reviewId: true, scoreOverall: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  type MonthlyScore = { month: string; avg: number; count: number };
  const monthOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const currentScoreByReview = new Map<number, number>();
  const trendPoints: MonthlyScore[] = [];
  let i = 0;
  while (i < scoreEvents.length) {
    const month = monthOf(scoreEvents[i].createdAt);
    while (i < scoreEvents.length && monthOf(scoreEvents[i].createdAt) === month) {
      currentScoreByReview.set(scoreEvents[i].reviewId, scoreEvents[i].scoreOverall);
      i++;
    }
    const scores = [...currentScoreByReview.values()];
    trendPoints.push({
      month,
      avg: Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10,
      count: scores.length,
    });
  }

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
    select: {
      id: true,
      userId: true,
      scoreFiyat: true,
      scoreKalite: true,
      scorePerformans: true,
      summaryText: true,
      detailText: true,
      wouldBuyAgain: true,
      ownershipMonthsAtReview: true,
      createdAt: true,
      editedAt: true,
      editCount: true,
      extendedData: true,
      user: { select: { id: true, displayName: true, trustLevel: true, avatarUrl: true } },
      userProduct: { select: { ownershipStatus: true, soldReason: true } },
      versions: {
        select: { version: true, scoreOverall: true, createdAt: true },
        orderBy: { version: "asc" },
      },
      helpfulVotes: {
        select: { userId: true, isHelpful: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  // Kürasyonlu "kurucu yorumcu" — bu ürün için ilk 3 yayınlanmış yorum
  const foundingReviewIds = await getFoundingReviewIds([product.id]);

  // Soru-Cevap — migration henüz uygulanmamışsa (questions/answers tabloları)
  // sayfanın tamamen çökmesini önlemek için best-effort
  const questionsRaw = await prisma.question.findMany({
    where: { productId: product.id },
    select: {
      id: true,
      userId: true,
      text: true,
      createdAt: true,
      user: { select: { displayName: true } },
      answers: {
        select: {
          id: true,
          text: true,
          createdAt: true,
          user: { select: { displayName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);
  const questions = questionsRaw.map((q) => ({
    id: q.id,
    userId: q.userId,
    text: q.text,
    displayName: q.user.displayName,
    createdAt: q.createdAt.toISOString(),
    answers: q.answers.map((a) => ({
      id: a.id,
      text: a.text,
      displayName: a.user.displayName,
      createdAt: a.createdAt.toISOString(),
    })),
  }));

  // ── Spec strip — kategori bazlı 5 öne çıkan özellik ──
  type SpecItem = { label: string; value: string };

  const heroSpecsRaw: (SpecItem | null)[] = (() => {
    if (categorySlug === "e-bisiklet") return [
      attrs.motor_type    ? { label: "Motor Tipi",  value: MOTOR_TYPE_LABELS[String(attrs.motor_type)] ?? String(attrs.motor_type) } : null,
      attrs.motor_watt    ? { label: "Motor Gücü",  value: `${attrs.motor_watt} W` }   : null,
      attrs.battery_wh    ? { label: "Batarya",     value: `${attrs.battery_wh} Wh` }  : null,
      attrs.range_km      ? { label: "Menzil",      value: `${attrs.range_km} km` }    : null,
      attrs.weight_kg     ? { label: "Ağırlık",     value: `${attrs.weight_kg} kg` }   : null,
    ];
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
      karavanType            ? { label: "Tip",             value: KARAVAN_TYPE_LABELS[karavanType] ?? karavanType } : null,
      attrs.berth            ? { label: "Yatak Kapasitesi", value: `${attrs.berth} kişi` }       : null,
      attrs.length_cm        ? { label: "Uzunluk",         value: `${attrs.length_cm} cm` }      : null,
      attrs.height_cm        ? { label: "İç Yükseklik",    value: `${attrs.height_cm} cm` }      : null,
      attrs.total_weight_kg  ? { label: "Toplam Ağırlık",  value: `${attrs.total_weight_kg} kg` } : null,
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
      attrs.transmission ? { label: "Vites",     value: capitalize(String(attrs.transmission)) }           : null,
      attrs.ev_range_km  ? { label: "Menzil",    value: `${attrs.ev_range_km} km` }           : (attrs.tank_l ? { label: "Yakıt Deposu", value: `${attrs.tank_l} L` } : null),
    ];
  })();
  const heroSpecs = heroSpecsRaw.filter(Boolean) as SpecItem[];

  // ── Tab: Teknik Özellikler (tam liste) ──
  const specsRaw: (SpecItem | null)[] = (() => {
    if (categorySlug === "e-bisiklet") return [
      bikeType              ? { label: "Bisiklet Tipi",  value: BIKE_TYPE_LABELS[bikeType] ?? bikeType }            : null,
      motorType             ? { label: "Motor Tipi",     value: MOTOR_TYPE_LABELS[motorType] ?? motorType }          : null,
      pedelecClass          ? { label: "Pedelec Sınıfı", value: PEDELEC_LABELS[pedelecClass] ?? pedelecClass }       : null,
      attrs.motor_watt      ? { label: "Motor Gücü",     value: `${attrs.motor_watt} W` }                           : null,
      attrs.battery_wh      ? { label: "Batarya",        value: `${attrs.battery_wh} Wh` }                          : null,
      attrs.range_km        ? { label: "Menzil",         value: `${attrs.range_km} km` }                            : null,
      attrs.max_speed_kmh   ? { label: "Maks. Hız",      value: `${attrs.max_speed_kmh} km/s` }                     : null,
      attrs.weight_kg       ? { label: "Ağırlık",        value: `${attrs.weight_kg} kg` }                           : null,
    ];
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
      karavanType                ? { label: "Tip",           value: KARAVAN_TYPE_LABELS[karavanType] ?? karavanType } : null,
      attrs.berth                ? { label: "Yatak Kap.",    value: `${attrs.berth} kişi` }           : null,
      attrs.length_cm            ? { label: "Uzunluk",       value: `${attrs.length_cm} cm` }         : null,
      attrs.width_cm             ? { label: "Genişlik",      value: `${attrs.width_cm} cm` }          : null,
      attrs.height_cm            ? { label: "İç Yükseklik",  value: `${attrs.height_cm} cm` }         : null,
      attrs.total_weight_kg      ? { label: "Toplam Ağ.",    value: `${attrs.total_weight_kg} kg` }   : null,
      attrs.tow_weight_kg        ? { label: "Çekme Ağ.",     value: `${attrs.tow_weight_kg} kg` }     : null,
      attrs.water_tank_l         ? { label: "Taze Su Tankı", value: `${attrs.water_tank_l} L` }       : null,
      attrs.heating_type         ? { label: "Isıtma",        value: capitalize(String(attrs.heating_type)) } : null,
      attrs.has_bathroom != null ? { label: "Banyo",         value: attrs.has_bathroom ? "Var" : "Yok" } : null,
      attrs.has_shower   != null ? { label: "Duş",           value: attrs.has_shower   ? "Var" : "Yok" } : null,
      attrs.has_kitchen  != null ? { label: "Mutfak",        value: attrs.has_kitchen  ? "Var" : "Yok" } : null,
      attrs.has_ac       != null ? { label: "Klima",         value: attrs.has_ac       ? "Var" : "Yok" } : null,
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
      attrs.drivetrain     ? { label: "Çekiş",         value: capitalize(String(attrs.drivetrain)) }        : null,
      attrs.transmission   ? { label: "Vites",         value: capitalize(String(attrs.transmission)) }      : null,
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
      {/* Skor trendi — min 2 aylık veri */}
      {trendPoints.length >= 2 && (
        <ScoreTrendChart points={trendPoints} totalReviews={reviewCount} />
      )}

      {/* Satış nedenleri özeti — min 5 veri */}
      {soldTotal >= 5 && (
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Neden sattılar? <span className="font-normal normal-case">({soldTotal} kişi)</span>
          </p>
          <div className="space-y-2">
            {soldReasonData.map((d) => {
              const pct = Math.round((d._count.soldReason / soldTotal) * 100);
              const label = SOLD_REASON_LABEL[d.soldReason ?? ""] ?? d.soldReason;
              return (
                <div key={d.soldReason} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">{label}</span>
                    <span className="text-gray-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gray-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviews.map((r) => (
        <div key={r.id} className="px-5 py-1">
          <ReviewCard
            displayName={r.user.displayName}
            avatarUrl={r.user.avatarUrl}
            avatarSeed={String(r.user.id)}
            trustLevel={r.user.trustLevel}
            ownershipMonths={r.ownershipMonthsAtReview}
            scoreFiyat={r.scoreFiyat}
            scoreKalite={r.scoreKalite}
            scorePerformans={r.scorePerformans}
            summaryText={r.summaryText}
            detailText={r.detailText}
            wouldBuyAgain={r.wouldBuyAgain}
            createdAt={r.createdAt}
            editedAt={r.editedAt}
            editCount={r.editCount}
            versions={r.versions}
            ownershipStatus={r.userProduct?.ownershipStatus ?? null}
            soldReason={r.userProduct?.soldReason ?? null}
            extendedData={r.extendedData as Record<string, unknown> | null}
            isFounding={foundingReviewIds.has(r.id)}
            reviewId={r.id}
            helpfulCount={r.helpfulVotes.filter((v) => v.isHelpful).length}
            currentUserVote={userId ? (r.helpfulVotes.find((v) => v.userId === userId)?.isHelpful ?? null) : null}
            isLoggedIn={!!userId}
            isOwnReview={userId === r.userId}
          />
        </div>
      ))}
    </div>
  );

  // ── JSON-LD: Product + AggregateRating + Review (sadece yorumu varsa) ──
  const productName = `${product.brand.name} ${stripModelGenRange(product.model.name)}${product.year ? ` ${product.year}` : ""}`;
  const productSchema = reviewCount > 0 ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    brand: { "@type": "Brand", name: product.brand.name },
    url: `${BASE_URL}/araclar/${slug}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Math.round((agg._avg.scoreOverall ?? 0) * 10) / 10,
      reviewCount,
      bestRating: 10,
      worstRating: 1,
    },
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.user.displayName },
      reviewRating: {
        "@type": "Rating",
        ratingValue: Math.round(calcOverall(r) * 10) / 10,
        bestRating: 10,
        worstRating: 1,
      },
      reviewBody: r.detailText || r.summaryText,
    })),
  } : null;

  const qnaContent = (
    <QnaSection
      productSlug={slug}
      questions={questions}
      isLoggedIn={!!userId}
      currentUserId={userId}
      canAnswer={!!userGarageEntry}
      categorySlug={categorySlug}
    />
  );

  const left = specs.filter((_, i) => i % 2 === 0);
  const right = specs.filter((_, i) => i % 2 === 1);

  const specsContent = specs.length === 0 ? (
    <p className="p-6 text-sm text-gray-400 text-center">Teknik özellik bulunamadı.</p>
  ) : (
    <div className="grid grid-cols-2 divide-x divide-gray-100">
      <div className="px-6 py-5">
        {left.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-baseline py-3.5 border-b border-gray-50 text-sm last:border-b-0">
            <span className="text-gray-400">{label}</span>
            <span className="font-semibold text-gray-800 text-right ml-4">{value}</span>
          </div>
        ))}
      </div>
      <div className="px-6 py-5">
        {right.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-baseline py-3.5 border-b border-gray-50 text-sm last:border-b-0">
            <span className="text-gray-400">{label}</span>
            <span className="font-semibold text-gray-800 text-right ml-4">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {productSchema && <JsonLd data={productSchema} />}

      {/* ── Hero ── */}
      <div
        className="w-full relative"
        style={{ background: fuelType === "EV" ? "#0d1117" : "#111" }}
      >
        {imageUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={imageUrl}
              alt={`${product.brand.name} ${stripModelGenRange(product.model.name)}`}
              fill
              sizes="100vw"
              className="object-cover opacity-20"
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
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 overflow-hidden"
              style={{ background: categorySlug === "e-scooter" || categorySlug === "e-bisiklet" ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)" }}
            >
              {imageUrl
                ? <Image
                    src={imageUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className={categorySlug === "e-scooter" || categorySlug === "motosiklet" || categorySlug === "e-bisiklet" ? "object-contain p-1.5" : "object-cover"}
                  />
                : (bodyType ? BODY_ICONS[bodyType] : null) ?? CATEGORY_FALLBACK_ICONS[categorySlug] ?? "🚗"
              }
            </div>

            <div className="flex-1">
              <Link
                href={`/markalar/${product.brand.slug}`}
                className="text-sm font-semibold text-gray-400 mb-1 tracking-wide uppercase hover:text-gray-200 hover:underline transition-colors inline-block"
              >
                {product.brand.name}
              </Link>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {stripModelGenRange(product.model.name)}
                {product.year && <span className="text-gray-400 font-light ml-2">{product.year}</span>}
              </h1>
              {product.trimName && (
                <p className="text-sm text-gray-400 mt-1">{product.trimName}</p>
              )}
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
                {bikeType && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    {BIKE_TYPE_LABELS[bikeType] ?? bikeType}
                  </span>
                )}
                {pedelecClass && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    {PEDELEC_LABELS[pedelecClass] ?? pedelecClass}
                  </span>
                )}
                {attrs.segment != null && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    {String(attrs.segment)} Segment
                  </span>
                )}
                {garageCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {garageCount} kişinin garajında
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
        alt={`${product.brand.name} ${stripModelGenRange(product.model.name)}`}
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
      <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-4">

        {/* Sahiplik kartı */}
        <OwnershipCard
          productId={product.id}
          initialInGarage={inGarage}
          initialIsSold={isSold}
          initialSoldReason={userGarageEntry?.soldReason ?? null}
          garageCount={garageCount}
          isLoggedIn={!!userId}
          defaultFullName={currentUser?.displayName ?? ""}
          submittedSaleLeadTypes={submittedSaleLeadTypes}
        />

        {/* Puan varken: tek yorumda ince özet şeridi, çok yorumda kompakt skor kartı
            (5 personalı değerlendirme, oy çokluğu kararları — barlı kart kaldırıldı) */}
        {scores && reviewCount === 1 && (
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className="text-2xl font-black shrink-0">
                {(scores.scoreOverall ?? 0).toFixed(1)}<span className="text-sm font-normal text-gray-400">/10</span>
              </span>
              <span className="text-sm text-gray-500 truncate">1 yorum — ikinci yorum seninki olsun</span>
            </div>
            <Link href={`/yorum-yaz?arac=${slug}`} className="text-sm font-semibold text-gray-900 whitespace-nowrap hover:underline">
              Yorum yaz →
            </Link>
          </div>
        )}
        {scores && reviewCount !== 1 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-black">
                  {(scores.scoreOverall ?? 0).toFixed(1)}<span className="text-sm font-normal text-gray-400">/10</span>
                </span>
                <span className="text-sm text-gray-500">{reviewCount} yorum</span>
              </div>
              <Link href={`/yorum-yaz?arac=${slug}`} className="text-sm font-semibold text-gray-900 whitespace-nowrap hover:underline">
                Yorum yaz →
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
              {FIKAPE.map(({ key, label, color }) => (
                <span key={key} className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                  {label} <span className="font-bold text-gray-900">{(scores[key as keyof FikapeScores] as number).toFixed(1)}</span>
                </span>
              ))}
            </div>
            {/* LLM/arama motorlarının doğrudan alıntılayabileceği tek cümlelik özet — dipnot stili */}
            <p className="border-t border-gray-100 mt-4 pt-3 text-[11px] text-gray-400">
              {productName}, {reviewCount} kullanıcı yorumuna göre 10 üzerinden {(scores.scoreOverall ?? 0).toFixed(1)} puan aldı
              {" "}— Fiyat {scores.scoreFiyat.toFixed(1)}, Kalite {scores.scoreKalite.toFixed(1)}, Performans {scores.scorePerformans.toFixed(1)}.
            </p>
          </div>
        )}

        {/* Tab: Yorumlar / Teknik Özellikler / Soru-Cevap */}
        <TabView
          reviewCount={reviewCount}
          reviewsContent={reviewsContent}
          specsContent={specsContent}
          questionCount={questions.length}
          qnaContent={qnaContent}
          initialTab={sekme === "soru-cevap" ? "soru-cevap" : undefined}
        />

      </div>
    </>
  );
}
