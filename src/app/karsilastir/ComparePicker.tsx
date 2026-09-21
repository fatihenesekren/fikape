"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { MAX_COMPARE_ITEMS, MIN_COMPARE_ITEMS } from "@/lib/compare/constants";
import { FUEL_LABELS } from "@/lib/fuel";
import { formatCompareVehicleName } from "@/lib/compare/formatCompareVehicleName";
import { useSpeechToText } from "@/hooks/useSpeechToText";

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
  const {
    status: speechStatus,
    interimTranscript: speechInterim,
    errorMessage: speechError,
    start: startSpeech,
    stop: stopSpeech,
    abort: abortSpeech,
    supported: speechSupported,
  } = useSpeechToText();

  // Sesli girişte "final" parça (isFinal) araya girdikçe query'ye kalıcı olarak
  // eklenir; interimTranscript ise henüz kesinleşmemiş kısmı anlık gösterir —
  // ikisi birleştirilip hem input'ta hem arama sorgusunda kullanılır, böylece
  // kullanıcı konuşurken kutu ve sonuçlar aynı anda dolar (kayıt-sonra-yaz değil).
  const displayQuery = speechStatus === "listening" && speechInterim
    ? `${query}${query && !query.endsWith(" ") ? " " : ""}${speechInterim}`
    : query;

  // Son "final" parça için henüz denenmemiş alternatif transkriptler — arama
  // 0 sonuç dönerse ("Togg" yerine "Tok" gibi yanlış algılamalarda) sırayla
  // bir sonraki adayı deneriz, hepsi tükenirse mikrofonu durdururuz.
  const voiceBaseRef = useRef("");
  const voiceAltsRef = useRef<string[]>([]);
  const voiceAltIndexRef = useRef(0);

  function handleVoiceFinalTranscript(text: string, alternatives: string[]) {
    setQuery((prev) => {
      voiceBaseRef.current = prev;
      voiceAltsRef.current = alternatives.length ? alternatives : [text];
      voiceAltIndexRef.current = 0;
      return `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${text}`.trimStart();
    });
    setOpen(true);
  }

  // İlk araç seçildikten sonra arama o aracın kategorisiyle sınırlanır — farklı
  // kategoriden araç (örn. otomobil vs motosiklet) karşılaştırmaya eklenemesin diye.
  const lockedCategorySlug = selected[0]?.categorySlug ?? null;
  const lockedCategoryName = selected[0]?.categoryName ?? null;
  const [categorySuggestions, setCategorySuggestions] = useState<SuggestedItem[] | null>(null);
  // Kategori kilitlenmemişken (hiç araç seçilmemişken) sayfa yüklenirken gelen
  // global "en çok yorumlanan 3 araç" (`suggestions` prop) gösterilir. Kategori
  // kilitlenince (isim veya öneriden ilk seçim yapılınca) öneriler o kategoriye
  // özel listeye geçer — kullanıcı bir öneriyi seçtikçe seçilenler hariç
  // tutularak tazelenir, liste hep 3 dolu kalmaya çalışır (bkz. kullanıcı geri
  // bildirimi: "kategoriyle güncelleyelim, seçileni değil başka bir aday gelsin").
  const activeSuggestions = lockedCategorySlug ? (categorySuggestions ?? []) : suggestions;
  const visibleSuggestions = activeSuggestions.filter((s) => !selected.some((x) => x.slug === s.slug));
  const selectedSlugsKey = selected.map((s) => s.slug).join(",");

  useEffect(() => {
    // Kategori kilidi yoksa (hiç araç seçilmemiş) bu efekt hiç çalışmaz —
    // activeSuggestions zaten lockedCategorySlug null'ken categorySuggestions'ı
    // görmezden geliyor, ayrıca sıfırlamaya gerek yok (gereksiz setState'ten kaçınılıyor).
    if (!lockedCategorySlug) return;
    const params = new URLSearchParams({ category: lockedCategorySlug });
    if (selectedSlugsKey) params.set("exclude", selectedSlugsKey);
    let cancelled = false;
    fetch(`/api/compare/suggestions?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => { if (!cancelled) setCategorySuggestions(data); })
      .catch(() => { if (!cancelled) setCategorySuggestions([]); });
    return () => { cancelled = true; };
  }, [lockedCategorySlug, selectedSlugsKey]);

  useEffect(() => {
    // Dropdown zaten displayQuery.length < 2 iken render edilmiyor (aşağıda),
    // bu yüzden results'ı burada senkron sıfırlamaya gerek yok — bir sonraki
    // gerçek aramada zaten üzerine yazılır.
    if (displayQuery.length < 2) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: displayQuery });
        if (lockedCategorySlug) params.set("category", lockedCategorySlug);
        const res = await fetch(`/api/search/products?${params.toString()}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [displayQuery, lockedCategorySlug]);

  // Kullanıcı "sonuç yok görününce mikrofon dursun" istedi — dinleme
  // sırasında bir arama tamamlanıp sıfır sonuç dönerse mikrofonu kapatıyoruz
  // (searchTerm >= 2 şartı, henüz hiç arama yapılmadan stale/boş results'a
  // bakıp yanlışlıkla erken durdurmayı engelliyor).
  useEffect(() => {
    if (speechStatus !== "listening") return;
    if (loading) return;
    if (speechInterim) return; // henüz bitmemiş bir kelime varken karar vermeyelim
    if (displayQuery.trim().length < 2) return;
    if (results.length > 0) return;

    const alts = voiceAltsRef.current;
    const nextIndex = voiceAltIndexRef.current + 1;
    if (nextIndex < alts.length) {
      // "Togg" yerine "Tok" gibi yanlış algılanmışsa tarayıcının bir sonraki
      // adayını dene — sessizce mikrofonu kapatmadan önce.
      voiceAltIndexRef.current = nextIndex;
      const base = voiceBaseRef.current;
      setQuery(`${base}${base && !base.endsWith(" ") ? " " : ""}${alts[nextIndex]}`.trimStart());
      return;
    }
    stopSpeech();
  }, [speechStatus, speechInterim, stopSpeech, loading, displayQuery, results]);

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
    if (speechStatus === "listening") stopSpeech();
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
    // add()'deki kategori kilidi kontrolü burada da gerekliydi — eksikti,
    // öneri pilline tıklayınca farklı kategoriden bir araç sessizce
    // eklenebiliyordu (sunucu tarafında karşılaştırma sayfasına geçince geç
    // fark ediliyordu, bkz. kullanıcı geri bildirimi).
    if (lockedCategorySlug && s.categorySlug !== lockedCategorySlug) return;
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

  const showSuggestions = !open && selected.length < MAX_COMPARE_ITEMS && visibleSuggestions.length > 0;

  return (
    <div className="border border-gray-100 bg-white rounded-2xl p-5 mb-4">
      {/* Öneri şeridi kasıtlı olarak HER ZAMAN üstte, sabit bir konumda —
          kullanıcı seçim yaptıkça yer değiştirmesin diye (bkz. kullanıcı
          önerisi: "önerileri hep üstte tutalım, seçilenler altına"). Slot
          kaldığı sürece (1-3 araç seçiliyken de) görünmeye devam ediyor —
          ilk aracı öneriden seçen kullanıcı ikinci/üçüncü aracı da yine tek
          tıkla ekleyebilsin diye. Zaten seçili bir araç listeden filtrelenir.
          Arama kutusuna odaklanınca (open=true) kaybolur. */}
      {/* Öneri pill'i (kesikli çerçeve, "+" öneki, açık zemin) ile seçili
          chip (dolu koyu zemin) BİLİNÇLİ olarak farklı stilller taşıyor —
          önceden ikisi de aynı açık-gri tonda olduğu için "hangisi zaten
          seçili, hangisi öneri" ayırt edilemiyordu (bkz. kullanıcı geri
          bildirimi, masaüstü ekran görüntüsü). */}
      {showSuggestions && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-gray-400">Popüler:</span>
          {visibleSuggestions.map((s) => (
            <button
              key={s.slug}
              onClick={() => addSuggested(s)}
              className="inline-flex items-center gap-1 text-xs font-semibold bg-white text-gray-600 border border-dashed border-gray-300 rounded-full px-3 py-1.5 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              <span className="text-gray-400" aria-hidden="true">+</span>
              {s.name} <span className="font-normal text-gray-400">({s.reviewCount} yorum)</span>
            </button>
          ))}
        </div>
      )}

      <div className={`flex flex-wrap items-center gap-2 mb-3 ${showSuggestions ? "pt-3 border-t border-gray-100" : ""}`}>
        {selected.length > 0 && <span className="text-xs text-gray-400">Seçilenler:</span>}
        {selected.map((s) => (
          <span key={s.slug} className="flex flex-wrap max-w-full items-center gap-1.5 text-xs font-semibold bg-gray-900 text-white rounded-full px-3 py-1.5">
            {s.name}
            <button onClick={() => remove(s.slug)} className="text-gray-400 hover:text-white" aria-label={`${s.name} kaldır`}>✕</button>
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

      {/* Sayaç + limit mesajı — önceden 4/4 dolunca arama kutusu sessizce
          kayboluyordu, kullanıcı "neden ekleyemiyorum" diye anlayamıyordu. */}
      {selected.length > 0 && (
        <p className="text-xs text-gray-400 mb-2">
          {selected.length}/{MAX_COMPARE_ITEMS} araç seçildi
        </p>
      )}

      {lockedCategoryName && selected.length < MAX_COMPARE_ITEMS && (
        <p className="text-xs text-gray-400 mb-2">
          Arama <span className="font-semibold text-gray-600">{lockedCategoryName}</span> kategorisiyle sınırlı.
        </p>
      )}

      {selected.length >= MAX_COMPARE_ITEMS && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
          En fazla {MAX_COMPARE_ITEMS} araç karşılaştırabilirsin. Yeni bir araç eklemek için önce listeden birini kaldır.
        </p>
      )}

      {selected.length < MAX_COMPARE_ITEMS && (
        <div ref={boxRef} className="relative">
          <input
            type="text"
            value={displayQuery}
            onChange={(e) => {
              if (speechStatus === "listening") stopSpeech();
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Araç ara ve ekle..."
            className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 pr-9"
          />
          {speechSupported && (
            <button
              type="button"
              onClick={() => {
                if (speechStatus === "listening") {
                  stopSpeech();
                } else if (displayQuery) {
                  setQuery("");
                  setResults([]);
                  abortSpeech();
                } else {
                  setOpen(true);
                  startSpeech(handleVoiceFinalTranscript);
                }
              }}
              aria-label={
                speechStatus === "listening"
                  ? "Sesli aramayı durdur"
                  : displayQuery
                  ? "Aramayı temizle"
                  : "Sesli arama başlat"
              }
              aria-pressed={speechStatus === "listening"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={
                speechStatus === "listening"
                  ? { color: "#dc2626" }
                  : displayQuery
                  ? { color: "#6b7280" }
                  : { color: "#9ca3af" }
              }
            >
              {speechStatus === "listening" ? (
                <span className="relative flex items-center justify-center" aria-hidden="true">
                  <span className="absolute -inset-1.5 rounded-full border-2 border-current opacity-50 animate-pulse motion-reduce:animate-none" />
                  <svg width={13} height={13} viewBox="0 0 24 24">
                    <rect x={6} y={6} width={12} height={12} rx={2} fill="currentColor" />
                  </svg>
                </span>
              ) : displayQuery ? (
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <line x1={18} y1={6} x2={6} y2={18} />
                  <line x1={6} y1={6} x2={18} y2={18} />
                </svg>
              ) : (
                <svg aria-hidden="true" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1={12} y1={19} x2={12} y2={23} />
                  <line x1={8} y1={23} x2={16} y2={23} />
                </svg>
              )}
            </button>
          )}
          {speechStatus === "error" && speechError && (
            <p className="text-xs text-amber-700 mt-1">{speechError}</p>
          )}
          {open && displayQuery.length >= 2 && (
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
