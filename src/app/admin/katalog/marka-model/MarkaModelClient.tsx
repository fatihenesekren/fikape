"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiIstek, GECIKME_NOTU } from "../istek";

interface Model { id: number; ad: string; urunSayisi: number }
interface Marka { id: number; ad: string; modeller: Model[] }
interface Onizleme {
  kaynak: { ad: string }; hedef: { ad: string }; tasinacak: Record<string, number>;
  yinelenenCiftler: { kaynakSlug: string; hedefSlug: string }[]; cakisanModeller: string[]; engeller: string[];
}
const alan = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";
const TASIMA_ETIKETI: Record<string, string> = { urun: "araç", model: "model", ustaNotu: "usta notu", takasBeklentisi: "takas beklentisi", kayitliArama: "kayıtlı arama" };

export function MarkaModelClient({ markalar }: { markalar: Marka[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [secili, setSecili] = useState<{ tur: "MARKA" | "MODEL"; id: number; ad: string; markaId: number } | null>(null);
  const [yeniAd, setYeniAd] = useState("");
  const [hedefId, setHedefId] = useState("");
  const [onizleme, setOnizleme] = useState<Onizleme | null>(null);
  const [yazi, setYazi] = useState("");
  const [mesaj, setMesaj] = useState<{ tur: "ok" | "hata"; metin: string } | null>(null);
  const [mesgul, setMesgul] = useState(false);

  const gorunen = useMemo(() => {
    const k = q.trim().toLocaleLowerCase("tr");
    if (!k) return markalar.slice(0, 40);
    return markalar.filter((b) => b.ad.toLocaleLowerCase("tr").includes(k) || b.modeller.some((m) => m.ad.toLocaleLowerCase("tr").includes(k))).slice(0, 40);
  }, [q, markalar]);

  const hedefAdaylari = useMemo(() => {
    if (!secili) return [];
    if (secili.tur === "MARKA") return markalar.filter((b) => b.id !== secili.id).map((b) => ({ id: b.id, ad: b.ad }));
    const m = markalar.find((b) => b.id === secili.markaId);
    return (m?.modeller ?? []).filter((x) => x.id !== secili.id).map((x) => ({ id: x.id, ad: `${m?.ad} ${x.ad}` }));
  }, [secili, markalar]);

  function sec(s: NonNullable<typeof secili>) {
    setSecili(s); setYeniAd(s.ad); setHedefId(""); setOnizleme(null); setYazi(""); setMesaj(null);
  }

  async function adlandir() {
    if (!secili) return;
    setMesgul(true); setMesaj(null);
    const yol = secili.tur === "MARKA" ? "marka" : "model";
    const r = await apiIstek(`/api/admin/katalog/${yol}/${secili.id}/yeniden-adlandir`, "POST", { yeniAd, beklenenEskiAd: secili.ad });
    setMesgul(false);
    if (r.ok) { setMesaj({ tur: "ok", metin: `Yeniden adlandırıldı. Eski adres yeni adrese yönlenir. ${GECIKME_NOTU}` }); setSecili(null); router.refresh(); return; }
    setMesaj({ tur: "hata", metin: r.veri.error ?? "Yapılamadı" });
  }

  async function onizle() {
    if (!secili || !hedefId) return;
    setMesgul(true); setMesaj(null); setOnizleme(null); setYazi("");
    const r = await apiIstek<{ onizleme: Onizleme }>("/api/admin/katalog/birlestir", "POST", { tur: secili.tur, kaynakId: secili.id, hedefId: Number(hedefId), dryRun: true });
    setMesgul(false);
    if (r.ok) setOnizleme(r.veri.onizleme as Onizleme);
    else setMesaj({ tur: "hata", metin: r.veri.error ?? "Önizleme alınamadı" });
  }

  async function birlestir() {
    if (!secili || !onizleme) return;
    setMesgul(true); setMesaj(null);
    const r = await apiIstek("/api/admin/katalog/birlestir", "POST", { tur: secili.tur, kaynakId: secili.id, hedefId: Number(hedefId), dryRun: false, onay: true });
    setMesgul(false);
    if (r.ok) { setMesaj({ tur: "ok", metin: `Birleştirildi. ${GECIKME_NOTU}` }); setSecili(null); setOnizleme(null); router.refresh(); return; }
    setMesaj({ tur: "hata", metin: r.veri.error ?? "Birleştirilemedi" });
  }

  const onayMetni = onizleme ? `${onizleme.kaynak.ad} → ${onizleme.hedef.ad}` : "";

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Veritabanındaki marka ve modeller. Resmi (statik) katalog adları burada değiştirilemez; yalnız veritabanı kayıtları adlandırılır/birleştirilir.</p>
      <input className={alan} placeholder="Marka veya model ara…" value={q} onChange={(e) => setQ(e.target.value)} />
      {mesaj && <p role="status" className={`text-sm ${mesaj.tur === "ok" ? "text-green-700" : "text-red-600"}`}>{mesaj.metin}</p>}

      {secili && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Seçili: {secili.tur === "MARKA" ? "Marka" : "Model"} — {secili.ad}</p>
          <div className="space-y-2">
            <label className="block text-sm">Yeni ad<input className={alan} value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} maxLength={100} /></label>
            <button disabled={mesgul || !yeniAd.trim() || yeniAd.trim() === secili.ad} onClick={() => void adlandir()} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-40">Yeniden adlandır</button>
            <p className="text-xs text-gray-400">Bağlı araçların adı güncellenir; araç sayfa adresleri (slug) değişmez.</p>
          </div>
          <hr className="border-gray-100" />
          <div className="space-y-2">
            <label className="block text-sm">Şuna birleştir (bu kayıt kaldırılır)
              <select className={alan} value={hedefId} onChange={(e) => { setHedefId(e.target.value); setOnizleme(null); setYazi(""); }}>
                <option value="">Seçiniz</option>
                {hedefAdaylari.map((h) => <option key={h.id} value={h.id}>{h.ad}</option>)}
              </select>
            </label>
            <button disabled={mesgul || !hedefId} onClick={() => void onizle()} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-40">Önizle</button>
          </div>
          {onizleme && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 space-y-2">
              <p className="font-semibold">{onizleme.kaynak.ad} → {onizleme.hedef.ad}</p>
              <p>Taşınacak: {Object.entries(onizleme.tasinacak).map(([k, v]) => `${v} ${TASIMA_ETIKETI[k] ?? k}`).join(", ")}</p>
              {onizleme.yinelenenCiftler.length > 0 && (
                <p>Birleşince aynı olacak araçlar ({onizleme.yinelenenCiftler.length}): {onizleme.yinelenenCiftler.slice(0, 5).map((c) => `${c.kaynakSlug} ≈ ${c.hedefSlug}`).join("; ")}. Bu çiftler ayrı kayıt olarak kalır.</p>
              )}
              {onizleme.engeller.length > 0 ? (
                <ul className="list-disc pl-5 text-red-700">{onizleme.engeller.map((e) => <li key={e}>{e}</li>)}{onizleme.cakisanModeller.length > 0 && <li>Çakışan: {onizleme.cakisanModeller.join(", ")}</li>}</ul>
              ) : (
                <>
                  <p className="font-semibold">Bu işlem geri alınamaz. Onaylamak için aşağıya tam olarak şunu yazın:</p>
                  <code className="block break-words bg-white px-2 py-1 rounded">{onayMetni}</code>
                  <input className={alan} value={yazi} onChange={(e) => setYazi(e.target.value)} />
                  <button disabled={mesgul || yazi.trim() !== onayMetni} onClick={() => void birlestir()} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-40">Birleştir</button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <ul className="space-y-3">
        {gorunen.map((b) => (
          <li key={b.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <button onClick={() => sec({ tur: "MARKA", id: b.id, ad: b.ad, markaId: b.id })} className="font-semibold text-gray-900 hover:underline text-left">{b.ad}</button>
            <span className="text-xs text-gray-400 ml-2">{b.modeller.length} model</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {b.modeller.map((m) => (
                <button key={m.id} onClick={() => sec({ tur: "MODEL", id: m.id, ad: m.ad, markaId: b.id })} className="text-xs px-2 py-1 rounded-md bg-gray-50 border border-gray-200 hover:bg-gray-100">
                  {m.ad} <span className="text-gray-400">({m.urunSayisi})</span>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
