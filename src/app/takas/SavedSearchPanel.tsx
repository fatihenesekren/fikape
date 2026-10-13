"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { aramaKayitliMi, searchHref, searchSummary, type SavedSearchRow } from "@/lib/savedSearchGoster";
import { panelGorunumu } from "@/lib/takasFiltreKarari";

// /takas'ta tek kompakt kart: uygulanan filtre çipleri + TEK "Filtreleri temizle" + kayıt durumu, altında açılır
// "Kayıtlı aramalarım" listesi. Önceden bilgi beş parçaya dağılmıştı (kutu, yönet bağlantısı, uzun mesaj, başlık, Sil'li
// liste) ve "Filtreleri temizle" iki yerde geçiyordu (kullanıcı geri bildirimi). Silme yalnız /takas-panelim/aramalar'da;
// burada yalnız az önce yapılan kayıt "Kaydı geri al" ile geri alınabilir.
export function SavedSearchPanel({
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
}: {
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
}) {
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
    "inline-flex items-center justify-center min-h-11 w-full sm:w-auto px-5 rounded-xl border border-link bg-link-soft text-sm font-semibold text-link-deep hover:bg-link-line/40 transition-colors " +
    odakHalkasi;

  return (
    <section id="kayitli-aramalar" aria-label="Filtreler ve kayıtlı arama" className="scroll-mt-20 flex flex-col gap-3">
      {gorunum === "kart" && (
        <div className="rounded-2xl border border-link-line bg-link-soft/60 p-3 sm:p-4">
          <p className="text-xs font-semibold text-gray-600">Şu an listelenen</p>
          <ul role="list" aria-label="Uygulanan filtreler" className="mt-1.5 flex flex-wrap gap-1.5">
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
          <Link
            href="/takas"
            className={`mt-1 inline-flex items-center gap-1 min-h-11 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:underline ${odakHalkasi}`}
          >
            <span aria-hidden="true">✕</span> Filtreleri temizle
          </Link>

          {q && (
            <p className="text-xs text-gray-600">
              Hızlı aramadaki kelime kayda dahil edilmez.
              {!kaydedilebilirFiltre && " Kaydetmek için il, kategori gibi bir filtre ekleyin."}
            </p>
          )}

          {kaydedilebilirFiltre && !zatenKayitli && !basari && (
            <div className="mt-3">
              {isLoggedIn ? (
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
                    {saving ? "Kaydediliyor..." : "Bu aramayı kaydet"}
                  </button>
                </div>
              ) : (
                <Link href={girisHref} className={ikincilDugme}>
                  Giriş yapıp kaydedin
                </Link>
              )}
            </div>
          )}

          {zatenKayitli && !basari && (
            <p className="mt-2 text-sm font-semibold text-link-deep">
              <span aria-hidden="true">✓ </span>Bu arama kayıtlı
            </p>
          )}

          {/* Önceden DOM'da olan canlı bölgeler (ekran okuyucu sonucu duyurur); içerik yokken yer kaplamaz. */}
          <div ref={durumRef} tabIndex={-1} role="status" aria-live="polite" className="focus:outline-none">
            {basari && (
              <p className="mt-2 text-sm text-gray-700">
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

      {isLoggedIn && searches.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="kayitli-arama-listesi"
            className={`inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-link hover:underline ${odakHalkasi}`}
          >
            Kayıtlı aramalarım ({searches.length}) <span aria-hidden="true">{expanded ? "▴" : "▾"}</span>
          </button>
          <div id="kayitli-arama-listesi" hidden={!expanded}>
            <ul className="mt-1 space-y-1.5">
              {searches.map((s) => (
                <li key={s.id}>
                  <Link
                    href={searchHref(s)}
                    className={`block min-h-11 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700 break-words hover:text-link hover:underline ${odakHalkasi}`}
                  >
                    {searchSummary(s)}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/takas-panelim/aramalar"
              className={`mt-1 inline-flex items-center min-h-11 text-sm font-semibold text-link hover:underline ${odakHalkasi}`}
            >
              Tümünü yönet →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
