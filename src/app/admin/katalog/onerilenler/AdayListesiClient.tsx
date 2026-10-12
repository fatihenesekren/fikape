"use client";

import { useState } from "react";
import Link from "next/link";
import { KIRILIMLAR } from "@/lib/katalogOneri/kirilimlar";
import { apiIstek } from "../istek";

export interface AdayKarti {
  id: number; ay: string; kirilim: string; kategori: string; marka: string; model: string; versiyon: string | null;
  yil: number | null; tarihNotu: string | null; kaynakUrl: string; kaynakAdi: string | null; kaynakKademe: string;
  kanit: string | null; skor: number; katalogdaVar: boolean; mevcutUrunId: number | null; durum: string; urunId: number | null;
}

const DURUM_ETIKETI: Record<string, string> = { TASLAK: "Taslak eklendi", EKLENDI: "Eklendi", REDDEDILDI: "Reddedildi", ONERILDI: "Karar bekliyor" };
const adi = (a: AdayKarti) => [a.marka, a.model, a.versiyon, a.yil].filter(Boolean).join(" ");
const guvenliUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : undefined);

function Kaynak({ a }: { a: AdayKarti }) {
  return (
    <p className="text-xs text-gray-500 break-words">
      <span className="inline-block px-1.5 rounded bg-gray-100 text-gray-700 font-semibold mr-1.5">{a.kaynakKademe}</span>
      <a href={guvenliUrl(a.kaynakUrl)} target="_blank" rel="noopener noreferrer nofollow" className="underline">{a.kaynakAdi ?? "kaynak"}</a>
    </p>
  );
}

export function AdayListesiClient({ bekleyen, karar }: { bekleyen: AdayKarti[]; karar: AdayKarti[] }) {
  const [satirlar, setSatirlar] = useState<AdayKarti[]>(bekleyen);
  const [kararlar, setKararlar] = useState<AdayKarti[]>(karar);
  const [isleniyor, setIsleniyor] = useState<number | null>(null);
  const [hata, setHata] = useState<{ id: number; mesaj: string } | null>(null);

  async function degistir(a: AdayKarti, islem: "reddet" | "geri-al") {
    setHata(null);
    setIsleniyor(a.id);
    const r = await apiIstek(`/api/admin/katalog/adaylar/${a.id}`, "POST", { islem });
    setIsleniyor(null);
    if (!r.ok) { setHata({ id: a.id, mesaj: r.veri.error ?? "İşlem yapılamadı" }); return; }
    if (islem === "reddet") {
      setSatirlar((s) => s.filter((x) => x.id !== a.id));
      setKararlar((k) => [{ ...a, durum: "REDDEDILDI" }, ...k]);
    } else {
      setKararlar((k) => k.filter((x) => x.id !== a.id));
      setSatirlar((s) => [{ ...a, durum: "ONERILDI" }, ...s]);
    }
  }

  return (
    <div className="space-y-8">
      {KIRILIMLAR.map((k) => {
        const liste = satirlar.filter((a) => a.kirilim === k.key).sort((x, y) => Number(x.katalogdaVar) - Number(y.katalogdaVar) || y.skor - x.skor);
        if (liste.length === 0) return null;
        return (
          <section key={k.key}>
            <h2 className="text-base font-semibold text-gray-900 mb-2">{k.etiket}</h2>
            <ul className="space-y-2">
              {liste.map((a) => (
                <li key={a.id} className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 break-words">
                        {adi(a)}
                        {a.katalogdaVar && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Katalogda var</span>}
                      </p>
                      <p className="text-xs text-gray-400">{[a.tarihNotu, a.ay].filter(Boolean).join(" · ")}</p>
                      {a.kanit && <p className="text-xs text-gray-600 mt-1 italic break-words">“{a.kanit}”</p>}
                      <div className="mt-1"><Kaynak a={a} /></div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {a.katalogdaVar ? (
                        a.mevcutUrunId && <Link href={`/admin/katalog/${a.mevcutUrunId}`} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Kaydı aç</Link>
                      ) : (
                        <Link href={`/admin/katalog/yeni?aday=${a.id}`} className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium">Ekle</Link>
                      )}
                      <button
                        onClick={() => void degistir(a, "reddet")} disabled={isleniyor === a.id}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {a.katalogdaVar ? "Gizle" : "Reddet"}
                      </button>
                    </div>
                  </div>
                  {hata?.id === a.id && <p className="text-sm text-red-600 mt-2" role="alert">{hata.mesaj}</p>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {satirlar.length === 0 && (
        <p className="bg-white border border-gray-100 rounded-xl px-4 py-8 text-sm text-gray-400 text-center">Karar bekleyen öneri yok.</p>
      )}

      {kararlar.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Son kararlar</h2>
          <ul className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-xl">
            {kararlar.map((a) => (
              <li key={a.id} className="px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 truncate">{adi(a)}</p>
                  <p className="text-xs text-gray-400">{KIRILIMLAR.find((k) => k.key === a.kirilim)?.etiket} · {DURUM_ETIKETI[a.durum] ?? a.durum}</p>
                </div>
                {a.urunId && <Link href={`/admin/katalog/${a.urunId}`} className="shrink-0 text-sm underline text-gray-600">Kaydı aç</Link>}
                {a.durum === "REDDEDILDI" && (
                  <button onClick={() => void degistir(a, "geri-al")} disabled={isleniyor === a.id} className="shrink-0 text-sm underline text-gray-600 disabled:opacity-50">Geri al</button>
                )}
                {hata?.id === a.id && <span className="text-xs text-red-600" role="alert">{hata.mesaj}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
