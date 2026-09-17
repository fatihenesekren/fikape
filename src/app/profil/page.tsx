import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EditName } from "./EditName";
import { AvatarPicker } from "./AvatarPicker";
import { NotificationToggle } from "./NotificationToggle";
import { NotificationsSection } from "./NotificationsSection";
import { resolveLiveNotificationMessages } from "@/lib/notification";
import { BlockedUsersSection } from "./BlockedUsersSection";
import { calcOverall } from "@/lib/fikape";
import { FUEL_LABELS } from "@/lib/fuel";
import { TRUST_PROFILE } from "@/lib/trustBadge";
import { DeleteReviewButton } from "@/components/DeleteReviewButton";
import { InviteBox } from "./InviteBox";
import { getFoundingReviewIds } from "@/lib/foundingReviewer";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { ScrollFadeBox } from "@/components/ScrollFadeBox";
import { FavoriteRow } from "./FavoriteRow";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import { DeleteAccountSection } from "./DeleteAccountSection";
import { EXPERT_STATUS_TONES } from "@/lib/expertNote";

export const metadata: Metadata = { title: "Profilim" };

// Yorum Geçmişi durum rozetleri — önceden her satırda (map() içinde, satır
// başına yeniden) kendi ham hex renklerini (#27500A/#EAF3DE vb.) tanımlıyordu;
// bu, usta notu/cevap durumlarında kullanılan EXPERT_STATUS_TONES'tan tamamen
// AYRI, kavramsal olarak aynı işi yapan ikinci bir renk seti idi (genel tarama
// bulgusu). Aynı 4 tona (success/warning/danger/neutral) indirgendi.
const REVIEW_STATUS_TONE: Record<string, { label: string; color: string; bg: string }> = {
  PUBLISHED: { label: "Yayında", ...EXPERT_STATUS_TONES.success },
  PENDING: { label: "İncelemede", ...EXPERT_STATUS_TONES.warning },
  REJECTED: { label: "Reddedildi", ...EXPERT_STATUS_TONES.danger },
  HIDDEN: { label: "Gizlendi", ...EXPERT_STATUS_TONES.neutral },
  DELETED: { label: "Silindi", ...EXPERT_STATUS_TONES.neutral },
};

// Usta kartındaki "Profil Ayarları" köşe ikonu — sitenin diğer inline SVG
// ikon deseniyle (ör. ExpertNotesSection.tsx EditIcon) aynı stil.
function GearIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const userId = Number(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      displayName: true,
      avatarUrl: true,
      email: true,
      trustLevel: true,
      emailVerifiedAt: true,
      emailNotificationsEnabled: true,
      createdAt: true,
      referralCode: true,
      _count: { select: { referrals: true } },
    },
  });

  if (!user) redirect("/giris");

  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      product: { include: { brand: true, model: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      product: { include: { brand: true, model: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const favoriteProductIds = favorites.map((f) => f.productId);
  const [favoriteScoreAggs, favoriteWikiUrls] = await Promise.all([
    favoriteProductIds.length
      ? prisma.review.groupBy({
          by: ["productId"],
          where: { status: "PUBLISHED", productId: { in: favoriteProductIds } },
          _avg: { scoreOverall: true },
          _count: { id: true },
        })
      : Promise.resolve([]),
    getVehicleImageUrls(
      favorites.filter((f) => !f.product.imageUrl).map((f) => f.product.slug)
    ),
  ]);
  const favoriteScoreMap = new Map(
    favoriteScoreAggs.map((a) => [a.productId, { avg: a._avg.scoreOverall ?? 0, count: a._count.id }])
  );

  const publishedReviews = reviews.filter((r) => r.status === "PUBLISHED");
  const reviewIds = publishedReviews.map((r) => r.id);

  const [garageCount, helpfulCount, foundingIds, notificationsRaw, expertProfile, ustaThreadCount] = await Promise.all([
    prisma.userProduct.count({ where: { userId, ownershipStatus: "CURRENT" } }),
    reviewIds.length
      ? prisma.reviewHelpfulVote.count({ where: { reviewId: { in: reviewIds }, isHelpful: true } })
      : Promise.resolve(0),
    getFoundingReviewIds([...new Set(publishedReviews.map((r) => r.productId))]),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 21,
      select: { id: true, type: true, message: true, link: true, isRead: true, createdAt: true, expertNoteId: true },
    }),
    prisma.expertProfile.findUnique({ where: { userId }, select: { status: true, slug: true } }).catch(() => null),
    // "Usta Mesajlarım" linki yalnız gerçekten erişilebilir bir şey varsa
    // gösterilir (bkz. /mesajlar sekme görünürlüğüyle AYNI kural).
    prisma.expertMessageThread.count({
      where: { OR: [{ initiatorId: userId }, { expertProfile: { userId } }] },
    }),
  ]);

  const hasMoreNotifications = notificationsRaw.length > 20;
  // Not başlığı sonradan düzeltilmişse bildirim metni de güncel kalsın diye
  // (kullanıcı fark etti) — tek toplu sorgu, N+1 değil.
  const visibleNotifications = await resolveLiveNotificationMessages(notificationsRaw.slice(0, 20));

  const foundingCount = publishedReviews.filter((r) => foundingIds.has(r.id)).length;

  // Katkı-etki: yorumların olduğu araçların toplam görüntülenmesi (yaklaşık —
  // yorum başına ayrı view tracking yok, ürün sayfası görüntülenmesi proxy olarak kullanılıyor)
  const uniqueProductViews = new Map(publishedReviews.map((r) => [r.productId, r.product.viewCount]));
  const totalViews = [...uniqueProductViews.values()].reduce((s, v) => s + v, 0);

  const pendingDeletionRequest = await prisma.dataDeletionRequest.findFirst({
    where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    select: { dueAt: true },
  }).catch(() => null);

  const blockedUsers = (
    await prisma.blockedUser.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: "desc" },
      select: { blockedId: true, createdAt: true, source: true, blocked: { select: { displayName: true, avatarUrl: true } } },
    }).catch(() => [])
  ).map((b) => ({
    userId: b.blockedId,
    displayName: b.blocked.displayName,
    avatarUrl: b.blocked.avatarUrl,
    since: b.createdAt.toISOString(),
    source: b.source, // "TAKAS" | "USTA" | null (null = migrasyondan önceki eski kayıt)
  }));

  const trust = TRUST_PROFILE[user.trustLevel] ?? TRUST_PROFILE[1];

  const joinedAt = new Intl.DateTimeFormat("tr-TR", {
    year: "numeric", month: "long",
  }).format(user.createdAt);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

      {/* Kullanıcı kartı */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3">
            <AvatarPicker userId={userId} displayName={user.displayName} initialAvatarUrl={user.avatarUrl} />
            <EditName current={user.displayName ?? ""} />
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="flex flex-wrap gap-2 items-center">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                style={{ background: trust.bg, color: trust.color }}
              >
                {trust.icon && <span>{trust.icon}</span>}
                {trust.label}
              </span>
              {!user.emailVerifiedAt && (
                <span className="text-xs text-amber-600 font-medium">
                  ⚠ E-posta doğrulanmadı
                </span>
              )}
              {user.emailVerifiedAt && (
                <span className="text-xs text-green-600 font-medium">
                  ✓ E-posta doğrulandı
                </span>
              )}
            </div>
            <NotificationToggle initialEnabled={user.emailNotificationsEnabled} />
          </div>

          <div className="text-right space-y-1">
            <div className="text-xs text-gray-400">Üyelik</div>
            <div className="text-sm font-semibold text-gray-700">{joinedAt}</div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div className="text-center">
            {/* Aynı filtre 3 kez ayrı ayrı hesaplanıyordu — `publishedReviews`
                zaten en üstte tek seferlik hesaplanmıştı, ikisi de ona
                yönlendirildi (genel tarama bulgusu). */}
            <div className="text-2xl font-black text-gray-900">
              {publishedReviews.length}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Yayınlanan yorum</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900">{garageCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">Garajdaki araç</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900">
              {publishedReviews.length > 0
                ? (publishedReviews.reduce((s, r) => s + calcOverall(r), 0) / publishedReviews.length).toFixed(1)
                : "—"}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Ort. fi·ka·pe</div>
          </div>
        </div>

        {/* Katkı-etki geri bildirimi */}
        {publishedReviews.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 pt-5 border-t border-gray-100 text-xs text-gray-500">
            <span className="min-w-0">
              Yorumlarının olduğu araçlar <strong className="text-gray-900">{totalViews.toLocaleString("tr-TR")}</strong> kez görüntülendi
            </span>
            <span className="min-w-0">
              <strong className="text-gray-900">{helpfulCount}</strong> kişi yorumlarını faydalı buldu
            </span>
            {foundingCount > 0 && (
              <span className="min-w-0">
                🏅 <strong className="text-gray-900">{foundingCount}</strong> araçta Kurucu Yorumcusun
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hızlı linkler */}
      <div className="flex gap-3">
        <Link
          href="/garajim"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors"
        >
          🚗 Garajım
        </Link>
        <Link
          href="/yorum-yaz"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: "var(--btn-dark)" }}
        >
          Yorum Yaz →
        </Link>
      </div>

      <NotificationsSection
        notifications={visibleNotifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
        hasMore={hasMoreNotifications}
      />

      {/* Favorilerim */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">
          <span className="text-amber-500">★</span> Favorilerim
        </h2>

        {favorites.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center text-gray-400 text-sm">
            Henüz favori aracın yok.
          </div>
        ) : (
          <ScrollFadeBox itemCount={favorites.length} maxHeight={320} alwaysFramed>
            <div className="space-y-2">
              {favorites.map((f) => (
                <FavoriteRow
                  key={f.id}
                  product={f.product}
                  imageUrl={f.product.imageUrl ?? favoriteWikiUrls[f.product.slug] ?? null}
                  score={favoriteScoreMap.get(f.productId) ?? null}
                />
              ))}
            </div>
          </ScrollFadeBox>
        )}
      </div>

      {/* Yorum geçmişi */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Yorum Geçmişi</h2>

        {reviews.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center text-gray-400 text-sm">
            Henüz yorum yazmadınız.
          </div>
        ) : (
          <ScrollFadeBox itemCount={reviews.length} maxHeight={640}>
          <div className="space-y-3">
            {reviews.map((r) => {
              const attrs = r.product.attributes as Record<string, unknown>;
              const fuelType = String(attrs.fuel_type ?? "");
              const overall = calcOverall(r).toFixed(1);
              const st = REVIEW_STATUS_TONE[r.status] ?? REVIEW_STATUS_TONE.PENDING;

              const ext = (r.extendedData as Record<string, unknown>) ?? {};
              const rPros = (ext.pros as string[] | undefined) ?? [];
              const rCons = (ext.cons as string[] | undefined) ?? [];
              const needsChipNudge =
                (r.status === "PUBLISHED" || r.status === "PENDING") &&
                rPros.length === 0 && rCons.length === 0;

              return (
                <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
                  <Link
                    href={`/araclar/${r.product.slug}`}
                    className="flex items-start justify-between gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-0.5">
                        {r.product.brand.name}
                      </div>
                      <div className="font-semibold text-gray-900 truncate">
                        {stripModelGenRange(r.product.model.name)}
                        {r.product.year && (
                          <span className="text-gray-400 font-normal ml-1.5">{r.product.year}</span>
                        )}
                        <span className="text-xs text-gray-400 ml-2">
                          {FUEL_LABELS[fuelType] ?? fuelType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{r.summaryText}</p>
                    </div>

                    <div className="text-right shrink-0 space-y-1.5">
                      <div className="text-xl font-black text-gray-900">{overall}</div>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full block"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                      {foundingIds.has(r.id) && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                          style={{ background: "#FEF3C7", color: "#92400E" }}
                        >
                          🏅 Kurucu
                        </span>
                      )}
                    </div>
                  </Link>

                  {needsChipNudge && (
                    <Link
                      href={`/yorumum/${r.id}/duzenle`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
                      style={{ background: "#FEF3C7", color: "#92400E" }}
                    >
                      ⚡ Hızlı puandın — artı/eksi ekleyerek güçlendir →
                    </Link>
                  )}

                  {(r.status === "PUBLISHED" || r.status === "PENDING") && (
                    <div className="pt-2 border-t border-gray-50 flex items-center gap-4">
                      {r.status === "PUBLISHED" && (
                        <Link
                          href={`/yorumum/${r.id}/paylas`}
                          className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          ↗ Paylaş
                        </Link>
                      )}
                      <Link
                        href={`/yorumum/${r.id}/duzenle`}
                        className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        ✎ Düzenle
                      </Link>
                      <DeleteReviewButton reviewId={r.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </ScrollFadeBox>
        )}
      </div>

      {/* Topluluk — davet + usta başvurusu: sıradan kullanıcının günlük
          kullandığı içeriğin (Favoriler/Yorumlar) ALTINA, hesap işlemlerinin
          hemen ÜSTÜNE bilinçli olarak taşındı (4 ajanlı IA/Growth/Görsel
          Hiyerarşi/Navigasyon panel değerlendirmesi — bkz.
          feature_usta_gorusleri_ilerleme). Eskiden InviteBox'tan hemen sonra,
          Favoriler'den hemen önce duruyordu; niş bir "usta mısın?" CTA'sı
          herkesin sık kullandığı kişisel içeriğin önüne çıkıyordu. */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Topluluk</h2>
        <div className="space-y-3">
          <InviteBox referralCode={user.referralCode} referralCount={user._count.referrals} />

          {/* Usta Görüşü — InviteBox'la kart stili bilinçli olarak farklı
              (mavi ton): biri sosyal davet, diğeri mesleki başvuru — aynı
              kalıpta olmaları kullanıcının ikisini aynı hafiflikte
              algılamasına yol açıyordu (Görsel Hiyerarşi ajanı bulgusu). */}
          <div id="usta-gorusu" className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 scroll-mt-20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  🔧 Usta Görüşü
                  {/* "Aktif" artık gri, göze çarpmayan bir alt metin değil,
                      diğer durum rozetleriyle (STATUS_LABEL deseni) aynı
                      görsel dilde yeşil bir rozet — kullanıcı fark etti. */}
                  {expertProfile?.status === "ACTIVE" && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ color: EXPERT_STATUS_TONES.success.color, background: EXPERT_STATUS_TONES.success.bg }}>
                      Aktif
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {!expertProfile && "Bir tamir/bakım ustasıysanız, araç modelleri hakkında teknik görüş paylaşabilirsiniz."}
                  {expertProfile?.status === "PENDING_VERIFICATION" && "Başvurunuz inceleniyor."}
                  {expertProfile?.status === "WAITLISTED" && "Başvurunuz bekleme listesinde — sıradaki pencerede değerlendirilecek."}
                  {expertProfile?.status === "ACTIVE" && "Yeni bir usta görüşü yazabilir, danışan mesajlarınızı görebilirsiniz."}
                  {(expertProfile?.status === "SUSPENDED" || expertProfile?.status === "CLOSED") && "Usta profiliniz şu anda aktif değil."}
                </p>
              </div>
              {!expertProfile && (
                <Link href="/usta-basvuru" className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "var(--btn-dark)" }}>
                  Başvur →
                </Link>
              )}
              {/* Yalnız dişli ikonu ne işe yaradığı belli olmuyordu
                  (kullanıcı fark etti) — yanına kısa bir "Ayarlar" etiketi
                  eklendi (sitenin diğer ikon+metin linkleriyle, ör.
                  "Google Maps'te aç ↗", aynı desen). Hâlâ köşede, düz
                  buton satırından ayrı — bir "yapılandırma" eylemi. */}
              {expertProfile?.status === "ACTIVE" && (
                <Link
                  href="/usta-gorusu/profil"
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 mt-0.5"
                >
                  <GearIcon className="w-3.5 h-3.5" />
                  Ayarlar
                </Link>
              )}
            </div>

            {/* İçerik eylemleri tek bir satırda: Profilim/Notlarım/Mesajlarım
                eşit ağırlıklı ikincil butonlar, "Usta Görüşü Yaz" tek
                birincil eylem olarak sağda. Önceden "Usta Mesajlarım"
                ayrı bir çizgiyle alta, birincil butonun tam altına
                sıkışmış tek başına bir link gibi duruyordu ("karışık"
                görünüyordu, kullanıcı fark etti) — artık aynı satırın
                parçası. */}
            {expertProfile?.status === "ACTIVE" && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {/* Düz "Profilim" — sayfanın kendisi zaten "Profilim" başlığını
                    taşıdığı için burada ayrı bir "Profilim"e gitmek kafa
                    karıştırıcıydı, ayrıca "Notlarım"/"Mesajlarım" tek
                    başına usta bağlamını taşımıyordu (kullanıcı fark etti).
                    Üçü de artık "Usta" önekiyle — kartın kendi başlığıyla
                    ("🔧 Usta Görüşü") ve "Usta Görüşü Yaz"la aynı dilde. */}
                <Link href={`/usta/${expertProfile.slug}`} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200 bg-white/70 hover:bg-white">
                  Usta Profilim
                </Link>
                <Link href="/usta-gorusu/notlarim" className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200 bg-white/70 hover:bg-white">
                  Usta Notlarım
                </Link>
                <Link href="/mesajlar?tab=usta" className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200 bg-white/70 hover:bg-white">
                  Usta Mesajlarım
                </Link>
                <Link href="/usta-gorusu/yaz" className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "var(--btn-dark)" }}>
                  Usta Görüşü Yaz →
                </Link>
              </div>
            )}

            {/* Usta ile site-içi mesajlaşma — hem "usta olarak gelen" hem
                "kullanıcı olarak başlattığın" görüşmeler tek gelen kutusunda
                (Aşama 6b). Aktif usta olan zaten yukarıdaki satırda
                "Mesajlarım"a sahip — bu fallback yalnız aktif usta OLMAYIP
                geçmişte bir usta konuşması bulunan kullanıcı için (erişecek
                bir şeyi olmayana boş bir link göstermenin anlamı yok). */}
            {expertProfile?.status !== "ACTIVE" && ustaThreadCount > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-100/70 flex justify-end">
                <Link href="/mesajlar?tab=usta" className="text-xs font-semibold text-gray-500 hover:text-gray-800">
                  💬 Usta Mesajlarım →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Engellenen Kullanıcılar — önceden Bildirimler'in hemen altında,
          günlük aktivite akışının (Favoriler/Yorum Geçmişi) ortasında
          duruyordu. Bu bir güvenlik/hesap yönetimi eylemi, sık ziyaret
          edilen içerik değil — Topluluk bölümünün "hesap işlemlerinin
          hemen üstüne" taşınmasıyla aynı ilkeyle buraya, Hesabımı Sil'in
          hemen üstüne alındı (kullanıcı fark etti: "daha uygun bir yere
          koymak lazım"). #engellenenler çapası konumdan bağımsız çalışır. */}
      <BlockedUsersSection initialBlocked={blockedUsers} />

      <DeleteAccountSection
        initialPendingRequest={pendingDeletionRequest ? { dueAt: pendingDeletionRequest.dueAt.toISOString() } : null}
      />

    </div>
  );
}
