import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HeroSection } from "./_components/HeroSection";
import { ProductGrid } from "./_components/ProductGrid";
import { CardGridSkeleton } from "./_components/CardGridSkeleton";
import { RecentReviews } from "./_components/RecentReviews";
import { TrendVehicleCard } from "./_components/TrendVehicleCard";
import { CategoryTabs } from "./_components/CategoryTabs";
import { ScrollFadeRow } from "@/components/ScrollFadeRow";
import { ScrollTopLogo } from "./_components/ScrollTopLogo";
import { decodeQuiz } from "@/lib/quiz";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, string> = {
  otomobil: "🚗", motosiklet: "🏍️", "e-scooter": "⚡",
  "e-bisiklet": "🚴", karavan: "🏕️", kamyonet: "🛻",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; dogrulama?: string; quiz?: string }>;
}) {
  const { kategori, dogrulama, quiz } = await searchParams;

  // Eski ana sayfa kategori filtresi linkleri (?kategori=X) artık katalog
  // sayfasına taşındı — bookmark/dış link kırılmasın (bkz. backlog_anasayfa_katalog_ayirma).
  // ⚠️ quiz akışı da `?kategori=X&quiz=...` ile ana sayfaya döner (NiyetKarti
  // completeWith) — o durumda YÖNLENDİRME, yoksa "4 soru" sonucu kaybolur.
  if (kategori && kategori !== "hepsi" && !quiz) {
    redirect(`/araclar?kategori=${encodeURIComponent(kategori)}`);
  }

  const quizParam = quiz ?? undefined;

  // Trend — sadece quiz modunda değilken, haftalık görüntülemesi olanlar
  const trendProducts = !quizParam
    ? await prisma.product.findMany({
        where: { isActive: true, weeklyViewCount: { gt: 0 } },
        include: { brand: true, model: true, category: true },
        orderBy: { weeklyViewCount: "desc" },
        take: 8,
      })
    : [];
  const trendGarageCounts = trendProducts.length
    ? await prisma.userProduct.groupBy({
        by: ["productId"],
        where: { productId: { in: trendProducts.map((p) => p.id) }, ownershipStatus: "CURRENT" },
        _count: { id: true },
      })
    : [];
  const trendGarageCountMap = new Map(trendGarageCounts.map((g) => [g.productId, g._count.id]));

  return (
    <>
      {/* ── Doğrulama banner'ları ── */}
      {dogrulama === "tamam" && (
        <div className="bg-green-50 border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 py-3 text-sm font-semibold text-green-800">
            ✓ E-posta adresiniz doğrulandı. Hesabınız aktif!
          </div>
        </div>
      )}
      {dogrulama === "gecersiz" && (
        <div className="bg-red-50 border-b border-red-100">
          <div className="max-w-7xl mx-auto px-4 py-3 text-sm font-semibold text-red-700">
            Doğrulama linki geçersiz veya süresi dolmuş. Yeni link için giriş yapın.
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <HeroSection />

      {/* ── Kategori sekmeleri (sticky) — her chip /araclar katalog sayfasına gider ── */}
      <section className="border-b border-gray-100 bg-white sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <CategoryTabs
            quizActive={!!quizParam}
            showQuizChip={
              quizParam
                ? (() => {
                    const qa = decodeQuiz(quizParam);
                    if (!qa) return null;
                    // Katalog artık /araclar'da; quiz'i kapatınca ana sayfaya dön.
                    return (
                      <Link
                        href="/"
                        className="shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1.5"
                        style={{ background: "#111", color: "#fff", borderColor: "#111" }}
                      >
                        <span aria-hidden="true">🎯</span>
                        <span>Araç Bul</span>
                        <span className="opacity-60 ml-0.5" aria-hidden="true">✕</span>
                      </Link>
                    );
                  })()
                : undefined
            }
          />
        </div>
      </section>

      {/* ── Trend şeridi (quiz modunda değilken) ── */}
      {!quizParam && trendProducts.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 pt-6 pb-3">
          <h2 className="text-sm font-bold text-gray-900 mb-3">
            Bu hafta ilgi gören araçlar
          </h2>
          <ScrollFadeRow>
            {trendProducts.map((p, idx) => {
              const attrs = p.attributes as Record<string, unknown>;
              return (
                <TrendVehicleCard
                  key={p.id}
                  slug={p.slug}
                  brandName={p.brand.name}
                  modelName={p.model.name}
                  trimName={p.trimName}
                  year={p.year}
                  imageUrl={p.imageUrl}
                  categoryIcon={CATEGORY_ICONS[p.category?.slug ?? "otomobil"] ?? "🚗"}
                  categoryLabel={p.category?.name ?? "Araç"}
                  fuelType={attrs.fuel_type ? String(attrs.fuel_type) : null}
                  garageCount={trendGarageCountMap.get(p.id) ?? 0}
                  colorIndex={idx}
                />
              );
            })}
          </ScrollFadeRow>
        </section>
      )}

      {/* ── Son yorumlar (quiz modunda değilken) ── */}
      {!quizParam && <RecentReviews />}

      {/* ── Araç kartları — quiz yoksa kürasyonlu "öne çıkanlar" (~12),
             quiz varsa quiz-skorlu sonuçlar. Tüm katalog artık /araclar'da. ── */}
      <Suspense fallback={<CardGridSkeleton />}>
        <ProductGrid quizParam={quizParam} />
      </Suspense>

      {/* ── Tüm kataloğa geçiş ── */}
      {!quizParam && (
        <div className="w-full max-w-7xl mx-auto px-4 -mt-2 pb-8">
          <Link
            href="/araclar"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:underline"
          >
            Tüm araçlar →
          </Link>
        </div>
      )}

      {/* ── FI·KA·PE açıklama ── */}
      <section className="w-full max-w-7xl mx-auto px-4 pb-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            {
              short: "Fİ", word: "Fiyat",
              desc: "Para vermeye değdi mi? Bütçene göre doğru seçim miydi?",
              color: "#0C447C", bg: "#E6F1FB",
            },
            {
              short: "KA", word: "Kalite",
              desc: "Dayanıklılık, montaj kalitesi, uzun vadede güven veriyor mu?",
              color: "#27500A", bg: "#EAF3DE",
            },
            {
              short: "PE", word: "Performans",
              desc: "Günlük kullanım nasıl? Sürüş hissi, konfor, teknoloji.",
              color: "#712B13", bg: "#FAECE7",
            },
          ].map(({ short, word, desc, color, bg }) => (
            <div key={short} className="rounded-xl p-4" style={{ background: bg }}>
              <div className="text-2xl font-black mb-1" style={{ color }}>{short}</div>
              <div className="text-sm font-bold mb-1" style={{ color }}>{word}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Alt CTA ── */}
      <section className="bg-[#111] text-white mt-4">
        <div className="max-w-7xl mx-auto px-4 py-14 text-center">
          <ScrollTopLogo />
          <p className="text-gray-300 text-lg font-bold mb-2">
            Aracın hakkında ne düşünüyorsun?
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Yorumun bir sonraki alıcının kararını değiştirebilir.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="/yorum-yaz"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-[#111] bg-white hover:bg-gray-100 transition-colors"
            >
              Yorum Yaz →
            </a>
            <a
              href="/oner"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white border border-white/20 hover:border-white/40 transition-colors"
            >
              Araç Öner
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
