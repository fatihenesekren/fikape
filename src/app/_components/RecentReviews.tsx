import { prisma } from "@/lib/prisma";

const AVATAR_COLORS = ["#0C447C", "#27500A", "#712B13", "#6B3A8A", "#0D6E5A"];

export async function RecentReviews() {
  const reviews = await prisma.review.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 6,
    include: {
      user:    { select: { displayName: true } },
      product: { include: { brand: true, model: true } },
    },
  });

  if (reviews.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 pt-6 pb-2">
      <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span>💬</span> Son Yorumlar
      </h2>

      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {reviews.map((r) => {
          const overall   = r.scoreOverall ?? 0;
          const name      = r.user.displayName ?? "Kullanıcı";
          const initial   = name[0].toUpperCase();
          const avatarBg  = AVATAR_COLORS[r.id % AVATAR_COLORS.length];
          const scoreColor =
            overall >= 7.5 ? "#27500A" : overall >= 5 ? "#B45309" : "#991B1B";

          const now = Date.now();
          const createdMs = new Date(r.createdAt).getTime();
          const days = Math.floor((now - createdMs) / 86_400_000);
          const timeLabel =
            days === 0 ? "bugün" : days === 1 ? "dün" : `${days} gün önce`;

          return (
            <a
              key={r.id}
              href={`/araclar/${r.product.slug}`}
              className="shrink-0 w-64 flex flex-col gap-2 px-4 py-3.5 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all"
            >
              {/* Kullanıcı + skor */}
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: avatarBg }}
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-700 truncate">
                    {name}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {r.product.brand.name} {r.product.model.name}
                  </div>
                </div>
                <div
                  className="text-sm font-black shrink-0 tabular-nums"
                  style={{ color: scoreColor }}
                >
                  {overall.toFixed(1)}
                </div>
              </div>

              {/* Yorum özeti */}
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                {r.summaryText}
              </p>

              {/* Zaman */}
              <div className="text-xs text-gray-300">{timeLabel}</div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
