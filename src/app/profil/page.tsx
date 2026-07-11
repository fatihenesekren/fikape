import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EditName } from "./EditName";
import { AvatarPicker } from "./AvatarPicker";
import { calcOverall } from "@/lib/fikape";
import { FUEL_LABELS } from "@/lib/fuel";
import { TRUST_PROFILE } from "@/lib/trustBadge";
import { DeleteReviewButton } from "@/components/DeleteReviewButton";
import { InviteBox } from "./InviteBox";
import { getFoundingReviewIds } from "@/lib/foundingReviewer";
import { stripModelGenRange } from "@/lib/modelDisplay";

export const metadata: Metadata = { title: "Profilim" };

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

  const publishedReviews = reviews.filter((r) => r.status === "PUBLISHED");
  const reviewIds = publishedReviews.map((r) => r.id);

  const [garageCount, helpfulCount, foundingIds] = await Promise.all([
    prisma.userProduct.count({ where: { userId, ownershipStatus: "CURRENT" } }),
    reviewIds.length
      ? prisma.reviewHelpfulVote.count({ where: { reviewId: { in: reviewIds }, isHelpful: true } })
      : Promise.resolve(0),
    getFoundingReviewIds([...new Set(publishedReviews.map((r) => r.productId))]),
  ]);

  const foundingCount = publishedReviews.filter((r) => foundingIds.has(r.id)).length;

  // Katkı-etki: yorumların olduğu araçların toplam görüntülenmesi (yaklaşık —
  // yorum başına ayrı view tracking yok, ürün sayfası görüntülenmesi proxy olarak kullanılıyor)
  const uniqueProductViews = new Map(publishedReviews.map((r) => [r.productId, r.product.viewCount]));
  const totalViews = [...uniqueProductViews.values()].reduce((s, v) => s + v, 0);

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
          </div>

          <div className="text-right space-y-1">
            <div className="text-xs text-gray-400">Üyelik</div>
            <div className="text-sm font-semibold text-gray-700">{joinedAt}</div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900">
              {reviews.filter((r) => r.status === "PUBLISHED").length}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Yayınlanan yorum</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900">{garageCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">Garajdaki araç</div>
          </div>
          <div className="text-center">
            {(() => {
              const published = reviews.filter((r) => r.status === "PUBLISHED");
              return (
                <div className="text-2xl font-black text-gray-900">
                  {published.length > 0
                    ? (published.reduce((s, r) => s + calcOverall(r), 0) / published.length).toFixed(1)
                    : "—"}
                </div>
              );
            })()}
            <div className="text-xs text-gray-400 mt-0.5">Ort. fi·ka·pe</div>
          </div>
        </div>

        {/* Katkı-etki geri bildirimi */}
        {publishedReviews.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 pt-5 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Yorumlarının olduğu araçlar <strong className="text-gray-900">{totalViews.toLocaleString("tr-TR")}</strong> kez görüntülendi
            </span>
            <span>
              <strong className="text-gray-900">{helpfulCount}</strong> kişi yorumlarını faydalı buldu
            </span>
            {foundingCount > 0 && (
              <span>
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
          style={{ background: "#111" }}
        >
          Yorum Yaz →
        </Link>
      </div>

      <InviteBox referralCode={user.referralCode} referralCount={user._count.referrals} />

      {/* Yorum geçmişi */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Yorum Geçmişi</h2>

        {reviews.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center text-gray-400 text-sm">
            Henüz yorum yazmadınız.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => {
              const attrs = r.product.attributes as Record<string, unknown>;
              const fuelType = String(attrs.fuel_type ?? "");
              const overall = calcOverall(r).toFixed(1);

              const statusMap = {
                PUBLISHED: { label: "Yayında",    color: "#27500A", bg: "#EAF3DE" },
                PENDING:   { label: "İncelemede", color: "#712B13", bg: "#FAECE7" },
                REJECTED:  { label: "Reddedildi", color: "#555",    bg: "#f3f4f6" },
                HIDDEN:    { label: "Gizlendi",   color: "#555",    bg: "#f3f4f6" },
                DELETED:   { label: "Silindi",    color: "#555",    bg: "#f3f4f6" },
              };
              const st = statusMap[r.status] ?? statusMap.PENDING;

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
        )}
      </div>

    </div>
  );
}
