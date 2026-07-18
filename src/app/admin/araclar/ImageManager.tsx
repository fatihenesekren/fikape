"use client";

import { useState, useRef } from "react";

interface Product {
  slug: string;
  name: string;
  imageUrl: string | null;
}

export function ImageManager({ products, initialOnlyMissing = false }: { products: Product[]; initialOnlyMissing?: boolean }) {
  const [states, setStates] = useState<Record<string, { loading: boolean; url: string | null; error: string | null }>>(
    Object.fromEntries(products.map((p) => [p.slug, { loading: false, url: p.imageUrl, error: null }]))
  );
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>(
    Object.fromEntries(products.map((p) => [p.slug, p.imageUrl ?? ""]))
  );
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [query, setQuery] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(initialOnlyMissing);

  const q = query.trim().toLocaleLowerCase("tr-TR");
  const filtered = products.filter((p) => {
    if (onlyMissing && states[p.slug]?.url) return false;
    if (q && !p.name.toLocaleLowerCase("tr-TR").includes(q) && !p.slug.includes(q)) return false;
    return true;
  });

  async function parseJson(res: Response) {
    const text = await res.text();
    if (!text) return {};
    try { return JSON.parse(text); } catch { return { error: `Sunucu yanıtı okunamadı (${res.status})` }; }
  }

  async function uploadFile(slug: string, file: File) {
    setStates((s) => ({ ...s, [slug]: { ...s[slug], loading: true, error: null } }));
    const form = new FormData();
    form.append("image", file);
    try {
      const res = await fetch(`/api/admin/products/${slug}/image`, { method: "POST", body: form });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      const busted = `${data.imageUrl}?t=${Date.now()}`;
      setStates((s) => ({ ...s, [slug]: { loading: false, url: busted, error: null } }));
      setUrlInputs((u) => ({ ...u, [slug]: data.imageUrl }));
    } catch (e) {
      setStates((s) => ({ ...s, [slug]: { ...s[slug], loading: false, error: String(e) } }));
    }
  }

  async function saveUrl(slug: string) {
    const imageUrl = urlInputs[slug]?.trim();
    if (!imageUrl) return;
    setStates((s) => ({ ...s, [slug]: { ...s[slug], loading: true, error: null } }));
    try {
      const res = await fetch(`/api/admin/products/${slug}/image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStates((s) => ({ ...s, [slug]: { loading: false, url: data.imageUrl, error: null } }));
    } catch (e) {
      setStates((s) => ({ ...s, [slug]: { ...s[slug], loading: false, error: String(e) } }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm py-3 -mx-1 px-1 flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Marka veya model ara..."
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-gray-400"
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap select-none">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(e) => setOnlyMissing(e.target.checked)}
          />
          Sadece görselsizler
        </label>
        <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} sonuç</span>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-10">Sonuç bulunamadı.</p>
      )}

      {filtered.map((product) => {
        const st = states[product.slug];
        return (
          <div
            key={product.slug}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="flex gap-0">
              {/* Görsel önizleme */}
              <div className="w-40 h-28 flex-shrink-0 bg-gray-50 border-r border-gray-100 relative overflow-hidden">
                {st.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={st.url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                    📷
                  </div>
                )}
                {st.loading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Kontroller */}
              <div className="flex-1 p-4 flex flex-col justify-center gap-3">
                <div>
                  <div className="text-xs text-gray-400 font-mono mb-0.5">{product.slug}</div>
                  <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                </div>

                {/* URL paste */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInputs[product.slug] ?? ""}
                    onChange={(e) => setUrlInputs((u) => ({ ...u, [product.slug]: e.target.value }))}
                    placeholder="Görsel URL'si yapıştır..."
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={() => saveUrl(product.slug)}
                    disabled={st.loading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-40 hover:bg-gray-700 transition-colors"
                  >
                    Kaydet
                  </button>
                </div>

                {/* Dosya yükle */}
                <div className="flex items-center gap-2">
                  <input
                    ref={(el) => { fileRefs.current[product.slug] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFile(product.slug, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => fileRefs.current[product.slug]?.click()}
                    disabled={st.loading}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-medium disabled:opacity-40 hover:border-gray-400 transition-colors"
                  >
                    Dosya Yükle
                  </button>
                  <span className="text-xs text-gray-400">JPG/PNG/WebP, maks 5MB</span>
                </div>

                {st.error && (
                  <p className="text-xs text-red-500">{st.error}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
