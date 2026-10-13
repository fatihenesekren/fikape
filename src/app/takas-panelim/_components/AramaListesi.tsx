"use client";

import { useState } from "react";
import Link from "next/link";
import { searchHref, searchParcalari, type SavedSearchRow } from "@/lib/savedSearchGoster";

export interface AramaSatiri {
  arama: SavedSearchRow;
  kaydedildi: string; // sunucuda biçimlenmiş tarih (saat dilimi farkıyla uyumsuzluk çıkmasın)
}

// Kayıtlı aramalar listesi: her arama kendi kriterleriyle (çipler) ve kayıt tarihiyle ayırt edilir; "İlanları göster" aynı
// filtreyle /takas'ı açar, "Sil" aramayı kaldırır (iyimser güncelleme, hata olursa geri alınır ve duyurulur).
export function AramaListesi({ baslangic, sinir }: { baslangic: AramaSatiri[]; sinir: number }) {
  const [satirlar, setSatirlar] = useState(baslangic);
  const [durum, setDurum] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  async function sil(id: number) {
    const onceki = satirlar;
    setHata(null);
    setDurum(null);
    setSatirlar((p) => p.filter((s) => s.arama.id !== id));
    const res = await fetch(`/api/saved-searches/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res || !res.ok) {
      setSatirlar(onceki);
      setHata("Arama silinemedi, lütfen tekrar deneyiniz.");
    } else {
      setDurum("Arama silindi.");
    }
  }

  return (
    <div>
      <div role="status" aria-live="polite" className="text-sm text-gray-700 empty:hidden mb-3">{durum}</div>
      <div role="alert" className="text-sm text-red-700 empty:hidden mb-3">{hata}</div>

      {satirlar.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-gray-800">Henüz kayıtlı aramanız yok</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Takas Pazarında il, kategori veya marka seçip aramanızı yapın; ardından “Yeni ilan çıkınca haber ver” düğmesine basın.
          </p>
          <Link
            href="/takas"
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold text-white hover:bg-black"
            style={{ background: "var(--btn-dark)" }}
          >
            Takas Pazarına gidin
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-600 mb-2" aria-live="polite">
            {satirlar.length} / {sinir} arama
          </p>
          <ul className="space-y-3">
            {satirlar.map(({ arama, kaydedildi }) => {
              const parcalar = searchParcalari(arama);
              return (
                <li key={arama.id} className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-wrap gap-1.5">
                    {parcalar.map((p, i) => (
                      <span
                        key={`${p}-${i}`}
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 border ${
                          i === 0 ? "bg-link-soft text-link-deep border-link-line" : "bg-gray-50 text-gray-700 border-gray-100"
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-600">Kaydedildi: {kaydedildi}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                    <Link
                      href={searchHref(arama)}
                      className="inline-flex items-center min-h-9 text-sm font-semibold text-link hover:text-link-deep hover:underline"
                    >
                      İlanları göster <span aria-hidden="true">&nbsp;→</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => sil(arama.id)}
                      aria-label={`${parcalar.join(" · ")} aramasını sil`}
                      className="inline-flex items-center min-h-9 text-sm font-semibold text-gray-600 hover:text-red-700"
                    >
                      Sil
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
