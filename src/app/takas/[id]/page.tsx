import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { isTradeMessagingEnabled } from "@/lib/features";
import { timeAgoTr } from "@/lib/timeAgo";
import { TradeMessageForm } from "./TradeMessageForm";
import { ShareButton } from "./ShareButton";
import { ListingReportButton } from "./ListingReportButton";

const PAYMENT_LABEL: Record<string, string> = {
  SWAP_ONLY: "Sadece takas (yakın değer)",
  PAYS_EXTRA: "Üstüne para verir",
  WANTS_EXTRA: "Üstüne para bekliyor",
};

async function getListing(id: number) {
  return prisma.tradeListing.findUnique({
    where: { id },
    include: {
      product: { include: { brand: true, model: true } },
      wantCategory: true,
      wantBrand: true,
      user: { select: { id: true, trustLevel: true } },
    },
  });
}

// İlan açmak için zaten onaylı fotoğraflı bir yorum şart koşuluyor, yani veri
// mevcut — burada tek sorguyla kapak fotoğrafı olarak join ediliyor.
async function getCoverPhoto(userProductId: number) {
  const photo = await prisma.productPhoto.findFirst({
    where: { status: "APPROVED", review: { status: "PUBLISHED", userProductId } },
    orderBy: { order: "asc" },
    select: { url: true },
  });
  return photo?.url ?? null;
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

  const coverPhotoUrl = await getCoverPhoto(listing.userProductId);

  // Takas sonrası değerlendirme ortalaması — güven takas geçmişinden birikmiyordu
  // (bkz. denetim raporu), artık ilan sahibinin geçmiş takaslardan aldığı puanlar
  // burada gösteriliyor.
  const ratingAgg = await prisma.tradeRating.aggregate({
    where: { ratedUserId: listing.userId },
    _avg: { score: true },
    _count: true,
  });

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-10">
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        {coverPhotoUrl && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-50 mb-4">
            <Image src={coverPhotoUrl} alt="" fill sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{listing.product.brand.name}</div>
          <span className="text-[11px] text-gray-300 shrink-0">{timeAgoTr(listing.createdAt)}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          {stripModelGenRange(listing.product.model.name)}
          {listing.product.year && <span className="text-gray-400 font-normal ml-1.5">{listing.product.year}</span>}
        </h1>
        <div className="flex items-center gap-3 mt-0.5">
          <Link href={`/araclar/${listing.product.slug}`} className="text-[11px] text-indigo-600 hover:underline">
            Araç sayfasını gör →
          </Link>
          <ShareButton
            title={`${listing.product.brand.name} ${stripModelGenRange(listing.product.model.name)} Takasa Açık`}
          />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">📍 {listing.city}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {PAYMENT_LABEL[listing.paymentIntent] ?? listing.paymentIntent}
          </span>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          {listing.wantAnything ? (
            <p>İstenen: marka/kategori fark etmez</p>
          ) : (
            <p>
              İstenen: {listing.wantCategory?.name ?? "Belirtilmemiş"}
              {listing.wantBrand ? ` — ${listing.wantBrand.name}` : ""}
            </p>
          )}
          {listing.note && <p className="mt-1 text-gray-500">&quot;{listing.note}&quot;</p>}
        </div>

        {listing.user.trustLevel >= 3 && (
          <p className="mt-3 text-[11px] text-gray-400" title="Bu, aracın fiziksel durumunun doğrulandığı anlamına gelmez.">
            ✓ Doğrulanmış kullanıcı rozeti — bu, aracın fiziksel durumunun doğrulandığı anlamına gelmez.
          </p>
        )}

        {ratingAgg._count > 0 && (
          <p className="mt-1.5 text-[11px] text-amber-600">
            ★ {ratingAgg._avg.score?.toFixed(1)} — geçmiş takaslardan {ratingAgg._count} değerlendirme
          </p>
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

        {userId && !isOwner && <ListingReportButton listingId={listing.id} />}
      </div>
    </div>
  );
}
