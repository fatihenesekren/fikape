"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface BrandItem {
  slug: string;
  name: string;
  count: number;
}

export interface FacetOptionView {
  value: string;
  label: string;
  count: number;
}

export interface FacetGroupView {
  key: string;
  label: string;
  options: FacetOptionView[];
}

interface Props {
  categorySlug?: string;
  brands: BrandItem[];
  selectedBrand?: string;
  facetGroups: FacetGroupView[];
  selectedFacets: Record<string, string[]>;
  // kategori/marka/facet dışındaki korunacak paramlar (q gibi)
  baseParams: Record<string, string>;
  activeFilterCount: number;
}

function buildHref(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `/araclar?${s}` : "/araclar";
}

export function AraclarFilters({
  categorySlug,
  brands,
  selectedBrand,
  facetGroups,
  selectedFacets,
  baseParams,
  activeFilterCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");

  const common: Record<string, string | undefined> = {
    ...baseParams,
    ...(categorySlug ? { kategori: categorySlug } : {}),
  };

  const facetParams: Record<string, string | undefined> = {};
  for (const [k, vals] of Object.entries(selectedFacets)) {
    if (vals.length) facetParams[k] = vals.join(",");
  }

  const clearedHref = buildHref(common);

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLocaleLowerCase("tr-TR");
    if (!q) return brands;
    return brands.filter((b) => b.name.toLocaleLowerCase("tr-TR").includes(q));
  }, [brands, brandQuery]);

  function facetToggleHref(groupKey: string, value: string): string {
    const current = selectedFacets[groupKey] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const nextFacetParams = { ...facetParams };
    if (next.length) nextFacetParams[groupKey] = next.join(",");
    else delete nextFacetParams[groupKey];
    return buildHref({ ...common, marka: selectedBrand, ...nextFacetParams });
  }

  const panel = (
    <div className="space-y-6">
      {/* Marka listesi */}
      {brands.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Marka</p>
            {selectedBrand && (
              <Link
                href={buildHref({ ...common, ...facetParams })}
                className="text-[11px] font-semibold text-link hover:underline"
              >
                Temizle
              </Link>
            )}
          </div>
          {brands.length > 12 && (
            <input
              type="text"
              value={brandQuery}
              onChange={(e) => setBrandQuery(e.target.value)}
              placeholder="Marka ara"
              className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 mb-2 focus:outline-none focus:border-gray-400"
            />
          )}
          <div className="max-h-72 overflow-y-auto -mr-1 pr-1 space-y-0.5">
            {filteredBrands.map((b) => {
              const isActive = selectedBrand === b.slug;
              return (
                <Link
                  key={b.slug}
                  href={
                    isActive
                      ? buildHref({ ...common, ...facetParams })
                      : buildHref({ ...common, marka: b.slug, ...facetParams })
                  }
                  scroll={false}
                  className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  <span className={`text-xs shrink-0 ${isActive ? "text-white/60" : "text-gray-400"}`}>
                    {b.count}
                  </span>
                </Link>
              );
            })}
            {filteredBrands.length === 0 && (
              <p className="text-xs text-gray-400 px-2.5 py-2">Eşleşen marka yok.</p>
            )}
          </div>
        </div>
      )}

      {/* Facet grupları */}
      {facetGroups.map((g) => (
        <div key={g.key}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{g.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {g.options.map((o) => {
              const isActive = (selectedFacets[g.key] ?? []).includes(o.value);
              const disabled = o.count === 0 && !isActive;
              if (disabled) return null;
              return (
                <Link
                  key={o.value}
                  href={facetToggleHref(g.key, o.value)}
                  scroll={false}
                  className={`text-xs font-medium rounded-full px-2.5 py-1 border transition-colors ${
                    isActive
                      ? "bg-link-deep text-white border-link"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {o.label}
                  <span className={isActive ? "text-white/60 ml-1" : "text-gray-400 ml-1"}>{o.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {activeFilterCount > 0 && (
        <Link
          href={clearedHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <span aria-hidden="true">✕</span> Tüm filtreleri temizle
        </Link>
      )}
    </div>
  );

  return (
    <>
      {/* Mobil — açılır panel */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700"
        >
          Filtrele
          {activeFilterCount > 0 && (
            <span className="text-[11px] font-bold bg-link-soft text-link rounded-full px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
          <span aria-hidden="true" className="text-gray-400">{open ? "▲" : "▼"}</span>
        </button>
        {open && <div className="mt-3 rounded-xl border border-gray-100 bg-white p-4">{panel}</div>}
      </div>

      {/* Masaüstü — sol sütun */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-32">{panel}</div>
      </aside>
    </>
  );
}
