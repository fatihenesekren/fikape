"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { calcOverall, FIKAPE, SCORE_LABELS } from "@/lib/fikape";
import { validateDetailShort } from "@/lib/reviewValidation";
import { FUEL_ICONS, FUEL_LABELS, FUEL_COLORS } from "@/lib/fuel";
import { getChipsForCategory } from "@/lib/chips";
import { stripModelGenRange } from "@/lib/modelDisplay";
import {
  OWNERSHIP_MONTHS, EMPTY_TURKEY_SPECIFIC_VALUES, buildExtendedData,
  type TurkeySpecificValues,
} from "@/lib/reviewFormOptions";
import { SectionCard, FieldFeedback } from "@/components/review/FormPrimitives";
import { ScoreSelector } from "@/components/review/ScoreSelector";
import { ProConChipSelector } from "@/components/review/ProConChipSelector";
import { OwnershipUsageSection } from "@/components/review/OwnershipUsageSection";
import { TurkeySpecificSection } from "@/components/review/TurkeySpecificSection";
import { PhotoUploader } from "@/components/review/PhotoUploader";

// Kaynak veriye göre büyük/küçük harf tutarsız olabiliyor (Öner formu,
// admin manuel giriş, eski kayıtlar) — render anında ilk harfi büyütüyoruz,
// veriye dokunmuyoruz. İkon: manuel için 🕹️ (vites koluna benzer), diğerleri
// (Otomatik/CVT/Yarı Otomatik) için ⚙️.
function formatTransmission(t: string): { label: string; icon: string } {
  return {
    label: t.charAt(0).toUpperCase() + t.slice(1),
    icon: t.toLowerCase().includes("manuel") ? "🕹️" : "⚙️",
  };
}

const BODY_LABELS: Record<string, string> = {
  suv: "SUV", sedan: "Sedan", hatchback: "Hatchback",
  mpv: "MPV", pickup: "Pick-up", coupe: "Coupe",
};

interface Product {
  slug: string;
  name: string;
  brandName: string;
  modelName: string;
  trimName: string | null;
  year: number | null;
  imageUrl: string | null;
  fuelType: string | null;
  bodyType: string | null;
  transmission: string | null;
  categorySlug: string | null;
}

interface Props {
  products: Product[];
  defaultSlug?: string;
  reviewedSlugs?: string[];
}

export function ReviewForm({ products, defaultSlug, reviewedSlugs = [] }: Props) {
  const router = useRouter();

  // ── Araç arama ───────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    defaultSlug ? (products.find((p) => p.slug === defaultSlug) ?? null) : null
  );

  // Debounced arama — searchResults sadece fetch tamamlanınca güncellenir;
  // sorgu 2 karakterden kısayken gösterilecek liste render sırasında
  // türetiliyor (aşağıdaki visibleResults), effect içinde senkron setState
  // çağrısına gerek kalmıyor.
  useEffect(() => {
    if (searchQuery.length < 2) return;
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search/products?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setSearchResults(await res.json());
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const visibleResults = searchQuery.length < 2 ? [] : searchResults;

  // Dışarı tıklayınca dropdown kapansın
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSelectProduct(p: Product) {
    setSelectedProduct(p);
    setSearchQuery(`${p.brandName} ${stripModelGenRange(p.modelName)}${p.trimName ? ` · ${p.trimName}` : ""}${p.year ? ` (${p.year})` : ""}`);
    setDropdownOpen(false);
  }

  const productSlug = selectedProduct?.slug ?? "";
  const [scoreFiyat,      setScoreFiyat]      = useState(0);
  const [scoreKalite,     setScoreKalite]     = useState(0);
  const [scorePerformans, setScorePerformans] = useState(0);

  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [prevProductSlug, setPrevProductSlug] = useState(productSlug);
  const [detailText,    setDetailText]    = useState("");
  const [detailTouched, setDetailTouched] = useState(false);
  const [photoUrls,     setPhotoUrls]     = useState<string[]>([]);

  const [wouldRecommend, setWouldRecommend] = useState<"yes" | "maybe" | "no" | null>(null);
  const [ownershipSlot,  setOwnershipSlot]  = useState("");
  const [turkeySpecific, setTurkeySpecific] = useState<TurkeySpecificValues>(EMPTY_TURKEY_SPECIFIC_VALUES);

  function updateTurkeySpecific<K extends keyof TurkeySpecificValues>(key: K, value: TurkeySpecificValues[K]) {
    setTurkeySpecific((prev) => ({ ...prev, [key]: value }));
  }

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [mode,    setMode]    = useState<"quick" | "full">("quick");
  const isQuick = mode === "quick";

  // Chip listesini seçili araca göre hesapla
  const chips = getChipsForCategory(selectedProduct?.categorySlug ?? null);

  // Araç değişince chip seçimlerini sıfırla — React'ın "render sırasında
  // ayarla" deseni (bkz. react.dev/learn/you-might-not-need-an-effect):
  // effect + setState yerine önceki slug'ı takip edip render anında
  // sıfırlıyoruz, fazladan bir render turu olmuyor.
  if (productSlug !== prevProductSlug) {
    setPrevProductSlug(productSlug);
    setPros([]);
    setCons([]);
  }

  function togglePro(key: string) {
    setPros((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
    setCons((prev) => prev.filter((k) => k !== key));
  }

  function toggleCon(key: string) {
    setCons((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
    setPros((prev) => prev.filter((k) => k !== key));
  }

  const alreadyReviewed = productSlug ? reviewedSlugs.includes(productSlug) : false;
  const fuelType    = selectedProduct?.fuelType ?? null;
  const catSlug     = selectedProduct?.categorySlug ?? null;
  const isEscooter  = catSlug === "e-scooter";
  const isEbisiklet = catSlug === "e-bisiklet";
  const isEV        = fuelType === "EV" || isEscooter;
  const isCombustion = !isEV && ["GASOLINE", "DIESEL", "HYBRID"].includes(fuelType ?? "");
  const isGasoline  = fuelType === "GASOLINE";

  const scoresComplete = scoreFiyat > 0 && scoreKalite > 0 && scorePerformans > 0;
  const overall = scoresComplete ? calcOverall({ scoreFiyat, scoreKalite, scorePerformans }) : null;
  const detailValidation = validateDetailShort(detailText);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!productSlug)    { setError("Lütfen bir araç seçiniz."); return; }
    if (alreadyReviewed) { setError("Bu araç için zaten bir yorumun var."); return; }
    if (!scoresComplete) { setError("Lütfen tüm FI·KA·PE puanlarını veriniz."); return; }
    if (!isQuick) {
      if (pros.length < 1) { setError("En az 1 artı seçiniz."); return; }
      if (cons.length < 1) { setError("En az 1 eksi seçiniz."); return; }
      if (!detailValidation.ok) { setDetailTouched(true); setError(detailValidation.error!); return; }
    }

    const extended = isQuick
      ? {}
      : buildExtendedData(turkeySpecific, { isCombustion, isGasoline, isEV, isEscooter, isEbisiklet });

    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug, scoreFiyat, scoreKalite, scorePerformans,
        detailText:      isQuick ? "" : detailText,
        pros:             isQuick ? [] : pros,
        cons:             isQuick ? [] : cons,
        photoUrls:        isQuick ? undefined : (photoUrls.length ? photoUrls : undefined),
        wouldBuyAgain:    isQuick ? null : (wouldRecommend === "yes" ? true : wouldRecommend === "no" ? false : null),
        ownershipMonths:  isQuick ? null : (OWNERSHIP_MONTHS[ownershipSlot] ?? null),
        extendedData:     Object.keys(extended).length ? extended : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Bir hata oluştu."); return; }
    router.push(`/araclar/${productSlug}?yorum=gonderildi`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      <div>
        <h1 className="text-2xl font-black text-gray-900">Yorum yaz</h1>
        <p className="text-sm text-gray-500 mt-1">Deneyimini paylaş, diğer kullanıcılara yol göster.</p>
      </div>

      {defaultSlug && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
          <span>Aracınız eklendi ✓ — isterseniz deneyiminizi de paylaşabilirsiniz, zorunlu değil.</span>
          <Link
            href={`/araclar/${defaultSlug}`}
            className="shrink-0 text-xs font-semibold text-green-700 underline underline-offset-2 hover:text-green-800"
          >
            Şimdi değil, sonra yazarım →
          </Link>
        </div>
      )}

      <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
        <button
          type="button"
          onClick={() => setMode("quick")}
          className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors"
          style={mode === "quick" ? { background: "#111", color: "#fff" } : { color: "#6b7280" }}
        >
          ⚡ Hızlı Puanla
        </button>
        <button
          type="button"
          onClick={() => setMode("full")}
          className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors"
          style={mode === "full" ? { background: "#111", color: "#fff" } : { color: "#6b7280" }}
        >
          📝 Detaylı Yorum
        </button>
      </div>
      {isQuick && (
        <p className="text-xs text-gray-400 -mt-3">
          10 saniyede puanla — istersen sonra artı/eksi ekleyerek güçlendirebilirsin.
        </p>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* 1 — Araç */}
      <SectionCard step={1} title="Araç" badge="required">

        <div ref={searchRef} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedProduct(null); setDropdownOpen(true); }}
              onFocus={() => { if (!selectedProduct && searchQuery.length >= 2) setDropdownOpen(true); }}
              placeholder="Araç ara... örn: Clio, Yaris, Megane"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />

            {dropdownOpen && searchQuery.length >= 2 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {searchLoading && (
                  <div className="px-4 py-3 text-sm text-gray-400">Aranıyor...</div>
                )}
                {!searchLoading && visibleResults.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">Sonuç bulunamadı.</div>
                )}
                {!searchLoading && visibleResults.map((p) => {
                  const fc = p.fuelType ? (FUEL_COLORS[p.fuelType] ?? null) : null;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onMouseDown={() => handleSelectProduct(p)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="relative w-10 h-8 rounded-md bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {p.imageUrl
                          ? <Image src={p.imageUrl} alt={p.modelName} fill sizes="40px" className="object-cover" />
                          : <span className="text-base">🚗</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {p.brandName} {p.modelName}
                          {p.trimName && <span className="font-normal text-gray-400"> · {p.trimName}</span>}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {p.year && <span className="text-xs text-gray-400">{p.year}</span>}
                          {fc && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: fc.bg, color: fc.text }}>{FUEL_ICONS[p.fuelType!]} {FUEL_LABELS[p.fuelType!]}</span>}
                          {p.transmission && (() => {
                            const tr = formatTransmission(p.transmission);
                            return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{tr.icon} {tr.label}</span>;
                          })()}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onMouseDown={() => router.push("/oner?from=yorum-yaz")}
                  className="w-full px-4 py-3 text-sm font-semibold text-left text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
                >
                  {visibleResults.length === 0
                    ? <>+ &ldquo;{searchQuery}&rdquo; sistemde yok — araç öner</>
                    : <>Aradığın araç listede yok mu? + Araç öner</>}
                </button>
              </div>
            )}
        </div>

        {alreadyReviewed && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
            <span>⚠</span>
            <span>Bu araç için zaten bir yorumun var. Her araç için tek yorum yazılabilir.</span>
          </div>
        )}

        {selectedProduct && (
          <div className="flex gap-3 items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
              {selectedProduct.imageUrl
                ? <Image src={selectedProduct.imageUrl} alt={stripModelGenRange(selectedProduct.modelName)} fill sizes="96px" className="object-cover" />
                : <span className="text-2xl">🚗</span>}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {selectedProduct.brandName} {stripModelGenRange(selectedProduct.modelName)}
                {selectedProduct.trimName && <span className="font-normal text-gray-500"> · {selectedProduct.trimName}</span>}
              </p>
              {selectedProduct.year && <p className="text-xs text-gray-400">{selectedProduct.year}</p>}
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedProduct.fuelType && FUEL_LABELS[selectedProduct.fuelType] && (() => {
                  const fc = FUEL_COLORS[selectedProduct.fuelType!] ?? { bg: "#e5e7eb", text: "#374151" };
                  return (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: fc.bg, color: fc.text }}>
                      {FUEL_ICONS[selectedProduct.fuelType!]} {FUEL_LABELS[selectedProduct.fuelType!]}
                    </span>
                  );
                })()}
                {selectedProduct.bodyType && BODY_LABELS[selectedProduct.bodyType] && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                    {BODY_LABELS[selectedProduct.bodyType]}
                  </span>
                )}
                {selectedProduct.transmission && (() => {
                  const tr = formatTransmission(selectedProduct.transmission);
                  return (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {tr.icon} {tr.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* 2 — FI·KA·PE Puanı */}
      <SectionCard step={2} title="fi·ka·pe puanı" badge="required">
        {FIKAPE.map(({ key, short, label, color, bg }) => (
          <ScoreSelector
            key={key} short={short} label={label} color={color} bg={bg}
            value={key === "scoreFiyat" ? scoreFiyat : key === "scoreKalite" ? scoreKalite : scorePerformans}
            onChange={key === "scoreFiyat" ? setScoreFiyat : key === "scoreKalite" ? setScoreKalite : setScorePerformans}
          />
        ))}

        {overall !== null && (() => {
          const o = overall;
          const s = o >= 9 ? { color: "#14532d", bg: "#dcfce7" }
                  : o >= 7 ? { color: "#0C447C", bg: "#dbeafe" }
                  : o >= 5 ? { color: "#9a3412", bg: "#ffedd5" }
                  :          { color: "#991b1b", bg: "#fee2e2" };
          return (
            <div className="rounded-2xl px-6 py-5 text-center space-y-3" style={{ background: s.bg }}>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: s.color }}>fi·ka·pe puanı</p>
              <p className="text-7xl font-black leading-none tabular-nums" style={{ color: s.color }}>{o.toFixed(1)}</p>
              <div className="w-full max-w-xs mx-auto h-1.5 rounded-full overflow-hidden" style={{ background: `${s.color}22` }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(o / 10) * 100}%`, background: s.color }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: s.color }}>{SCORE_LABELS[Math.round(o)]}</p>
            </div>
          );
        })()}
      </SectionCard>

      {/* 3 — Artılar & Eksiler */}
      {!isQuick && (
      <SectionCard step={3} title="Artılar & Eksiler" badge="required">
        <p className="text-xs text-gray-400 -mt-2">
          Her kategoriden en az 1, en fazla 3 seçin.
        </p>

        <ProConChipSelector
          chips={chips}
          pros={pros}
          cons={cons}
          onTogglePro={togglePro}
          onToggleCon={toggleCon}
        />

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              Yorumun <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </p>
            <span className={`text-xs ${detailText.length >= 460 ? "text-orange-400" : "text-gray-400"}`}>
              {detailText.length}/500
            </span>
          </div>
          <textarea
            value={detailText}
            onChange={(e) => setDetailText(e.target.value.slice(0, 500))}
            onBlur={() => { if (detailText.trim()) setDetailTouched(true); }}
            rows={4}
            placeholder="Deneyimini birkaç cümleyle anlat..."
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none resize-none transition-colors"
            style={{ borderColor: detailTouched ? (detailValidation.ok ? "#86efac" : "#fca5a5") : "#e5e7eb" }}
          />
          {detailTouched && <FieldFeedback error={detailValidation.error} ok={detailValidation.ok} />}
        </div>

        <PhotoUploader
          removedExistingIds={[]}
          onToggleRemoveExisting={() => {}}
          newPhotoUrls={photoUrls}
          onNewPhotoUrlsChange={setPhotoUrls}
        />
      </SectionCard>
      )}

      {/* 4 — Sahiplik & Kullanım */}
      {!isQuick && (
      <SectionCard step={4} title="Sahiplik & Kullanım" badge="optional">
        <OwnershipUsageSection
          isEbisiklet={isEbisiklet}
          ownershipSlot={ownershipSlot}
          onOwnershipSlotChange={setOwnershipSlot}
          usageType={turkeySpecific.usageType}
          onUsageTypeChange={(v) => updateTurkeySpecific("usageType", v)}
          wouldRecommend={wouldRecommend}
          onWouldRecommendChange={setWouldRecommend}
        />
      </SectionCard>
      )}

      {/* 5 — Türkiye'ye Özel */}
      {!isQuick && (
      <SectionCard step={5} title="Türkiye'ye özel" badge="conditional">
        <p className="text-xs text-gray-400 -mt-2">
          Araç tipine göre sorular otomatik değişir. Hepsi opsiyoneldir.
        </p>

        <TurkeySpecificSection
          isCombustion={isCombustion}
          isGasoline={isGasoline}
          isEV={isEV}
          isEscooter={isEscooter}
          isEbisiklet={isEbisiklet}
          values={turkeySpecific}
          onChange={updateTurkeySpecific}
        />
      </SectionCard>
      )}

      <button
        type="submit"
        disabled={loading || alreadyReviewed}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60"
        style={{ background: "#111" }}
      >
        {loading ? "Gönderiliyor..." : isQuick ? "Hızlı Gönder →" : "Yorumu Gönder →"}
      </button>

      <p className="text-xs text-center text-gray-400">
        Yorumunuz moderasyon onayından sonra yayınlanacaktır.
      </p>

    </form>
  );
}
