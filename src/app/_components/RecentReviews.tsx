import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ScrollFadeRow } from "@/components/ScrollFadeRow";
import { Avatar } from "@/components/Avatar";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { CHIP_LABEL } from "@/lib/chips";

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

export async function RecentReviews() {
  // Yorum METNİ + artı/eksi yalnızca giriş yapmış kullanıcıya — anonimde
  // sorguya bile alınmaz (bkz. feature_yorum_giris_duvari). Anon: skor +
  // kimlik + araç teaser'ı; şerit sonunda tek "Giriş yap" kartı.
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
      // Aşağıdakiler anonimde DB'den HİÇ istenmez → HTML'e sızma yolu yok.
      summaryText: isLoggedIn,
      detailText: isLoggedIn,
      extendedData: isLoggedIn,
      user:    { select: { id: true, displayName: true, avatarUrl: true } },
      product: { select: { slug: true, brand: { select: { name: true } }, model: { select: { name: true } } } },
    },
  });

  if (reviews.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 pt-3 pb-3">
      <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span aria-hidden="true">💬</span> Son Yorumlar
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

          // İçerik kaynağı: detailText → summaryText → artı/eksi chip'leri → boş.
          const text = ((r.detailText ?? r.summaryText ?? "") as string).trim();
          const ed = r.extendedData as { pros?: string[]; cons?: string[] } | null | undefined;
          const chips = !text
            ? [
                ...((ed?.pros ?? []).map((k) => ({ k, kind: "pro" as const }))),
                ...((ed?.cons ?? []).map((k) => ({ k, kind: "con" as const }))),
              ].slice(0, 3)
            : [];

          return (
            <a
              key={r.id}
              href={`/araclar/${r.product.slug}?sekme=yorumlar#yorum-${r.id}`}
              data-scroll-card
              className="group shrink-0 snap-start w-64 flex flex-col gap-2 px-4 py-3.5 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all"
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
                  <div className="text-xs font-semibold text-gray-700 truncate">{name}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {r.product.brand.name} {stripModelGenRange(r.product.model.name)}
                  </div>
                </div>
                <div className="text-sm font-black shrink-0 tabular-nums" style={{ color: scoreColor }}>
                  {overall.toFixed(1)}
                </div>
              </div>

              {/* Giriş yapmış: yorumun bir kısmı + "Devamı →" (kart yorumun
                  olduğu yere gider). Metin yoksa artı/eksi chip'leri; o da
                  yoksa (saf hızlı yorum) sadece skor kalır. Anon: hiçbiri. */}
              {isLoggedIn && text && (
                <div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{text}</p>
                  <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline">
                    Devamı →
                  </span>
                </div>
              )}
              {isLoggedIn && !text && chips.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {chips.map(({ k, kind }) => (
                    <span
                      key={`${kind}-${k}`}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={
                        kind === "pro"
                          ? { background: "#dcfce7", color: "#16a34a" }
                          : { background: "#fee2e2", color: "#dc2626" }
                      }
                    >
                      {kind === "pro" ? "+" : "−"} {CHIP_LABEL[k] ?? k}
                    </span>
                  ))}
                </div>
              )}

              {/* Zaman */}
              <div className="text-xs text-gray-300">{timeLabel}</div>
            </a>
          );
        })}

        {/* Anon: şerit sonunda tek "Giriş yap" kartı (her kartta tekrar yerine) */}
        {!isLoggedIn && (
          <a
            href="/giris?callbackUrl=/"
            data-scroll-card
            className="shrink-0 snap-start w-52 flex flex-col items-center justify-center text-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-gray-300 transition-colors"
          >
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2.5" />
                <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-gray-700 leading-snug">
              Yorumları üyeler okuyabilir
            </span>
            <span className="text-[11px] font-semibold text-indigo-600">Giriş yap →</span>
          </a>
        )}
      </ScrollFadeRow>
    </section>
  );
}
