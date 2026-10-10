import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { BASE_URL } from "@/lib/baseUrl";
import { JsonLd } from "@/components/JsonLd";
import { VehicleCard } from "@/components/VehicleCard";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import { KATEGORILER, KATEGORI_SLUGLARI } from "@/lib/kategoriler";
import { aramaTemizle } from "@/lib/aramaDurumu";
import { sayfaListesi } from "@/lib/sayfalama";
import { getAracHavuzu, sureOlc, OLCUM_YAVAS_MS, OLCUM_BUYUK_HAVUZ } from "@/lib/aracHavuzu";
import { listeParametresi, sonucVermeyenSecimleriAyikla } from "@/lib/araclarFiltre";
import { searchProductIds } from "@/lib/searchProducts";
import { aramaLoglansinMi, aramaSonucDurumu, havuzuMotorSirasinaGore } from "@/lib/aramaKumesi";
import { SearchNoMatchPrompt } from "@/components/SearchNoMatchPrompt";
import { logSearch } from "@/lib/searchLog";
import { CardGridSkeleton } from "@/app/_components/CardGridSkeleton";
import type { FikapeScores } from "@/lib/fikape";
import {
  facetGroupsForCategory, fieldCoverage, productMatchesFacets, FACET_COVERAGE_THRESHOLD,
} from "@/lib/vehicleFacets";
import { AraclarFilters, type FacetGroupView } from "./AraclarFilters";
import { AraclarSearchBox } from "./AraclarSearchBox";

export const dynamic = "force-dynamic";

// 17 araç + 18. hücrede "Araç öner" kartı = 3 sütunda tam 6 satır
const PAGE_SIZE = 17;

const CATEGORIES = KATEGORILER;
const CATEGORY_SLUGS = KATEGORI_SLUGLARI;

// Motor (searchProductIds) hata verirse kullanılan yedek: aksan-duyarsız bellek içi arama.
const DIACRITIC_MARKS_RE = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(str: string) {
  return str.toLowerCase().replace(/ı/g, "i").normalize("NFD").replace(DIACRITIC_MARKS_RE, "");
}

interface SearchParams {
  kategori?: string; marka?: string; q?: string; sayfa?: string;
  yakit?: string; govde?: string; segment?: string; tip?: string; cc?: string; guc?: string; cekis?: string;
  motor?: string; batarya?: string; menzil?: string; kabin?: string; vites?: string; hiz?: string; katlan?: string;
  yatak?: string; uzunluk?: string; agirlik?: string; su?: string;
  koltuk?: string; sele?: string; abs?: string; yuk?: string; cekme?: string;
}

const FACET_KEYS = ["yakit", "govde", "segment", "tip", "cc", "guc", "cekis", "motor", "batarya", "menzil", "kabin", "vites", "hiz", "katlan", "yatak", "uzunluk", "agirlik", "su", "koltuk", "sele", "abs", "yuk", "cekme"] as const;

function parseSelectedFacets(params: SearchParams): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const k of FACET_KEYS) {
    const raw = params[k];
    if (raw) out[k] = raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return out;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const cat = params.kategori && CATEGORY_SLUGS.includes(params.kategori)
    ? CATEGORIES.find((c) => c.slug === params.kategori)
    : undefined;
  const isNarrowed =
    !!params.marka || aramaTemizle(params.q).length > 0 || (!!params.sayfa && params.sayfa !== "1") ||
    FACET_KEYS.some((k) => !!params[k]);

  return {
    title: cat ? `${cat.label} Modelleri` : "Tüm Araçlar",
    description: cat
      ? `${cat.label} kategorisindeki tüm modeller, kullanıcı yorumlarına dayalı FI·KA·PE puanlarıyla.`
      : "fikape kataloğundaki tüm araçlar — otomobil, motosiklet, e-scooter, e-bisiklet, karavan, kamyonet.",
    robots: isNarrowed ? { index: false, follow: true } : undefined,
    alternates: { canonical: cat ? `/araclar?kategori=${cat.slug}` : "/araclar" },
  };
}

export default async function AraclarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const catSlug = params.kategori && CATEGORY_SLUGS.includes(params.kategori) ? params.kategori : undefined;
  const selectedBrands = listeParametresi(params.marka); // çoklu marka: marka=rks,volta
  const q = aramaTemizle(params.q); // dizi (?q=a&q=b) ve kontrol karakterlerine karşı güvenli
  const page = Math.max(1, parseInt(params.sayfa ?? "1") || 1);
  const selectedFacets = parseSelectedFacets(params);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 mb-4 transition-colors"
      >
        ← Ana Sayfa
      </Link>

      <h1 className="text-2xl font-black text-gray-900 mb-1">
        {catSlug ? CATEGORIES.find((c) => c.slug === catSlug)!.label : "Tüm Araçlar"}
      </h1>
      <p className="text-sm text-gray-500 mb-5">Kullanıcı yorumlarına dayalı FI·KA·PE puanlarıyla tüm katalog.</p>

      {/* Kategori sekmeleri */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-4 -mx-1 px-1">
        <Link
          href="/araclar"
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
            !catSlug ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          }`}
        >
          Tümü
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/araclar?kategori=${c.slug}`}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors flex items-center gap-1.5 ${
              catSlug === c.slug ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span aria-hidden="true">{c.icon}</span>
            {c.label}
          </Link>
        ))}
      </div>

      {/* Arama */}
      <AraclarSearchBox catSlug={catSlug} q={q} />

      <Suspense fallback={<CardGridSkeleton />}>
        <AraclarResults
          catSlug={catSlug}
          selectedBrands={selectedBrands}
          q={q}
          page={page}
          selectedFacets={selectedFacets}
        />
      </Suspense>
    </div>
  );
}

async function AraclarResults({
  catSlug,
  selectedBrands,
  q,
  page,
  selectedFacets: istenenFacets,
}: {
  catSlug?: string;
  selectedBrands: string[];
  q: string;
  page: number;
  selectedFacets: Record<string, string[]>;
}) {
  const gecen = sureOlc();

  // 1) Kategori havuzu — marka/facet uygulanmadan (marka listesi + kapsam + sayımlar için).
  //    Yalnız gerekli sütunlar, etiketli kısa süreli önbellek (lib/aracHavuzu.ts).
  const pool = await getAracHavuzu(catSlug);
  const havuzMs = gecen();

  // 2) Arama — /arama ile aynı motor (kelime-AND + pg_trgm benzerlik); kategori SQL içinde süzülür.
  const aramaVar = q.length >= 2;
  let fuzzy = false;
  let motorSayisi = 0;
  let searched = pool;
  if (aramaVar) {
    let ids: number[] | null = null;
    try {
      const r = await searchProductIds(q, { limit: 1000, categorySlug: catSlug });
      ids = r.ids;
      fuzzy = r.fuzzy;
    } catch {
      ids = null; // motor hatası → yedek filtre
    }
    if (ids) {
      motorSayisi = ids.length;
      const idSet = new Set(ids);
      // Tam eşleşmede havuz sırası (marka/model/yıl), benzerde benzerlik sırası.
      searched = fuzzy ? havuzuMotorSirasinaGore(pool, ids) : pool.filter((p) => idSet.has(p.id));
    } else {
      const nq = normalize(q);
      searched = pool.filter((p) =>
        normalize(p.name).includes(nq) ||
        normalize(p.brand.name).includes(nq) ||
        normalize(p.model.name).includes(nq) ||
        (p.trimName ? normalize(p.trimName).includes(nq) : false),
      );
      motorSayisi = searched.length;
    }
  }

  // Kataloğa aday sinyali — yalnız 1. sayfa ve filtresiz aramada, tekrarsız (fire-and-forget).
  // Benzer sonuç "bulunamadı" sayılır (0).
  const facetSecili = Object.values(istenenFacets).some((v) => v.length > 0);
  if (aramaLoglansinMi({ aramaVar, sayfa: page, markaSecili: selectedBrands.length > 0, facetSecili })) {
    logSearch(q, fuzzy ? 0 : motorSayisi, "araclar");
  }

  // Hiç eşleşme yok → filtre/kenar çubuğu göstermeden tam genişlik "öner" daveti.
  if (aramaVar && motorSayisi === 0) {
    return (
      <SearchNoMatchPrompt
        query={q}
        variant="empty"
        kategori={catSlug}
        secondaryLink={{ href: catSlug ? `/araclar?kategori=${catSlug}` : "/araclar", label: "Aramayı temizle" }}
      />
    );
  }

  // 3) Facet grupları — kapsam kapısından geçenler
  const allGroups = facetGroupsForCategory(catSlug);
  const groups = allGroups.filter(
    (g) => g.alwaysShow || fieldCoverage(searched, g.attrKey) >= FACET_COVERAGE_THRESHOLD,
  );

  // 3b) Seçili özellik değerlerinden mevcut markalar/üst filtrelerle sonuç vermeyenleri ayıkla (ölü sayfa + 0'lı etiket olmasın).
  const selectedFacets = sonucVermeyenSecimleriAyikla(searched, groups, selectedBrands, istenenFacets);

  // 4) Marka listesi — arama + seçili özellik filtreleri uygulanmış havuzdan (marka seçimi HARİÇ):
  //    marka sayıları seçili filtrelerle uyumlu kalır, sonuç vermeyecek markalar listede görünmez.
  //    Seçili marka sonuç vermese bile listede kalır (sayısı 0) — kullanıcı seçimini görüp kaldırabilsin.
  const brandMap = new Map<string, { name: string; count: number }>();
  for (const p of searched) {
    if (!productMatchesFacets(p.attributes as Record<string, unknown>, groups, selectedFacets)) continue;
    const cur = brandMap.get(p.brand.slug) ?? { name: p.brand.name, count: 0 };
    cur.count++;
    brandMap.set(p.brand.slug, cur);
  }
  for (const slug of selectedBrands) {
    if (brandMap.has(slug)) continue;
    const secili = searched.find((p) => p.brand.slug === slug);
    if (secili) brandMap.set(slug, { name: secili.brand.name, count: 0 });
  }
  const brands = [...brandMap.entries()]
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  // 5) Facet seçenek sayımları — arama + marka uygulanmış, kendi grubu HARİÇ diğer facet'ler uygulanmış küme üzerinde
  const brandScoped = selectedBrands.length ? searched.filter((p) => selectedBrands.includes(p.brand.slug)) : searched;
  const facetGroupViews: FacetGroupView[] = groups.map((g) => {
    const otherFacets = Object.fromEntries(
      Object.entries(selectedFacets).filter(([k]) => k !== g.key),
    );
    const base = brandScoped.filter((p) =>
      productMatchesFacets(p.attributes as Record<string, unknown>, groups, otherFacets),
    );
    const eksikAttrs = g.naEtiketi
      ? searched.map((p) => p.attributes as Record<string, unknown>).filter((a) => a[g.attrKey] == null || a[g.attrKey] === "")
      : [];
    return {
      key: g.key,
      label: g.label,
      options: g.options.map((o) => ({
        value: o.value,
        label: o.value === "na" && g.naEtiketi ? g.naEtiketi(eksikAttrs) : o.label,
        count: base.filter((p) => o.match(p.attributes as Record<string, unknown>)).length,
      })),
    };
  });

  // 6) Nihai filtre — marka + facet
  const filtered = brandScoped.filter((p) =>
    productMatchesFacets(p.attributes as Record<string, unknown>, groups, selectedFacets),
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, (safePage - 1) * PAGE_SIZE + PAGE_SIZE);

  // 7) Puanlar + görseller + favoriler — sadece sayfadaki ürünler
  const pageIds = pageItems.map((p) => p.id);
  const scoreAggs = pageIds.length
    ? await prisma.review.groupBy({
        by: ["productId"],
        where: { status: "PUBLISHED", productId: { in: pageIds } },
        _avg: { scoreFiyat: true, scoreKalite: true, scorePerformans: true, scoreOverall: true },
        _count: { id: true },
      })
    : [];
  const scoreMap = new Map(
    scoreAggs.map((a) => [
      a.productId,
      {
        scoreFiyat:      a._avg.scoreFiyat      ?? 0,
        scoreKalite:     a._avg.scoreKalite     ?? 0,
        scorePerformans: a._avg.scorePerformans ?? 0,
        scoreOverall:    a._avg.scoreOverall    ?? 0,
      } as FikapeScores,
    ]),
  );

  const slugsNeedingWiki = pageItems.filter((p) => !p.imageUrl).map((p) => p.slug);
  const wikiUrls = slugsNeedingWiki.length > 0 ? await getVehicleImageUrls(slugsNeedingWiki) : {};

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  let favoritedIds = new Set<number>();
  if (isLoggedIn && pageIds.length) {
    const favs = await prisma.favorite.findMany({
      where: { userId: Number(session!.user!.id), productId: { in: pageIds } },
      select: { productId: true },
    });
    favoritedIds = new Set(favs.map((f) => f.productId));
  }

  // Ölçüm: yavaşlayan ya da büyüyen kategorileri erken görmek için (eşikler: 800 ms toplam, 1500 kayıt havuz)
  const toplamMs = gecen();
  if (toplamMs >= OLCUM_YAVAS_MS || pool.length >= OLCUM_BUYUK_HAVUZ) {
    console.warn(`[araclar-olcum] ${JSON.stringify({ kategori: catSlug ?? "tumu", havuz: pool.length, sonuc: total, havuzMs, toplamMs, arama: aramaVar })}`);
  }

  const activeFilterCount =
    selectedBrands.length + Object.values(selectedFacets).reduce((s, v) => s + v.length, 0);

  const baseParams: Record<string, string> = {};
  if (q.length >= 2) baseParams.q = q;

  function pageHref(target: number): string {
    const qs = new URLSearchParams();
    if (catSlug) qs.set("kategori", catSlug);
    if (selectedBrands.length) qs.set("marka", selectedBrands.join(","));
    if (q.length >= 2) qs.set("q", q);
    for (const [k, vals] of Object.entries(selectedFacets)) if (vals.length) qs.set(k, vals.join(","));
    if (target > 1) qs.set("sayfa", String(target));
    const s = qs.toString();
    return s ? `/araclar?${s}` : "/araclar";
  }

  const sayfaNumaralari = (liste: ReturnType<typeof sayfaListesi>) =>
    liste.map((o, i) =>
      o === "…" ? (
        <span key={`n${i}`} aria-hidden="true" className="inline-flex h-10 w-6 items-center justify-center text-gray-400">…</span>
      ) : o === safePage ? (
        <span
          key={o}
          aria-current="page"
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg bg-gray-900 px-3 font-bold text-white"
        >
          {o}
        </span>
      ) : (
        <Link
          key={o}
          href={`${pageHref(o)}#sonuclar`}
          aria-label={`Sayfa ${o}`}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 font-medium text-gray-700 hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          {o}
        </Link>
      ),
    );

  // Facet + marka temizlenmiş, arama/kategori korunmuş hedef
  const clearedHref = (() => {
    const qs = new URLSearchParams();
    if (catSlug) qs.set("kategori", catSlug);
    if (q.length >= 2) qs.set("q", q);
    const s = qs.toString();
    return s ? `/araclar?${s}` : "/araclar";
  })();

  // Öner kartına yalnız tek marka seçiliyse marka taşınır
  const seciliMarkaAdi = selectedBrands.length === 1 ? brands.find((b) => b.slug === selectedBrands[0])?.name : undefined;

  // Seçili filtreler: her biri kaldırılabilir etiket (chip). Sayfa numarası sıfırlanır; kategori ve arama korunur.
  const listeHref = (markalar: string[], facets: Record<string, string[]>): string => {
    const qs = new URLSearchParams();
    if (catSlug) qs.set("kategori", catSlug);
    if (markalar.length) qs.set("marka", markalar.join(","));
    if (q.length >= 2) qs.set("q", q);
    for (const [k, vals] of Object.entries(facets)) if (vals.length) qs.set(k, vals.join(","));
    const s = qs.toString();
    return s ? `/araclar?${s}` : "/araclar";
  };
  const aktifFiltreler = [
    ...selectedBrands.map((slug) => ({
      key: `marka:${slug}`,
      label: `Marka: ${brands.find((b) => b.slug === slug)?.name ?? slug}`,
      href: listeHref(selectedBrands.filter((x) => x !== slug), selectedFacets),
    })),
    ...facetGroupViews.flatMap((g) =>
      (selectedFacets[g.key] ?? []).map((v) => ({
        key: `${g.key}:${v}`,
        label: `${g.label}: ${g.options.find((o) => o.value === v)?.label ?? v}`,
        href: listeHref(selectedBrands, { ...selectedFacets, [g.key]: (selectedFacets[g.key] ?? []).filter((x) => x !== v) }),
      })),
    ),
  ];
  const durum = aramaSonucDurumu({ aramaVar, motorSayisi, benzer: fuzzy, filtreSonrasi: total });
  // Arama/filtre/sayfa varyantları dizine girmeyeceği için (noindex) liste verisi yalnız temel listede basılır.
  const jsonLdGoster = !aramaVar && safePage === 1 && activeFilterCount === 0;

  const itemListJson = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: pageItems.map((p, i) => ({
      "@type": "ListItem",
      position: (safePage - 1) * PAGE_SIZE + i + 1,
      url: `${BASE_URL}/araclar/${p.slug}`,
      name: `${p.brand.name} ${p.model.name}${p.year ? ` ${p.year}` : ""}`,
    })),
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <AraclarFilters
        categorySlug={catSlug}
        brands={brands}
        selectedBrands={selectedBrands}
        facetGroups={facetGroupViews}
        selectedFacets={selectedFacets}
        baseParams={baseParams}
        activeFilterCount={activeFilterCount}
      />

      <div id="sonuclar" className="min-w-0 flex-1 scroll-mt-28">
        {durum === "arama-benzer" && (
          <p role="status" className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-4">
            &ldquo;{q}&rdquo; için tam eşleşme bulunamadı — benzer sonuçları gösteriyoruz.
          </p>
        )}
        <div className="mb-5 space-y-3">
          <p className="text-sm text-gray-600" aria-live="polite">
            {durum === "arama-benzer" ? `${total} benzer sonuç` : `${total} araç`}
          </p>
          {aktifFiltreler.length > 0 && (
            <div role="group" aria-label="Seçili filtreler" className="flex flex-wrap items-center gap-2">
              {aktifFiltreler.map((f) => (
                <Link
                  key={f.key}
                  href={f.href}
                  scroll={false}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 text-white text-xs font-medium pl-3 pr-2.5 py-1.5 hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                >
                  {f.label}
                  <span aria-hidden="true" className="text-white/70">✕</span>
                  <span className="sr-only">filtresini kaldır</span>
                </Link>
              ))}
              {aktifFiltreler.length > 1 && pageItems.length > 0 && (
                <Link
                  href={clearedHref}
                  scroll={false}
                  className="text-xs font-semibold text-link hover:underline rounded px-1 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                >
                  Tümünü temizle
                </Link>
              )}
            </div>
          )}
        </div>

        {pageItems.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center">
            <p className="text-sm text-gray-500 mb-3">Bu filtrelerle eşleşen araç yok.</p>
            {activeFilterCount > 0 && (
              <Link href={clearedHref} className="text-sm font-semibold text-link hover:underline">
                Filtreleri temizle
              </Link>
            )}
          </div>
        ) : (
          <>
            {jsonLdGoster && <JsonLd data={itemListJson} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pageItems.map((product) => {
                const attrs = product.attributes as Record<string, unknown>;
                const catSlugCard = product.category?.slug ?? "otomobil";
                const imageUrl = product.imageUrl ?? wikiUrls[product.slug] ?? null;
                return (
                  <VehicleCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    brandName={product.brand.name}
                    modelName={product.model.name}
                    trimName={product.trimName ?? null}
                    year={product.year ?? null}
                    categorySlug={catSlugCard}
                    fuelType={String(attrs.fuel_type ?? "")}
                    bodyType={String(attrs.body_type ?? "")}
                    motorType={attrs.motor_type ? String(attrs.motor_type) : null}
                    karavanType={attrs.karavan_type ? String(attrs.karavan_type) : null}
                    motorWatt={attrs.motor_watt != null ? Number(attrs.motor_watt) : null}
                    transmission={attrs.transmission ? String(attrs.transmission) : null}
                    scores={scoreMap.get(product.id) ?? null}
                    imageUrl={imageUrl}
                    isLoggedIn={isLoggedIn}
                    initialFavorited={favoritedIds.has(product.id)}
                  />
                );
              })}
              {/* Her sayfanın son (18.) hücresi: sayfa dolu değilse listenin hemen sonu */}
              <SearchNoMatchPrompt query={aramaVar ? q : undefined} variant="grid-tail" kategori={catSlug} marka={seciliMarkaAdi} />
            </div>

            {totalPages > 1 && (
              <nav aria-label="Sayfalama" className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-sm">
                {safePage > 1 ? (
                  <Link
                    href={`${pageHref(safePage - 1)}#sonuclar`}
                    rel="prev"
                    aria-label="Önceki sayfa"
                    className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 font-semibold text-gray-700 hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                  >
                    <span aria-hidden="true">←</span><span className="hidden sm:inline">Önceki</span>
                  </Link>
                ) : (
                  <span aria-hidden="true" className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-gray-100 px-3 text-gray-300">
                    ←<span className="hidden sm:inline">Önceki</span>
                  </span>
                )}
                {/* Dar ekranda kompakt (1 … 4 … 7), geniş ekranda geniş pencere */}
                <span className="contents sm:hidden">{sayfaNumaralari(sayfaListesi(safePage, totalPages, 0))}</span>
                <span className="hidden sm:contents">{sayfaNumaralari(sayfaListesi(safePage, totalPages, 1))}</span>
                {safePage < totalPages ? (
                  <Link
                    href={`${pageHref(safePage + 1)}#sonuclar`}
                    rel="next"
                    aria-label="Sonraki sayfa"
                    className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 font-semibold text-gray-700 hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                  >
                    <span className="hidden sm:inline">Sonraki</span><span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <span aria-hidden="true" className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-gray-100 px-3 text-gray-300">
                    <span className="hidden sm:inline">Sonraki</span>→
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
