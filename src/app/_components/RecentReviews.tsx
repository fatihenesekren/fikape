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
            days === 0 ? "bugün" : days === 1 ? "dün" : `${days}g`;

          // İçerik kaynağı: detailText → summaryText → artı/eksi → boş.
          // Kart sadeliği için: TEK satır alıntı; chip yerine ilk 1-2 madde düz
          // metin; hiçbiri yoksa soluk "Hızlı puan" notu (bkz. kullanıcı geri
          // bildirimi: şerit çok kalabalıktı).
          const text = ((r.detailText ?? r.summaryText ?? "") as string).trim();
          const ed = r.extendedData as { pros?: string[]; cons?: string[] } | null | undefined;
          const chips = !text
            ? [
                ...((ed?.pros ?? []).map((k) => ({ k, kind: "pro" as const }))),
                ...((ed?.cons ?? []).map((k) => ({ k, kind: "con" as const }))),
              ].slice(0, 2)
            : [];
          const chipText = chips
            .map(({ k, kind }) => `${kind === "pro" ? "+" : "−"} ${CHIP_LABEL[k] ?? k}`)
            .join(" · ");

          return (
            <a
              key={r.id}
              href={`/araclar/${r.product.slug}?sekme=yorumlar#yorum-${r.id}`}
              data-scroll-card
              className="group shrink-0 snap-start w-64 flex flex-col gap-1.5 px-4 py-3 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all"
            >
              {/* Kullanıcı · zaman + skor */}
              <div className="flex items-center gap-2">
                <Avatar
                  displayName={r.user.displayName}
                  avatarUrl={r.user.avatarUrl}
                  seed={String(r.user.id)}
                  size={26}
                />
                <div className="min-w-0 flex-1 text-xs text-gray-400 truncate">
                  <span className="font-semibold text-gray-700">{name}</span> · {timeLabel}
                </div>
                <div className="text-sm font-black shrink-0 tabular-nums" style={{ color: scoreColor }}>
                  {overall.toFixed(1)}
                </div>
              </div>

              {/* Araç */}
              <div className="text-xs font-medium text-gray-800 truncate">
                {r.product.brand.name} {stripModelGenRange(r.product.model.name)}
              </div>

              {/* Giriş yapmış: yorumdan TEK satır → yoksa ilk 1-2 artı/eksi düz
                  metin → yoksa soluk "Hızlı puan". Anon: bu satır hiç render
                  edilmez (metin DB'den zaten çekilmedi). */}
              {isLoggedIn && (
                text ? (
                  <p className="text-xs text-gray-400 truncate group-hover:text-gray-500 transition-colors">
                    “{text}”
                  </p>
                ) : chipText ? (
                  <p className="text-xs text-gray-400 truncate">{chipText}</p>
                ) : (
                  <p className="text-xs text-gray-300 truncate">Hızlı puan</p>
                )
              )}
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
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-link-soft text-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2.5" />
                <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-gray-700 leading-snug">
              Yorumları üyeler okuyabilir
            </span>
            <span className="text-[11px] font-semibold text-link">Giriş yap →</span>
          </a>
        )}
      </ScrollFadeRow>
    </section>
  );
}
