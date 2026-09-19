"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { MAX_COMPARE_ITEMS, MIN_COMPARE_ITEMS } from "@/lib/compare/constants";
import { FUEL_LABELS } from "@/lib/fuel";
import { formatCompareVehicleName } from "@/lib/compare/formatCompareVehicleName";

interface SearchResult {
  slug: string;
  name: string;
  year: number | null;
  modelName: string;
  brandName: string;
  trimName: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  fuelType: string | null;
  transmission: string | null;
}

interface SelectedItem {
  slug: string;
  name: string;
  categorySlug: string | null;
  categoryName?: string | null;
}

interface SuggestedItem {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  reviewCount: number;
}

export function ComparePicker({ initial, suggestions = [] }: { initial: SelectedItem[]; suggestions?: SuggestedItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  // Zaten bir karşılaştırma sonucu sayfasındaysak (/karsilastir/slug1-vs-slug2)
  // kaldırma işlemi aşağıdaki tabloyu da anında güncellemeli — boş seçici
  // sayfasında (/karsilastir) güncellenecek bir sonuç yok, sadece local state yeterli.
  const isResultsPage = pathname !== "/karsilastir";
  const [selected, setSelected] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // İlk araç seçildikten sonra arama o aracın kategorisiyle sınırlanır — farklı
  // kategoriden araç (örn. otomobil vs motosiklet) karşılaştırmaya eklenemesin diye.
  const lockedCategorySlug = selected[0]?.categorySlug ?? null;
  const lockedCategoryName = selected[0]?.categoryName ?? null;
  const visibleSuggestions = suggestions.filter((s) => !selected.some((x) => x.slug === s.slug));

  useEffect(() => {
    if (query.length < 2) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (lockedCategorySlug) params.set("category", lockedCategorySlug);
        const res = await fetch(`/api/search/products?${params.toString()}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, lockedCategorySlug]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function add(r: SearchResult) {
    if (selected.some((s) => s.slug === r.slug) || selected.length >= MAX_COMPARE_ITEMS) return;
    if (lockedCategorySlug && r.categorySlug !== lockedCategorySlug) return;
    const name = `${r.brandName} ${formatCompareVehicleName(r.modelName, r.trimName).fullLabel}${r.year ? ` ${r.year}` : ""}`;
    setSelected([...selected, { slug: r.slug, name, categorySlug: r.categorySlug, categoryName: r.categoryName }]);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function remove(slug: string) {
    const next = selected.filter((s) => s.slug !== slug);
    setSelected(next);
    if (isResultsPage) {
      if (next.length >= MIN_COMPARE_ITEMS) {
        router.push(`/karsilastir/${next.map((s) => s.slug).join("-vs-")}`);
      } else if (next.length === 1) {
        // Tek slug'lı ama geçerli bir /karsilastir/[comparison] route'u — sonuç
        // tablosu (products.length < 2 olduğu için) gizli kalır ama kalan tek
        // araç chip'te durmaya devam eder, boş sayfaya dönüp onu da SİLMEZ
        // (bkz. kullanıcı geri bildirimi: "2 araçtan 1'e düşünce kalanı da siliyor").
        router.push(`/karsilastir/${next[0].slug}`);
      } else {
        router.push("/karsilastir");
      }
    }
  }

  function addSuggested(s: SuggestedItem) {
    if (selected.some((x) => x.slug === s.slug) || selected.length >= MAX_COMPARE_ITEMS) return;
    setSelected([...selected, { slug: s.slug, name: s.name, categorySlug: s.categorySlug, categoryName: s.categoryName }]);
  }

  function removeAll() {
    setSelected([]);
    if (isResultsPage) router.push("/karsilastir");
  }

  function compare() {
    if (selected.length < MIN_COMPARE_ITEMS) return;
    router.push(`/karsilastir/${selected.map((s) => s.slug).join("-vs-")}`);
  }

  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-5 mb-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {selected.map((s) => (
          <span key={s.slug} className="flex flex-wrap max-w-full items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full px-3 py-1.5">
            {s.name}
            <button onClick={() => remove(s.slug)} className="text-gray-400 hover:text-gray-700" aria-label={`${s.name} kaldır`}>✕</button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-gray-400">Karşılaştırmak için en az {MIN_COMPARE_ITEMS} araç ekle.</span>
        )}
        {selected.length > 0 && (
          <button onClick={removeAll} className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
            Tümünü kaldır
          </button>
        )}
      </div>

      {/* Öneri pill'leri artık sadece boşken değil, slot kaldığı sürece (1-3
          araç seçiliyken de) görünmeye devam ediyor — ilk aracı öneriden
          seçen kullanıcı ikinci/üçüncü aracı da yine tek tıkla ekleyebilsin
          diye (bkz. kullanıcı geri bildirimi: önce seçilince öneriler
          kayboluyor, tekrar elle aramak gerekiyordu). Zaten seçili bir araç
          listeden filtrelenir (iki kez gösterilmesin). Seçili gerçek chip'ler
          varken aralarına ince bir ayırıcı çizgi konur — ikisi görsel olarak
          karışmasın diye "soluk öneri" ile "gerçek seçim" ayrışık kalır.
          Arama kutusuna odaklanınca (open=true) hâlâ kaybolur. */}
      {!open && selected.length < MAX_COMPARE_ITEMS && visibleSuggestions.length > 0 && (
        <div className={`flex flex-wrap items-center gap-2 mb-3 ${selected.length > 0 ? "pt-3 border-t border-gray-100" : ""}`}>
          <span className="text-xs text-gray-400">Popüler:</span>
          {visibleSuggestions.map((s) => (
            <button
              key={s.slug}
              onClick={() => addSuggested(s)}
              className="text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {s.name} <span className="font-normal text-gray-400">({s.reviewCount} yorum)</span>
            </button>
          ))}
        </div>
      )}

      {lockedCategoryName && selected.length < MAX_COMPARE_ITEMS && (
        <p className="text-xs text-gray-400 mb-2">
          Arama <span className="font-semibold text-gray-600">{lockedCategoryName}</span> kategorisiyle sınırlı.
        </p>
      )}

      {selected.length < MAX_COMPARE_ITEMS && (
        <div ref={boxRef} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Araç ara ve ekle..."
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2"
          />
          {open && query.length >= 2 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {loading && <div className="px-3 py-2 text-xs text-gray-400">Aranıyor...</div>}
              {!loading && results.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400">Sonuç yok.</div>
              )}
              {results.map((r) => {
                const fuelLabel = r.fuelType ? (FUEL_LABELS[r.fuelType] ?? r.fuelType) : null;
                const meta = [fuelLabel, r.transmission].filter(Boolean).join(" · ");
                return (
                  <button
                    key={r.slug}
                    onClick={() => add(r)}
                    className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
                    disabled={selected.some((s) => s.slug === r.slug)}
                  >
                    <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-gray-50">
                      {r.imageUrl && (
                        <Image src={r.imageUrl} alt="" fill className="object-contain" sizes="40px" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate">
                        {r.brandName} {formatCompareVehicleName(r.modelName, r.trimName).fullLabel}{r.year ? ` ${r.year}` : ""}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 truncate">
                        {r.categoryName && <span>{r.categoryName}</span>}
                        {r.categoryName && meta && <span>·</span>}
                        {meta && <span>{meta}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <button
        onClick={compare}
        disabled={selected.length < MIN_COMPARE_ITEMS}
        className="mt-3 text-sm font-semibold px-4 py-2 rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-40"
      >
        Karşılaştır ({selected.length})
      </button>
    </div>
  );
}
