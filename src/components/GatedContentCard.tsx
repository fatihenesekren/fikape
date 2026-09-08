import Link from "next/link";

// Anonim kullanıcıya yorum / soru-cevap içeriği GÖSTERİLMEZ — bu bileşen
// sunucuda, gerçek metin hiç çekilmeden render edilir (bkz. araclar/[slug]
// page.tsx anon dalı). Arkadaki iskelet satırlar salt CSS dokusu, DOM'da
// yorum metni YOK. Kilidi giriş/kayıt açar.

const COPY = {
  reviews: {
    countUnit: "kullanıcı yorumu",
    title: "Gerçek kullanıcı yorumlarını oku",
    sub: "fikape topluluğu araç deneyimlerini paylaşıyor. Okumak için hesabınla giriş yap.",
  },
  qna: {
    countUnit: "soru",
    title: "Soru-cevapları gör",
    sub: "Bu aracı kullananların sorulara verdiği yanıtları görmek için hesabınla giriş yap.",
  },
} as const;

export function GatedContentCard({
  type,
  count,
  callbackUrl,
}: {
  type: "reviews" | "qna";
  count: number;
  callbackUrl: string;
}) {
  const c = COPY[type];
  const cb = encodeURIComponent(callbackUrl);

  return (
    <div className="relative overflow-hidden min-h-[300px]">
      {/* Arka plan — salt görsel iskelet (gerçek veri değil) */}
      <div aria-hidden="true" className="pointer-events-none select-none px-5 py-6 space-y-6 blur-[2px] opacity-60">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="h-2.5 w-28 rounded bg-gray-200" />
              <div className="ml-auto h-2.5 w-8 rounded bg-gray-200" />
            </div>
            <div className="h-2 w-full rounded bg-gray-100" />
            <div className="h-2 w-4/5 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Kilit kartı */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm px-6 py-7">
          <span className="mx-auto mb-3 flex w-11 h-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
          {count > 0 && (
            <p className="text-xs font-semibold text-gray-400 mb-1">
              {count} {c.countUnit}
            </p>
          )}
          <p className="text-sm font-bold text-gray-900">{c.title}</p>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{c.sub}</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Link
              href={`/giris?callbackUrl=${cb}`}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              style={{ background: "#111" }}
            >
              Giriş yap
            </Link>
            <Link
              href={`/kayit?callbackUrl=${cb}`}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Kayıt ol
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
