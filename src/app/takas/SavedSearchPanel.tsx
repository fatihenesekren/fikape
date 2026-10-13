"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { aramaKayitliMi, searchHref, searchSummary, type SavedSearchRow } from "@/lib/savedSearchGoster";

// /takas'ta "Bu aramayı kaydet" çubuğu + kayıtlı aramalar listesi.
//
// Önceden kaydet düğmesi yalnız il seçiliyse çıkıyordu, küçük bir metin bağlantısıydı ve kaydedince hiçbir geri bildirim
// yoktu: kullanıcı özelliğin var olduğunu bulamıyor ya da çalıştığını anlayamıyordu. Şimdi: uygulanmış bir filtre varsa
// belirgin bir çubuk görünür, il yoksa çubuğun içinde seçilir, giriş yoksa girişe yönlendirilir, kayıttan sonra net bir
// mesaj gösterilir (ve bildirimin ne zaman geleceği dürüstçe söylenir).
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
  initialSearches,
  baslangicAcik = false,
  ozet,
  uygunIlanSayisi,
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
  initialSearches: SavedSearchRow[];
  /** Kayıtlı aramalar listesi açık başlasın (eski ?aramalar=1 bağlantıları için). */
  baslangicAcik?: boolean;
  /** Uygulanmış filtrelerin okunur özeti (il · kategori · marka ...), il seçilmemişse il içermez. */
  ozet: string;
  /** Şu anki filtreyle eşleşen toplam ilan (sayfa sonucunun toplamı). */
  uygunIlanSayisi: number;
  cities: readonly string[];
  /** Giriş yapmamış kullanıcı için: girişten sonra aynı filtreyle dönülecek adres. */
  girisHref: string;
}) {
  const router = useRouter();
  const [searches, setSearches] = useState(initialSearches);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [basari, setBasari] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(baslangicAcik);
  const [secilenIl, setSecilenIl] = useState("");

  const kaydedilebilirFiltre = Boolean(
    il || kategoriId || markaId || odemeNiyeti || yilMin != null || yilMax != null || kmMin != null || kmMax != null || yakit || vites,
  );
  const kullanilanIl = il || secilenIl;

  // Giriş yoksa yalnızca çubuk (girişe yönlendiren); hiç filtre yoksa ve kayıtlı arama da yoksa hiçbir şey çizilmez.
  if (!isLoggedIn && !kaydedilebilirFiltre) return null;
  if (isLoggedIn && !kaydedilebilirFiltre && searches.length === 0) return null;

  // Bu filtreler zaten kayıtlı bir aramayla birebir aynıysa (örn. "Kayıtlı aramalarım"daki bağlantıyla gelinmiş ya da az önce
  // kaydedilmiş) düğme "kaydet" yerine "kayıtlı" durumunu gösterir; kullanıcı tıklayıp "zaten kayıtlı" hatası görmez. Bir
  // kriter eklenir/çıkarılırsa yeni bir arama olur ve düğme yeniden kaydedilebilir.
  const zatenKayitli =
    isLoggedIn &&
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
      const listRes = await fetch("/api/saved-searches");
      if (listRes.ok) {
        const listData = await listRes.json();
        setSearches(listData.searches);
      }
      setExpanded(true);
      // Uygun ilan sayısı yalnız il adreste seçiliyken doğru (çubukta seçilen il için sayfa sonucu farklıdır).
      const mevcut = il && uygunIlanSayisi > 0 ? ` Şu an bu aramaya uyan ${uygunIlanSayisi} ilan var.` : "";
      setBasari(
        `Kaydedildi.${mevcut} Yeni bir uygun ilan yayınlandığında bildirim zilinde haber vereceğiz; zaten yayındaki ilanlar için bildirim gönderilmez.`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeSearch(id: number) {
    const onceki = searches;
    setSearches((prev) => prev.filter((s) => s.id !== id));
    const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) {
      setSearches(onceki);
      setError("Arama silinemedi, lütfen tekrar deneyiniz.");
    } else {
      setBasari("Arama silindi.");
    }
  }

  return (
    <section id="kayitli-aramalar" aria-label="Kayıtlı aramalar" className="mb-6 scroll-mt-20 space-y-3">
      {kaydedilebilirFiltre && (
        <div className="rounded-2xl border border-link-line bg-link-soft/60 p-4">
          <p className="text-sm font-semibold text-link-deep">
            {zatenKayitli ? (
              <>
                <span aria-hidden="true">✓ </span>Bu arama kayıtlı
              </>
            ) : (
              "Bu aramayı kaydedin, yeni ilan çıkınca haber verelim"
            )}
          </p>
          <p className="mt-0.5 text-sm text-gray-700 break-words">{[il, ozet].filter(Boolean).join(" · ") || "Seçtiğiniz filtreler"}</p>

          {zatenKayitli ? (
            <p className="mt-2 text-sm text-gray-700">
              {/* Kayıttan hemen sonra aşağıdaki "Kaydedildi" mesajı aynı bilgiyi veriyor; cümle tekrarlanmasın. */}
              {!basari && <>Bu kriterlere uyan yeni bir ilan yayınlandığında bildirim zilinde haber alırsınız. </>}
              <Link href="/takas-panelim/aramalar" className="font-semibold text-link hover:underline whitespace-nowrap">
                Aramalarımı yönet →
              </Link>
            </p>
          ) : isLoggedIn ? (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
              {!il && (
                <div className="sm:w-56">
                  <label htmlFor="kayit-il" className="block text-xs font-semibold text-gray-700 mb-1">
                    İl (zorunlu)
                  </label>
                  <select
                    id="kayit-il"
                    value={secilenIl}
                    onChange={(e) => setSecilenIl(e.target.value)}
                    className="w-full min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-base sm:text-sm text-gray-900"
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
                disabled={saving}
                className="inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ background: "var(--btn-dark)", outlineColor: "var(--btn-dark)" }}
              >
                {saving ? "Kaydediliyor..." : "Bu aramayı kaydet"}
              </button>
            </div>
          ) : (
            <Link
              href={girisHref}
              className="mt-3 inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold text-white hover:bg-black"
              style={{ background: "var(--btn-dark)" }}
            >
              Giriş yapıp kaydedin
            </Link>
          )}
        </div>
      )}

      {/* Önceden DOM'da olan canlı bölgeler: ekran okuyucu sonucu duyurur. */}
      <div role="status" aria-live="polite" className="text-sm text-gray-700 empty:hidden">
        {basari}
      </div>
      <div role="alert" className="text-sm text-red-700 empty:hidden">
        {error}
      </div>

      {searches.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="kayitli-arama-listesi"
            className="inline-flex items-center min-h-9 text-sm font-semibold text-link hover:underline"
          >
            Kayıtlı aramalarım ({searches.length})
          </button>
          {expanded && (
            <ul id="kayitli-arama-listesi" className="mt-2 space-y-1.5">
              {searches.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 text-sm bg-gray-50 rounded-lg px-3 py-1.5">
                  <Link href={searchHref(s)} className="min-w-0 break-words text-gray-700 hover:text-link hover:underline">
                    {searchSummary(s)}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeSearch(s.id)}
                    aria-label={`${searchSummary(s)} aramasını sil`}
                    className="shrink-0 inline-flex items-center min-h-9 px-2 text-sm font-semibold text-gray-600 hover:text-red-700"
                  >
                    Sil
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
