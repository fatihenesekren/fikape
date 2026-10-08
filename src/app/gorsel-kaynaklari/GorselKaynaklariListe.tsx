"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  filtrele, markayaGrupla, sayilar, LISANS_SIRA, KATEGORI_ETIKET, type Filtre, type KaynakSatir,
} from "@/lib/gorselKaynak";

const chipCls = (aktif: boolean) =>
  `shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
    aktif ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
  }`;

export function GorselKaynaklariListe({ satirlar, baslangic }: { satirlar: KaynakSatir[]; baslangic: Filtre }) {
  const [f, setF] = useState<Filtre>(baslangic);
  const [elleAcik, setElleAcik] = useState<Set<string>>(new Set());
  const [tumuAcik, setTumuAcik] = useState(false);

  // Arama/filtre adres çubuğuna yazılır → bağlantı paylaşılabilir (sayfa yenilenmez)
  useEffect(() => {
    const p = new URLSearchParams();
    if (f.q.trim()) p.set("q", f.q.trim());
    if (f.kategori) p.set("kategori", f.kategori);
    if (f.lisans) p.set("lisans", f.lisans);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [f]);

  const filtreAktif = !!(f.q.trim() || f.kategori || f.lisans);
  const sonuc = useMemo(() => filtrele(satirlar, f), [satirlar, f]);
  const gruplar = useMemo(() => markayaGrupla(sonuc), [sonuc]);
  const n = useMemo(() => sayilar(satirlar, f), [satirlar, f]);
  const kategoriler = Object.keys(KATEGORI_ETIKET).filter((k) => (n.kategoriler[k] ?? 0) > 0 || f.kategori === k);
  const lisanslar = LISANS_SIRA.filter((l) => (n.lisanslar[l] ?? 0) > 0 || f.lisans === l);
  // Arama/filtre varken eşleşen gruplar otomatik açık; yoksa varsayılan kapalı (tümünü aç ile hepsi)
  const acikMi = (marka: string) => filtreAktif || tumuAcik || elleAcik.has(marka);
  const degistir = (marka: string) =>
    setElleAcik((s) => { const y = new Set(s); if (y.has(marka)) y.delete(marka); else y.add(marka); return y; });
  const temizle = () => setF({ q: "", kategori: "", lisans: "" });

  return (
    <div>
      {/* Arama + filtreler: geniş ekranda kaydırırken sitenin üst çubuğunun (h-14) altında sabit kalır; telefonda yer kaplamasın diye sabit değil */}
      <div className="sm:sticky sm:top-14 sm:z-40 -mx-4 px-4 py-3 bg-gray-50/95 backdrop-blur border-b border-gray-100">
        <div className="relative">
          <svg aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })}
            placeholder="Araç, marka, yazar veya lisans ara…" aria-label="Görsel kaynaklarında ara"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Kategori">
          <button type="button" className={chipCls(!f.kategori)} onClick={() => setF({ ...f, kategori: "" })}>Tümü</button>
          {kategoriler.map((k) => (
            <button key={k} type="button" className={chipCls(f.kategori === k)} aria-pressed={f.kategori === k}
              onClick={() => setF({ ...f, kategori: f.kategori === k ? "" : k })}>
              {KATEGORI_ETIKET[k]} <span className="opacity-60 font-medium">{n.kategoriler[k] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Lisans">
          {lisanslar.map((l) => (
            <button key={l} type="button" className={chipCls(f.lisans === l)} aria-pressed={f.lisans === l}
              onClick={() => setF({ ...f, lisans: f.lisans === l ? "" : l })}>
              {l} <span className="opacity-60 font-medium">{n.lisanslar[l] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
          <span aria-live="polite">
            {filtreAktif ? <><b className="text-gray-800">{sonuc.length}</b> / {satirlar.length} görsel · {gruplar.length} marka</> : <>{satirlar.length} görsel · {gruplar.length} marka</>}
          </span>
          <span className="flex items-center gap-3">
            {filtreAktif && <button type="button" onClick={temizle} className="font-semibold text-link hover:underline">Filtreleri temizle</button>}
            {!filtreAktif && (
              <button type="button" onClick={() => { setTumuAcik((v) => !v); setElleAcik(new Set()); }} className="font-semibold text-link hover:underline">
                {tumuAcik ? "Tümünü kapat" : "Tümünü aç"}
              </button>
            )}
          </span>
        </div>
      </div>

      {gruplar.length === 0 ? (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white px-4 py-10 text-center">
          <p className="text-sm font-semibold text-gray-700">Eşleşen görsel bulunamadı</p>
          <p className="text-xs text-gray-500 mt-1">Farklı bir yazımla deneyin ya da filtreleri temizleyin.</p>
          <button type="button" onClick={temizle} className="mt-3 text-xs font-semibold text-link hover:underline">Filtreleri temizle</button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {gruplar.map((g) => {
            const acik = acikMi(g.marka);
            return (
              <li key={g.marka} className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                <button
                  type="button" onClick={() => degistir(g.marka)} aria-expanded={acik}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <span className="font-semibold text-sm text-gray-900 min-w-0 truncate">{g.marka}</span>
                  <span className="flex items-center gap-2 shrink-0 text-xs text-gray-400">
                    {g.satirlar.length}
                    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" className={`transition-transform ${acik ? "rotate-180" : ""}`}>
                      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                {acik && (
                  <ul className="divide-y divide-gray-50 border-t border-gray-100">
                    {g.satirlar.map((s) => (
                      <li key={s.slug} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                          <Image src={s.imageUrl} alt="" fill sizes="56px" className="object-cover" loading="lazy" />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/araclar/${s.slug}`} className="font-medium text-gray-900 hover:underline break-words">{s.ad}</Link>
                          <p className="text-xs text-gray-500 break-words">
                            {s.kaynakUrl ? <a href={s.kaynakUrl} target="_blank" rel="noopener noreferrer" className="underline">{s.yazar}</a> : s.yazar}
                            {" · "}
                            {s.lisansUrl ? <a href={s.lisansUrl} target="_blank" rel="noopener noreferrer license" className="underline">{s.lisans}</a> : s.lisans}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
