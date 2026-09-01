import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { isTradeMessagingEnabled } from "@/lib/features";
import { timeAgoTr } from "@/lib/timeAgo";
import { Avatar } from "@/components/Avatar";
import { PhotoSlider } from "@/app/araclar/[slug]/PhotoSlider";
import { buildSpecList } from "@/lib/buildSpecList";
import { CarDamageDiagram } from "@/components/CarDamageDiagram";
import { PART_CONDITION_CATEGORIES, PART_CONDITION_LABEL, PART_CONDITION_COLOR, CAR_PARTS, type PartCondition } from "@/lib/carParts";
import {
  DAMAGE_STATUS_LABEL, DAMAGE_STATUS_COLOR,
  MECHANICAL_CONDITION_LABEL, MECHANICAL_CONDITION_COLOR, MECHANICAL_COMPONENTS,
  formatTl, formatMonthYear, type DamageStatus, type MechanicalCondition,
} from "@/lib/damageStatus";
import { LOCATION_SCOPE_LABEL } from "@/lib/tradeExpectations";
import { TradeMessageForm } from "./TradeMessageForm";
import { ShareButton } from "./ShareButton";
import { ListingReportButton } from "./ListingReportButton";
import { ListingTabs } from "./ListingTabs";

const PAYMENT_LABEL: Record<string, string> = {
  SWAP_ONLY: "Sadece takas (yakın değer)",
  PAYS_EXTRA: "Üstüne para verir",
  WANTS_EXTRA: "Üstüne para bekliyor",
};

async function getListing(id: number) {
  return prisma.tradeListing.findUnique({
    where: { id },
    include: {
      product: { include: { brand: true, model: true, category: { select: { slug: true } } } },
      wantCategory: true,
      wantBrand: true,
      user: { select: { id: true, trustLevel: true, displayName: true, avatarUrl: true } },
      userProduct: { select: { usageAmount: true, usageUnit: true } },
      partConditions: { select: { partKey: true, condition: true } },
      tramerRecords: { select: { month: true, year: true, amount: true }, orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
  });
}

// İlan açmak için zaten onaylı fotoğraflı bir yorum şart koşuluyor, yani veri
// mevcut — önceden sadece TEK bir kapak fotoğrafı çekiliyordu, kullanıcının
// yüklediği tüm fotoğraflar araç kartındaki gibi slider olarak gösterilmiyordu
// (bkz. kullanıcı geri bildirimi).
async function getGalleryPhotos(userProductId: number) {
  const photos = await prisma.productPhoto.findMany({
    where: { status: "APPROVED", review: { status: "PUBLISHED", userProductId } },
    orderBy: { order: "asc" },
    select: { url: true },
  });
  return photos;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(parseInt(id)).catch(() => null);
  if (!listing) return { title: "İlan bulunamadı – fikape" };
  if (!listing.isActive) return { title: "İlan artık aktif değil – fikape", robots: { index: false } };
  const title = `${listing.product.brand.name} ${stripModelGenRange(listing.product.model.name)} Takasa Açık – ${listing.city}`;
  return { title };
}

export default async function TakasDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listingId = parseInt(id);
  if (isNaN(listingId)) notFound();

  const listing = await getListing(listingId);
  if (!listing) notFound();

  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const isOwner = userId === listing.userId;

  let existingThreadId: number | null = null;
  if (userId && !isOwner) {
    const thread = await prisma.messageThread.findUnique({
      where: { tradeListingId_initiatorId: { tradeListingId: listingId, initiatorId: userId } },
      select: { id: true },
    });
    existingThreadId = thread?.id ?? null;
  }

  const galleryPhotos = await getGalleryPhotos(listing.userProductId);

  // Takas sonrası değerlendirme ortalaması — güven takas geçmişinden birikmiyordu
  // (bkz. denetim raporu), artık ilan sahibinin geçmiş takaslardan aldığı puanlar
  // burada gösteriliyor.
  const ratingAgg = await prisma.tradeRating.aggregate({
    where: { ratedUserId: listing.userId },
    _avg: { score: true },
    _count: true,
  });

  const vehicleAlt = `${listing.product.brand.name} ${stripModelGenRange(listing.product.model.name)}`;

  // "Açıklama" (aracın kendisi hakkında serbest metin) ve "Teknik Özellikler"
  // sekmeleri — Teknik Özellikler verisi zaten Product.attributes'ta hazır,
  // ek veri toplamaya gerek yok (bkz. buildSpecList, araç sayfasıyla paylaşılıyor).
  const specs = buildSpecList(listing.product.category?.slug ?? "", listing.product.attributes);

  // "Boyalı veya Değişen Parça" — sadece gövde paneli olan kategorilerde
  // (otomobil/kamyonet) anlamlı, diğer kategorilerde sekme hiç gösterilmiyor.
  const showPartConditions = PART_CONDITION_CATEGORIES.includes(
    (listing.product.category?.slug ?? "") as (typeof PART_CONDITION_CATEGORIES)[number]
  );
  const partConditionsMap: Record<string, PartCondition> = Object.fromEntries(
    listing.partConditions.map((p) => [p.partKey, p.condition as PartCondition])
  );
  const hasPartConditionData = listing.partConditions.length > 0;

  const listingTabs = [
    {
      key: "aciklama",
      label: "Açıklama",
      icon: "📝",
      content: listing.description ? (
        <div className="space-y-3">
          {listing.description
            .split(/\n{2,}|\n/)
            .map((s) => s.trim())
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i} className="text-[13.5px] leading-relaxed text-gray-700">
                {paragraph}
              </p>
            ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">İlan sahibi henüz bir açıklama eklememiş.</p>
      ),
    },
    {
      key: "teknik",
      label: "Özellikler",
      icon: "⚙️",
      content: specs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Bu araç için teknik özellik bulunamadı.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {specs.map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">
                {label}
              </div>
              <div className="text-sm font-semibold text-gray-800 mt-0.5">{value}</div>
            </div>
          ))}
        </div>
      ),
    },
    ...(showPartConditions
      ? [
          {
            key: "hasar",
            label: "Hasar",
            icon: "🚨",
            // Boyalı/Değişen Parça ile aynı prensip: kullanıcı beyanı, fikape
            // tarafından doğrulanmamış (bkz. kullanıcı talebi — yeni sekme,
            // genel hasar durumu + motor/şanzıman/yürüyen aksam + tramer kayıtları).
            content: (() => {
              const mechanicalEntries: { key: string; label: string; condition: string | null; note: string | null }[] =
                MECHANICAL_COMPONENTS.map((c) => ({
                  key: c.key,
                  label: c.label,
                  condition:
                    c.key === "engine" ? listing.engineCondition
                    : c.key === "transmission" ? listing.transmissionCondition
                    : listing.runningGearCondition,
                  note:
                    c.key === "engine" ? listing.engineNote
                    : c.key === "transmission" ? listing.transmissionNote
                    : listing.runningGearNote,
                }));
              const hasMechanicalData = mechanicalEntries.some((m) => m.condition);
              const hasTramerData = listing.tramerRecords.length > 0;
              const tramerTotal = listing.tramerRecords.reduce((sum, r) => sum + r.amount, 0);
              const hasAnyData = !!listing.damageStatus || hasMechanicalData || hasTramerData;

              return (
                <div className="space-y-4">
                  <p className="text-[11px] text-gray-400 bg-gray-50 rounded-lg px-2.5 py-2">
                    Bu bilgiler ilan sahibi tarafından beyan edilmiştir, fikape tarafından doğrulanmamıştır.
                  </p>

                  {!hasAnyData && (
                    <p className="text-sm text-gray-400 text-center py-6">İlan sahibi henüz hasar durumu belirtmemiş.</p>
                  )}

                  {listing.damageStatus && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Genel Hasar Durumu</p>
                      <span
                        className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                        style={{ backgroundColor: DAMAGE_STATUS_COLOR[listing.damageStatus as DamageStatus] }}
                      >
                        {DAMAGE_STATUS_LABEL[listing.damageStatus as DamageStatus]}
                      </span>
                    </div>
                  )}

                  {hasMechanicalData && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                        Motor / Şanzıman / Yürüyen Aksam
                      </p>
                      <div className="space-y-2">
                        {mechanicalEntries.filter((m) => m.condition).map((m) => (
                          <div key={m.key} className="bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-600 font-medium">{m.label}</span>
                              <span
                                className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: MECHANICAL_CONDITION_COLOR[m.condition as MechanicalCondition] }}
                              >
                                {MECHANICAL_CONDITION_LABEL[m.condition as MechanicalCondition]}
                              </span>
                            </div>
                            {m.note && <p className="text-xs text-gray-500 mt-1">{m.note}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasTramerData && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tramer Kayıtları</p>
                        <span className="text-xs font-semibold text-gray-700">Toplam: {formatTl(tramerTotal)}</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {listing.tramerRecords.map((r, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                            <span className="text-gray-500">{formatMonthYear(r.month, r.year)}</span>
                            <span className="font-semibold text-gray-800">{formatTl(r.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })(),
          },
          {
            key: "boya",
            label: "Boya/Değişen",
            icon: "🎨",
            // Veri olmasa bile şema her zaman gösterilir (tamamı "Belirtilmemiş"
            // renginde) — kullanıcı geri bildirimi: boş durumda hiçbir görsel
            // olmaması metne göre daha kafa karıştırıcıydı. Ayrıca: (1) diyagram
            // artık krem tonlu bir çerçeve içinde (referans görsel), (2) hiç veri
            // yoksa/tamamı orijinalse durumu özetleyen bir kutu var, (3) aşağıdaki
            // liste artık CAR_PARTS'ın tamamını gösteriyor — kaydı olmayan parçalar
            // "Belirtilmemiş" rozetiyle, önceden listede hiç yer almıyorlardı.
            content: (() => {
              const allOriginal =
                hasPartConditionData &&
                listing.partConditions.every(({ condition }) => condition === "ORIGINAL");

              return (
                <div className="space-y-4">
                  <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
                    <CarDamageDiagram conditions={partConditionsMap} />
                  </div>

                  {!hasPartConditionData ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3">
                      <p className="text-xs font-bold text-gray-700">Belirtilmemiş</p>
                      <p className="text-xs text-gray-500 mt-1">
                        İlan sahibi henüz parça durumu belirtmemiş.
                      </p>
                    </div>
                  ) : allOriginal ? (
                    <div className="bg-green-50 border border-green-100 rounded-xl px-3.5 py-3">
                      <p className="text-xs font-bold text-green-800">✓ Orijinal</p>
                      <p className="text-xs text-green-700 mt-1">
                        Aracın tüm parçaları orijinaldir. Değişen ve boyalı parçası bulunmamaktadır.
                      </p>
                    </div>
                  ) : null}

                  {hasPartConditionData && (
                    <div className="grid grid-cols-2 gap-2">
                      {CAR_PARTS.map((part) => {
                        const condition = partConditionsMap[part.key] as PartCondition | undefined;
                        return (
                          <div
                            key={part.key}
                            className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2"
                          >
                            <span className="text-xs text-gray-500 leading-tight">{part.label}</span>
                            <span
                              className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                              style={{
                                backgroundColor: condition ? PART_CONDITION_COLOR[condition] : "#9CA3AF",
                              }}
                            >
                              {condition ? PART_CONDITION_LABEL[condition] : "Belirtilmemiş"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })(),
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-10">
      {galleryPhotos.length > 0 && (
        <div className="mb-4 rounded-2xl overflow-hidden">
          <PhotoSlider photos={galleryPhotos} alt={vehicleAlt} />
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Satıcı kimliği — araç bilgisinden ayrı bir satır, ince bir alt
            çizgiyle bölünüyor (önceden hepsi aynı ince gri tonda üst üste
            diziliydi, kimin, ne sattığı birbirine karışıyordu). */}
        <div className="flex items-center justify-between gap-2 px-6 py-3.5 border-b border-gray-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              displayName={listing.user.displayName}
              avatarUrl={listing.user.avatarUrl}
              seed={String(listing.user.id)}
              size={36}
            />
            {/* "Doğrulanmış kullanıcı" rozeti, isim doğrudan altına taşındı —
                önceden sayfanın alt kısmındaki güven sinyalleri satırındaydı,
                kullanıcı hangi kişiye ait olduğunun isimle birlikte hemen
                görünmesinin daha doğru olacağını belirtti (bkz. ekran görüntüsü). */}
            <div className="min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate block">
                {listing.user.displayName ?? "Kullanıcı"}
              </span>
              {listing.user.trustLevel >= 3 && (
                <span
                  className="text-[11px] text-gray-400"
                  title="Bu, aracın fiziksel durumunun doğrulandığı anlamına gelmez."
                >
                  ✓ Doğrulanmış kullanıcı
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-gray-400 shrink-0">{timeAgoTr(listing.createdAt)}</span>
        </div>

        <div className="p-6">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{listing.product.brand.name}</div>
          <h1 className="text-xl font-bold text-gray-900 mt-0.5">
            {stripModelGenRange(listing.product.model.name)}
            {listing.product.year && <span className="text-gray-400 font-normal ml-1.5">{listing.product.year}</span>}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Link
              href={`/araclar/${listing.product.slug}`}
              className="text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full px-2.5 py-1 transition-colors"
            >
              Araç sayfasını gör →
            </Link>
            <ShareButton
              title={`${listing.product.brand.name} ${stripModelGenRange(listing.product.model.name)} Takasa Açık`}
            />
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">📍 {listing.city}</span>
            {listing.userProduct?.usageUnit === "km" && listing.userProduct.usageAmount != null && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {listing.userProduct.usageAmount.toLocaleString("tr-TR")} km
              </span>
            )}
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {PAYMENT_LABEL[listing.paymentIntent] ?? listing.paymentIntent}
            </span>
          </div>

          {/* Takas beklentileri — nötr gri yerine indigo tonu, sitedeki "takas"
              kavramıyla (TradeToggleCard vb.) aynı renk dili kullanılıyor. */}
          <div className="mt-3 bg-indigo-50/60 border border-indigo-100 rounded-xl px-3.5 py-3 text-sm text-indigo-900">
            <p className="text-xs font-bold text-indigo-800 mb-1">
              İlan Sahibinin Takas Beklentileri
            </p>
            {listing.wantAnything ? (
              <p>Marka/kategori fark etmez</p>
            ) : (
              <div className="space-y-0.5">
                <p>Araç Kategorisi: {listing.wantCategory ? listing.wantCategory.name : "Hepsi (Fark Etmez)"}</p>
                <p>Marka: {listing.wantBrand ? listing.wantBrand.name : "Hepsi (Fark Etmez)"}</p>
              </div>
            )}
            <p>Konum: {LOCATION_SCOPE_LABEL[listing.wantLocationScope as keyof typeof LOCATION_SCOPE_LABEL]}</p>
            <p>
              Kabul Edilen Hasar Durumu:{" "}
              {listing.wantDamageStatuses.length > 0
                ? listing.wantDamageStatuses.map((s) => DAMAGE_STATUS_LABEL[s as DamageStatus]).join(", ")
                : "Hepsi (Fark Etmez)"}
            </p>
            {listing.note && <p className="mt-1.5 text-indigo-700">&quot;{listing.note}&quot;</p>}
          </div>

          {/* Doğrulanmış rozeti üst başlık satırına (isim altına) taşındı —
              burada sadece değerlendirme özeti kaldı. */}
          {ratingAgg._count > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[11px] text-gray-400">
              <span className="text-amber-600">
                ★ {ratingAgg._avg.score?.toFixed(1)} · {ratingAgg._count} değerlendirme
              </span>
            </div>
          )}

          {!listing.isActive ? (
          <div className="mt-5 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500">
            Bu ilan artık aktif değil.
          </div>
        ) : isOwner ? (
          <div className="mt-5 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500">
            Bu sizin ilanınız. Kapatmak için <Link href="/garajim" className="underline">Garajım</Link> sayfasına gidiniz.
          </div>
        ) : existingThreadId ? (
          <div className="mt-5">
            <Link href={`/mesajlar/${existingThreadId}`} className="text-sm font-semibold text-indigo-700 hover:underline">
              Görüşmenize devam edin →
            </Link>
          </div>
        ) : !session ? (
          <div className="mt-5 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500">
            Mesaj göndermek için <Link href="/giris" className="underline">giriş yapınız</Link>.
          </div>
        ) : (session.user.trustLevel as number) < 3 ? (
          <p className="mt-5 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Mesaj göndermek için garajınızda fotoğraflı, onaylanmış bir yorumunuz olması gerekiyor.
          </p>
        ) : !isTradeMessagingEnabled() ? (
          <p className="mt-5 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Mesajlaşma özelliği geçici olarak kapalı.
          </p>
        ) : (
          <>
            {listing.paymentIntent !== "SWAP_ONLY" && (
              <p className="mt-5 text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-2">
                ⚠️ Üstüne para el değiştiren takaslarda dolandırıcılık riski daha yüksektir. Fark tutarını
                asla teslimattan önce göndermeyiniz.
              </p>
            )}
            <p className="mt-2 text-[11px] text-indigo-700 bg-indigo-50 rounded-lg px-2.5 py-2">
              Plaka/şasi bilgisini paylaşmadan önce karşı tarafın kimliğinden emin olunuz. Fark tutarını asla teslimattan önce göndermeyiniz.
            </p>
            <TradeMessageForm listingId={listing.id} />
          </>
        )}
        </div>
      </div>

      <div className="mt-4">
        <ListingTabs tabs={listingTabs} />
      </div>

      {userId && !isOwner && <ListingReportButton listingId={listing.id} />}
    </div>
  );
}
