"use client";

import { useState, useRef } from "react";
import { BlurEditor } from "../yorumlar/BlurEditor";

interface Product {
  slug: string;
  name: string;
  imageUrl: string | null;
  kredi: { yazar: string; lisans: string; lisansUrl?: string | null; kaynakUrl?: string | null } | null;
  atifOtomatik: boolean;
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
  const [blurringSlug, setBlurringSlug] = useState<string | null>(null);
  const [onlyNoCredit, setOnlyNoCredit] = useState(false);
  const [krediler, setKrediler] = useState<Record<string, Product["kredi"]>>(Object.fromEntries(products.map((p) => [p.slug, p.kredi])));
  const [atifAcik, setAtifAcik] = useState<string | null>(null);
  const [atifForm, setAtifForm] = useState({ yazar: "", lisans: "", lisansUrl: "", kaynakUrl: "" });
  const [atifMesaj, setAtifMesaj] = useState<string | null>(null);

  const q = query.trim().toLocaleLowerCase("tr-TR");
  const filtered = products.filter((p) => {
    if (onlyMissing && states[p.slug]?.url) return false;
    if (onlyNoCredit && (!states[p.slug]?.url || krediler[p.slug] || p.atifOtomatik)) return false;
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
      // API artık her yüklemede ?v= sürüm parametresiyle tekilleştirilmiş bir URL
      // döndürüyor (bkz. api/.../image/route.ts) — burada ayrıca cache-bust
      // eklemeye gerek yok, DB'ye kaydedilenle admin'in gördüğü artık aynı URL.
      setStates((s) => ({ ...s, [slug]: { loading: false, url: data.imageUrl, error: null } }));
      setUrlInputs((u) => ({ ...u, [slug]: data.imageUrl }));
      setKrediler((k) => ({ ...k, [slug]: data.kredi ?? null }));
    } catch (e) {
      setStates((s) => ({ ...s, [slug]: { ...s[slug], loading: false, error: String(e) } }));
    }
  }

  async function atifKaydet(slug: string, otomatik: boolean) {
    setAtifMesaj(null);
    const res = await fetch(`/api/admin/products/${slug}/image/credit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(otomatik ? { otomatik: true, kaynakUrl: atifForm.kaynakUrl } : atifForm),
    });
    const data = await parseJson(res);
    if (!res.ok) { setAtifMesaj(data.error ?? `HTTP ${res.status}`); return; }
    setKrediler((k) => ({ ...k, [slug]: data.kredi }));
    setAtifAcik(null);
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
      setKrediler((k) => ({ ...k, [slug]: data.kredi ?? null }));
    } catch (e) {
      setStates((s) => ({ ...s, [slug]: { ...s[slug], loading: false, error: String(e) } }));
    }
  }

  return (
    <div className="space-y-4">
      {blurringSlug && states[blurringSlug]?.url && (
        <BlurEditor
          productSlug={blurringSlug}
          url={states[blurringSlug]!.url!}
          onSave={(newUrl) => {
            setStates((s) => ({ ...s, [blurringSlug]: { ...s[blurringSlug], loading: false, url: newUrl } }));
            setUrlInputs((u) => ({ ...u, [blurringSlug]: newUrl }));
            setBlurringSlug(null);
          }}
          onClose={() => setBlurringSlug(null)}
        />
      )}
      {/* flex-wrap + min-w-0: dar ekranda arama kutusu + checkbox + sayaç yan
          yana sığmıyordu, metin kesilip taşıyordu (bkz. kullanıcı geri
          bildirimi, ekran görüntüsü — bilinen mobil taşma hata sınıfı). */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm py-3 -mx-1 px-1 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="relative w-full sm:w-auto sm:flex-1 min-w-0">
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
        <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap select-none">
          <input type="checkbox" checked={onlyNoCredit} onChange={(e) => setOnlyNoCredit(e.target.checked)} />
          Atıf eksik
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
            {/* Mobilde görsel üstte tam genişlikte (aspect-ratio), kontroller
                altta; sm: ve üstünde yan yana. Önceden sabit w-40 h-28 görsel
                + esnek olmayan (min-w-0'sız, wrap'siz) kontrol satırları dar
                ekranda metni kesip taşırıyordu (bkz. kullanıcı geri bildirimi,
                ekran görüntüsü — bilinen mobil taşma hata sınıfı). */}
            <div className="flex flex-col sm:flex-row gap-0">
              {/* Görsel önizleme */}
              <div className="w-full aspect-[16/10] sm:w-40 sm:h-28 sm:aspect-auto shrink-0 bg-gray-50 sm:border-r border-b sm:border-b-0 border-gray-100 relative overflow-hidden">
                {st.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={st.url}
                    alt={product.name}
                    loading="lazy"
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
              <div className="flex-1 min-w-0 p-4 flex flex-col justify-center gap-3">
                <div>
                  <div className="text-xs text-gray-400 font-mono mb-0.5 break-all">{product.slug}</div>
                  <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                </div>

                {/* URL paste */}
                <div className="flex flex-wrap gap-2">
                  <input
                    type="url"
                    value={urlInputs[product.slug] ?? ""}
                    onChange={(e) => setUrlInputs((u) => ({ ...u, [product.slug]: e.target.value }))}
                    placeholder="Görsel URL'si yapıştır..."
                    className="flex-1 min-w-[140px] text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={() => saveUrl(product.slug)}
                    disabled={st.loading}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-40 hover:bg-gray-700 transition-colors"
                  >
                    Kaydet
                  </button>
                </div>

                {/* Dosya yükle */}
                <div className="flex flex-wrap items-center gap-2">
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
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-medium disabled:opacity-40 hover:border-gray-400 transition-colors"
                  >
                    Dosya Yükle
                  </button>
                  {st.url && (
                    <button
                      onClick={() => setBlurringSlug(product.slug)}
                      disabled={st.loading}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-medium disabled:opacity-40 hover:border-gray-400 transition-colors"
                    >
                      Bulanıklaştır
                    </button>
                  )}
                  <span className="text-xs text-gray-400 whitespace-nowrap">JPG/PNG/WebP, maks 5MB</span>
                </div>

                {st.url && (
                  <div className="text-xs">
                    {krediler[product.slug] ? (
                      <p className="text-gray-500 break-words">Atıf: {krediler[product.slug]!.yazar} · {krediler[product.slug]!.lisans}</p>
                    ) : product.atifOtomatik ? (
                      <p className="text-gray-400">Atıf: Commons adresinden otomatik gösterilir</p>
                    ) : (
                      <p className="text-amber-700">Atıf eksik — yazar/lisans girin</p>
                    )}
                    <button
                      type="button"
                      onClick={() => { setAtifAcik(atifAcik === product.slug ? null : product.slug); setAtifMesaj(null); setAtifForm({ yazar: krediler[product.slug]?.yazar ?? "", lisans: krediler[product.slug]?.lisans ?? "", lisansUrl: krediler[product.slug]?.lisansUrl ?? "", kaynakUrl: krediler[product.slug]?.kaynakUrl ?? "" }); }}
                      className="underline text-gray-600"
                    >
                      {atifAcik === product.slug ? "Kapat" : "Atıf bilgisini düzenle"}
                    </button>
                    {atifAcik === product.slug && (
                      <div className="mt-2 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <input value={atifForm.kaynakUrl} onChange={(e) => setAtifForm((f) => ({ ...f, kaynakUrl: e.target.value }))} placeholder="Kaynak adresi (Commons dosya sayfası: …/wiki/File:Ad.jpg)" className="w-full px-3 py-1.5 rounded-lg border border-gray-200" />
                        <button type="button" onClick={() => void atifKaydet(product.slug, true)} className="px-3 py-1.5 rounded-lg border border-gray-300 font-medium">Commons&apos;tan otomatik çek</button>
                        <p className="text-gray-400">veya elle girin:</p>
                        <input value={atifForm.yazar} onChange={(e) => setAtifForm((f) => ({ ...f, yazar: e.target.value }))} placeholder="Yazar / fotoğrafçı / kurum" maxLength={200} className="w-full px-3 py-1.5 rounded-lg border border-gray-200" />
                        <input value={atifForm.lisans} onChange={(e) => setAtifForm((f) => ({ ...f, lisans: e.target.value }))} placeholder="Lisans (örn. CC BY-SA 4.0, Basın kiti)" maxLength={80} className="w-full px-3 py-1.5 rounded-lg border border-gray-200" />
                        <input value={atifForm.lisansUrl} onChange={(e) => setAtifForm((f) => ({ ...f, lisansUrl: e.target.value }))} placeholder="Lisans adresi (https, isteğe bağlı)" className="w-full px-3 py-1.5 rounded-lg border border-gray-200" />
                        <button type="button" onClick={() => void atifKaydet(product.slug, false)} className="px-3 py-1.5 rounded-lg bg-gray-900 text-white font-semibold">Kaydet</button>
                        {atifMesaj && <p className="text-red-500 break-words">{atifMesaj}</p>}
                      </div>
                    )}
                  </div>
                )}

                {st.error && (
                  <p className="text-xs text-red-500 break-words">{st.error}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
