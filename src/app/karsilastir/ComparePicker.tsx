"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { stripModelGenRange, splitTrimName } from "@/lib/modelDisplay";
import { MAX_COMPARE_ITEMS, MIN_COMPARE_ITEMS } from "@/lib/compare/constants";

interface SearchResult {
  slug: string;
  name: string;
  year: number | null;
  modelName: string;
  brandName: string;
  trimName: string | null;
  categorySlug: string | null;
  categoryName: string | null;
}

interface SelectedItem {
  slug: string;
  name: string;
  categorySlug: string | null;
  categoryName?: string | null;
}

export function ComparePicker({ initial }: { initial: SelectedItem[] }) {
  const router = useRouter();
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
    const name = `${r.brandName} ${splitTrimName(r.trimName)?.version ?? stripModelGenRange(r.modelName)}${r.year ? ` ${r.year}` : ""}`;
    setSelected([...selected, { slug: r.slug, name, categorySlug: r.categorySlug, categoryName: r.categoryName }]);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function remove(slug: string) {
    setSelected(selected.filter((s) => s.slug !== slug));
  }

  function compare() {
    if (selected.length < MIN_COMPARE_ITEMS) return;
    router.push(`/karsilastir?urunler=${selected.map((s) => s.slug).join(",")}`);
  }

  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-5 mb-8">
      <div className="flex flex-wrap gap-2 mb-3">
        {selected.map((s) => (
          <span key={s.slug} className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full px-3 py-1.5">
            {s.name}
            <button onClick={() => remove(s.slug)} className="text-gray-400 hover:text-gray-700" aria-label={`${s.name} kaldır`}>✕</button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-gray-400">Karşılaştırmak için en az {MIN_COMPARE_ITEMS} araç ekle.</span>
        )}
      </div>

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
              {results.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => add(r)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40"
                  disabled={selected.some((s) => s.slug === r.slug)}
                >
                  {r.brandName} {splitTrimName(r.trimName)?.version ?? r.modelName}{r.year ? ` ${r.year}` : ""}
                </button>
              ))}
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
