"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { stripModelGenRange } from "@/lib/modelDisplay";

interface SearchResult {
  slug: string;
  name: string;
  year: number | null;
  modelName: string;
  brandName: string;
}

export function ComparePicker({ initial }: { initial: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/products?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function add(r: SearchResult) {
    if (selected.some((s) => s.slug === r.slug) || selected.length >= 4) return;
    const name = `${r.brandName} ${stripModelGenRange(r.modelName)}${r.year ? ` ${r.year}` : ""}`;
    setSelected([...selected, { slug: r.slug, name }]);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function remove(slug: string) {
    setSelected(selected.filter((s) => s.slug !== slug));
  }

  function compare() {
    if (selected.length < 2) return;
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
          <span className="text-xs text-gray-400">Karşılaştırmak için en az 2 araç ekle.</span>
        )}
      </div>

      {selected.length < 4 && (
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
                  {r.brandName} {r.modelName}{r.year ? ` ${r.year}` : ""}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={compare}
        disabled={selected.length < 2}
        className="mt-3 text-sm font-semibold px-4 py-2 rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors disabled:opacity-40"
      >
        Karşılaştır ({selected.length})
      </button>
    </div>
  );
}
