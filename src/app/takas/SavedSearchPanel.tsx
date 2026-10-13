"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { aramaKayitliMi, searchHref, searchParcalari, type SavedSearchRow } from "@/lib/savedSearchGoster";
import { panelGorunumu } from "@/lib/takasFiltreKarari";

// /takas'ta tek kompakt kart: uygulanan filtre çipleri + TEK "Filtreleri temizle" + kayıt durumu, altında açılır
// "Kayıtlı aramalarım" listesi. Önceden bilgi beş parçaya dağılmıştı (kutu, yönet bağlantısı, uzun mesaj, başlık, Sil'li
// liste) ve "Filtreleri temizle" iki yerde geçiyordu (kullanıcı geri bildirimi). Silme yalnız /takas-panelim/aramalar'da;
// burada yalnız az önce yapılan kayıt "Kaydı geri al" ile geri alınabilir.
type SavedSearchPanelProps = {
  isLoggedIn: boolean;
  il: string;
  kategoriId: number | null;
  markaId: number | null;
  odemeNiyeti: string;
  yilMin: number | null;
  yilMax: number | null;
  kmMin: number | null;
  kmMax: number | null;
  yakit: string;
  vites: string;
  /** Hızlı aramadaki kelime: çip olarak görünür ama kayda girmez. */
  q: string;
  initialSearches: SavedSearchRow[];
  /** Uygulanmış filtrelerin okunur parçaları (il, kategori, marka, ödeme, yıl, km, yakıt, vites); il seçilmemişse il yok. */
  cipler: string[];
  cities: readonly string[];
  /** Giriş yapmamış kullanıcı için: girişten sonra aynı filtreyle dönülecek adres. */
  girisHref: string;
};

// Adres filtreleri değişince (kayıtlı aramalar arası geçiş) durum sıfırlansın: iç bileşen filtre değerleriyle anahtarlanır.
export function SavedSearchPanel(props: SavedSearchPanelProps) {
  const p = props;
  const anahtar = [p.il, p.kategoriId, p.markaId, p.odemeNiyeti, p.yilMin, p.yilMax, p.kmMin, p.kmMax, p.yakit, p.vites, p.q].join("|");
  return <SavedSearchPanelIci key={anahtar} {...props} />;
}

function SavedSearchPanelIci({
  isLoggedIn,
  il,
  kategoriId,
  markaId,
  odemeNiyeti,
  yilMin,
  yilMax,
  kmMin,
  kmMax,
  yakit,
  vites,
  q,
  initialSearches,
  cipler,
  cities,
  girisHref,
}: SavedSearchPanelProps) {
  const router = useRouter();
  const [searches, setSearches] = useState(initialSearches);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);
  const [sonKayitId, setSonKayitId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [secilenIl, setSecilenIl] = useState("");
  const durumRef = useRef<HTMLDivElement>(null);
  const odakIste = useRef(false);

  // Kayıt/geri al sonrası kaydet düğmesi ya da rozet yer değiştirir; odak <body>'ye düşmesin diye durum alanına taşınır.
  useEffect(() => {
    if (odakIste.current && basari) {
      odakIste.current = false;
      durumRef.current?.focus();
    }
  }, [basari]);

  const kaydedilebilirFiltre = Boolean(
    il || kategoriId || markaId || odemeNiyeti || yilMin != null || yilMax != null || kmMin != null || kmMax != null || yakit || vites,
  );
  const gorunum = panelGorunumu({ isLoggedIn, kaydedilebilirFiltre, q, kayitliSayisi: searches.length });
  if (gorunum === "yok") return null;

  const kullanilanIl = il || secilenIl;
  // Bu filtreler zaten kayıtlı bir aramayla birebir aynıysa düğme yerine "Kayıtlı" rozeti çıkar (tıklayıp "zaten kayıtlı"
  // hatası görülmesin). Bir kriter eklenir/çıkarılırsa yeni bir arama olur ve düğme yeniden görünür.
  const zatenKayitli =
    isLoggedIn &&
    kaydedilebilirFiltre &&
    Boolean(kullanilanIl) &&
    aramaKayitliMi(searches, {
      city: kullanilanIl,
      categoryId: kategoriId,
      brandId: markaId,
      paymentIntent: odemeNiyeti || null,
      yearMin: yilMin,
      yearMax: yilMax,
      kmMin,
      kmMax,
      fuelTypes: yakit ? [yakit] : [],
      transmissions: vites ? [vites] : [],
    });

  async function saveSearch() {
    if (saving) return;
    setError(null);
    setBasari(null);
    if (!kullanilanIl) {
      setError("Aramayı kaydetmek için bir il seçiniz.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: kullanilanIl,
          categoryId: kategoriId,
          brandId: markaId,
          paymentIntent: odemeNiyeti || null,
          yearMin: yilMin,
          yearMax: yilMax,
          kmMin,
          kmMax,
          fuelTypes: yakit ? [yakit] : [],
          transmissions: vites ? [vites] : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Arama kaydedilemedi, lütfen tekrar deneyiniz.");
        return;
      }
      router.refresh();
      const listRes = await fetch("/api/saved-searches").catch(() => null);
      if (listRes?.ok) {
        const listData = await listRes.json();
        setSearches(listData.searches);
      }
      setSonKayitId(typeof data.id === "number" ? data.id : null);
      odakIste.current = true;
      setBasari("Kaydedildi. Yeni uygun ilan yayınlanınca bildirim zilinde haber veririz; mevcut ilanlar için bildirim gönderilmez.");
    } finally {
      setSaving(false);
    }
  }

  async function kaydiGeriAl() {
    if (sonKayitId == null) return;
    const id = sonKayitId;
    setError(null);
    const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) {
      setError("Kayıt geri alınamadı, lütfen tekrar deneyiniz.");
      return;
    }
    setSearches((prev) => prev.filter((s) => s.id !== id));
    setSonKayitId(null);
    router.refresh();
    odakIste.current = true;
    setBasari("Kayıt geri alındı.");
  }

  const odakHalkasi = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link";
  const ikincilDugme =
    "inline-flex items-center justify-center min-h-11 w-full sm:w-auto px-5 rounded-xl border-2 border-link-deep bg-white text-sm font-bold text-link-deep shadow-sm hover:bg-link-soft transition-colors " +
    odakHalkasi;

  return (
    <section id="kayitli-aramalar" aria-label="Filtreler ve kayıtlı arama" className="scroll-mt-20 flex flex-col gap-3">
      {gorunum === "kart" && (
        <div className="rounded-2xl border border-link-line bg-link-soft/60 overflow-hidden">
          <div className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="pt-1 text-xs font-semibold text-gray-600">Şu an listelenen:</p>
              <Link
                href="/takas"
                className={`inline-flex items-center gap-1 min-h-11 -mt-2 -mb-1 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:underline whitespace-nowrap ${odakHalkasi}`}
              >
                <span aria-hidden="true">✕</span> Filtreleri temizle
              </Link>
            </div>
            <ul role="list" aria-label="Uygulanan filtreler" className="flex flex-wrap gap-1.5">
              {cipler.map((c) => (
                <li key={c} className="max-w-full break-words rounded-full bg-white px-2.5 py-1 text-xs font-medium text-link-deep ring-1 ring-link-line">
                  {c}
                </li>
              ))}
              {q && (
                <li className="max-w-full break-words rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-300">
                  Arama: “{q}”
                </li>
              )}
            </ul>
            {q && (
              <p className="mt-2 text-xs text-gray-600">
                Hızlı aramadaki kelime kayda dahil edilmez.
                {!kaydedilebilirFiltre && " Kaydetmek için il, kategori gibi bir filtre ekleyin."}
              </p>
            )}
          </div>

          {(kaydedilebilirFiltre || basari || error) && (
            <div className="border-t border-link-line bg-white/80 p-3 sm:p-4">
              {kaydedilebilirFiltre && !zatenKayitli && !basari && (
                isLoggedIn ? (
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    {!il && (
                      <div className="sm:w-56">
                        <label htmlFor="kayit-il" className="block text-xs font-semibold text-gray-700 mb-1">
                          İl (zorunlu)
                        </label>
                        <select
                          id="kayit-il"
                          value={secilenIl}
                          onChange={(e) => setSecilenIl(e.target.value)}
                          aria-required="true"
                          aria-invalid={error === "Aramayı kaydetmek için bir il seçiniz." ? true : undefined}
                          className="w-full min-h-11 rounded-xl border border-gray-400 bg-white px-3 text-base sm:text-sm text-gray-900"
                        >
                          <option value="">İl seçiniz</option>
                          {cities.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={saveSearch}
                      aria-disabled={saving}
                      aria-busy={saving}
                      className={`${ikincilDugme} aria-disabled:opacity-60 aria-disabled:cursor-wait`}
                    >
                      {saving ? "Kaydediliyor..." : <><span aria-hidden="true">🔔 </span>Yeni ilan çıkınca haber ver</>}
                    </button>
                  </div>
                ) : (
                  <Link href={girisHref} className={ikincilDugme}>
                    <span aria-hidden="true">🔔 </span>Giriş yapıp haber alın
                  </Link>
                )
              )}

              {zatenKayitli && !basari && (
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 text-sm text-gray-800">
                    <span aria-hidden="true">🔔 </span>Yeni ilan çıkınca haber vereceğiz
                  </p>
                  <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                    <span aria-hidden="true">✓ </span>Kayıtlı
                  </span>
                </div>
              )}

              {/* Önceden DOM'da olan canlı bölgeler (ekran okuyucu sonucu duyurur); içerik yokken yer kaplamaz. */}
              <div ref={durumRef} tabIndex={-1} role="status" aria-live="polite" className="focus:outline-none">
                {basari && (
                  <p className="text-sm text-gray-700">
                    {basari}
                    {sonKayitId != null && (
                      <>
                        {" "}
                        <button
                          type="button"
                          onClick={kaydiGeriAl}
                          className={`font-semibold text-link hover:underline min-h-11 inline-flex items-center ${odakHalkasi}`}
                        >
                          Yanlışsa kaydı geri alın
                        </button>
                      </>
                    )}
                  </p>
                )}
              </div>
              <div role="alert" className="text-sm text-red-700">
                {error && (
                  <p className="mt-2">
                    {error}{" "}
                    <Link href="/takas-panelim/aramalar" className="font-semibold text-link hover:underline whitespace-nowrap">
                      Kayıtlı aramalarım →
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isLoggedIn && searches.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="kayitli-arama-listesi"
            className={`flex w-full items-center justify-between gap-2 min-h-11 px-3 sm:px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 ${odakHalkasi}`}
          >
            <span className="inline-flex items-center gap-2">
              Kayıtlı aramalarım
              <span className="rounded-full bg-link-soft px-2 py-0.5 text-xs font-bold text-link-deep">{searches.length}</span>
            </span>
            <span aria-hidden="true" className={`text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>
          </button>
          <div id="kayitli-arama-listesi" hidden={!expanded} className="border-t border-gray-100">
            <ul className="divide-y divide-gray-100">
              {searches.map((s) => {
                const parcalar = searchParcalari(s);
                return (
                  <li key={s.id}>
                    <Link
                      href={searchHref(s)}
                      className={`flex items-center justify-between gap-3 min-h-11 px-3 sm:px-4 py-2.5 hover:bg-link-soft/50 ${odakHalkasi}`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900 break-words">{parcalar.slice(0, 2).join(" · ")}</span>
                        {parcalar.length > 2 && (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {parcalar.slice(2).map((p) => (
                              <span key={p} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{p}</span>
                            ))}
                          </span>
                        )}
                      </span>
                      <span aria-hidden="true" className="shrink-0 text-lg text-gray-500">›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-gray-100 px-3 sm:px-4 text-right">
              <Link
                href="/takas-panelim/aramalar"
                className={`inline-flex items-center min-h-11 text-sm font-semibold text-link hover:underline ${odakHalkasi}`}
              >
                Tümünü yönet →
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
