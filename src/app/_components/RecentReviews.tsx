import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ScrollFadeRow } from "@/components/ScrollFadeRow";
import { Avatar } from "@/components/Avatar";
import { stripModelGenRange } from "@/lib/modelDisplay";

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

export async function RecentReviews() {
  // Yorum METNİ (summaryText) yalnızca giriş yapmış kullanıcıya — anonimde
  // sorguya bile alınmaz, kartta yerine kilit satırı gösterilir (bkz. Seçenek A).
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const reviews = await prisma.review.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 6,
    select: {
      id: true,
      scoreOverall: true,
      createdAt: true,
      // summaryText yalnızca giriş yapmışsa DB'den çekilir; anonimde hiç
      // istenmez → HTML'e sızma yolu yok.
      summaryText: isLoggedIn,
      user:    { select: { id: true, displayName: true, avatarUrl: true } },
      product: { select: { slug: true, brand: { select: { name: true } }, model: { select: { name: true } } } },
    },
  });

  if (reviews.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 pt-3 pb-3">
      <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span>💬</span> Son Yorumlar
      </h2>

      <ScrollFadeRow>
        {reviews.map((r) => {
          const overall   = r.scoreOverall ?? 0;
          const name      = r.user.displayName ?? "Kullanıcı";
          const scoreColor =
            overall >= 7.5 ? "#27500A" : overall >= 5 ? "#B45309" : "#991B1B";

          const days = daysSince(new Date(r.createdAt));
          const timeLabel =
            days === 0 ? "bugün" : days === 1 ? "dün" : `${days} gün önce`;

          return (
            <a
              key={r.id}
              href={`/araclar/${r.product.slug}`}
              data-scroll-card
              className="shrink-0 snap-start w-64 flex flex-col gap-2 px-4 py-3.5 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all"
            >
              {/* Kullanıcı + skor */}
              <div className="flex items-center gap-2">
                <Avatar
                  displayName={r.user.displayName}
                  avatarUrl={r.user.avatarUrl}
                  seed={String(r.user.id)}
                  size={28}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-700 truncate">
                    {name}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {r.product.brand.name} {stripModelGenRange(r.product.model.name)}
                  </div>
                </div>
                <div
                  className="text-sm font-black shrink-0 tabular-nums"
                  style={{ color: scoreColor }}
                >
                  {overall.toFixed(1)}
                </div>
              </div>

              {/* Yorum özeti — yalnızca giriş yapmış kullanıcıya. Anonimde
                  metin yok, yerine kilit ipucu (kart yine araç sayfasına gider). */}
              {isLoggedIn ? (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {r.summaryText}
                </p>
              ) : (
                <p className="text-xs text-gray-400 leading-relaxed flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2.5" />
                  </svg>
                  Yorumu okumak için giriş yap
                </p>
              )}

              {/* Zaman */}
              <div className="text-xs text-gray-300">{timeLabel}</div>
            </a>
          );
        })}
      </ScrollFadeRow>
    </section>
  );
}
