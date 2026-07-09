"use client";

import { useMemo, useState } from "react";
import { SpecForm } from "@/components/admin/SpecForm";
import { SPEC_FIELDS } from "@/lib/specFields";

interface Product {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  attributes: Record<string, unknown>;
}

function toStringAttrs(attrs: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attrs).map(([k, v]) => [k, v == null ? "" : String(v)])
  );
}

function filledCount(categorySlug: string, attrs: Record<string, unknown>): { filled: number; total: number } {
  const fields = SPEC_FIELDS[categorySlug] ?? [];
  const filled = fields.filter((f) => attrs[f.key] !== undefined && attrs[f.key] !== null && attrs[f.key] !== "").length;
  return { filled, total: fields.length };
}

function ProductRow({ product, onSaved }: { product: Product; onSaved: (slug: string, attrs: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [attrs, setAttrs] = useState<Record<string, string>>(toStringAttrs(product.attributes));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { filled, total } = filledCount(product.categorySlug, product.attributes);

  function handleChange(key: string, value: string) {
    setSaved(false);
    setAttrs((prev) => {
      const next = { ...prev };
      if (value === "") delete next[key];
      else next[key] = value;
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${product.slug}/attributes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: attrs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Bir hata oluştu");
      setSaved(true);
      onSaved(product.slug, data.attributes ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="min-w-0">
          <div className="text-xs text-gray-400 font-mono mb-0.5">{product.slug}</div>
          <div className="text-sm font-semibold text-gray-900 truncate">{product.name}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              filled === 0
                ? "bg-gray-100 text-gray-400"
                : filled === total
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {filled}/{total}
          </span>
          <span className="text-gray-300">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          <SpecForm categorySlug={product.categorySlug} attrs={attrs} onChange={handleChange} />
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            {saved && <span className="text-xs text-green-600">✓ Kaydedildi</span>}
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export function UrunlerClient({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Map<string, string>();
    for (const p of initialProducts) if (p.categorySlug) set.set(p.categorySlug, p.categoryName);
    return [...set.entries()];
  }, [initialProducts]);

  const filtered = products.filter((p) => {
    if (category !== "all" && p.categorySlug !== category) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    return true;
  });

  function handleSaved(slug: string, attrs: Record<string, unknown>) {
    setProducts((prev) => prev.map((p) => (p.slug === slug ? { ...p, attributes: attrs } : p)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Araç ara..."
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 flex-1 min-w-[160px]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400"
        >
          <option value="all">Tüm kategoriler</option>
          {categories.map(([slug, name]) => (
            <option key={slug} value={slug}>{name}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} araç</span>
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <ProductRow key={p.slug} product={p} onSaved={handleSaved} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">Sonuç bulunamadı.</p>
        )}
      </div>
    </div>
  );
}
