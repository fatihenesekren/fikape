"use client";

import { useState } from "react";
import Link from "next/link";
import { apiIstek, GECIKME_NOTU, KATEGORI_ETIKETI, YAKIT_ETIKETI } from "../istek";

const KATEGORILER = Object.keys(KATEGORI_ETIKETI);
const MOTORLU = ["otomobil", "kamyonet", "motosiklet"];
const VITESLER = ["Manuel", "Otomatik", "CVT", "Yarı Otomatik"];
const alan = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";

/** Aylık aday listesinden gelen ön bilgi (yoksa form boş açılır). */
export interface AdayBaslangic {
  adayId: number; kirilim: string; kategori: string; yakit: string; marka: string; model: string; versiyon: string; yil: string;
  kaynakUrl: string; kaynakAdi: string | null; kanit: string | null; etiket: string;
}

export function YeniAracForm({ baslangic }: { baslangic?: AdayBaslangic | null }) {
  const [f, setF] = useState({
    kategori: baslangic?.kategori ?? "otomobil", marka: baslangic?.marka ?? "", model: baslangic?.model ?? "",
    versiyon: baslangic?.versiyon ?? "", paket: "", yil: baslangic?.yil ?? "", yakit: baslangic?.yakit ?? "", vites: "", beygir: "",
  });
  const [bildirim, setBildirim] = useState(false);
  const [benzerler, setBenzerler] = useState<string[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonTaslak, setSonTaslak] = useState(false);
  const [eklenen, setEklenen] = useState<{ id: number; name: string; taslak: boolean } | null>(null);
  const motorlu = MOTORLU.includes(f.kategori);
  const ayarla = (k: keyof typeof f, v: string) => { setF((o) => ({ ...o, [k]: v })); setBenzerler(null); };

  async function gonder(benzerlikOnayi: boolean, taslak = false) {
    setHata(null);
    setYukleniyor(true);
    setSonTaslak(taslak);
    // Aday bağı yalnız kategori değiştirilmediyse kurulur (kırılım ile kategori uyuşmalı)
    const adayBagi = baslangic && f.kategori === baslangic.kategori ? { adayId: baslangic.adayId, kirilim: baslangic.kirilim } : {};
    const r = await apiIstek<{ id: number; name: string }>("/api/admin/katalog/urunler", "POST", {
      kategori: f.kategori, marka: f.marka, model: f.model,
      versiyon: f.versiyon || null, paket: f.paket || null,
      yil: Number(f.yil),
      yakit: motorlu ? f.yakit || null : null, vites: motorlu ? f.vites || null : null,
      beygir: f.beygir ? Number(f.beygir) : null,
      benzerlikOnayi, bildirimGonder: bildirim && !taslak, taslak, ...adayBagi,
    });
    setYukleniyor(false);
    if (r.ok) { setEklenen({ id: r.veri.id as number, name: r.veri.name as string, taslak }); return; }
    if (r.status === 409 && r.veri.benzerler?.length) { setBenzerler(r.veri.benzerler); return; }
    setHata(r.veri.error ?? "Eklenemedi");
  }

  if (eklenen) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-sm text-green-900">
        <p className="font-semibold mb-1">{eklenen.taslak ? "Taslak olarak eklendi (yayında değil)" : "Eklendi"}: {eklenen.name}</p>
        <p className="mb-3 text-green-800">
          {eklenen.taslak ? "Özellikleri tamamlayınca araç sayfasından yayına alabilirsiniz (Pasif listesinde görünür)." : GECIKME_NOTU}
        </p>
        <Link href={`/admin/katalog/${eklenen.id}`} className="underline mr-4">Araca git</Link>
        {baslangic
          ? <Link href="/admin/katalog/onerilenler" className="underline">Önerilenlere dön</Link>
          : <button onClick={() => { setEklenen(null); setF((o) => ({ ...o, versiyon: "", paket: "", yil: "", beygir: "" })); }} className="underline">Bir tane daha ekle</button>}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void gonder(false); }} className="space-y-4 bg-white border border-gray-100 rounded-xl p-5">
      {baslangic && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-900 break-words">
          <p className="font-semibold">Önerilen araç ({baslangic.etiket})</p>
          {baslangic.kanit && <p className="italic mt-1">“{baslangic.kanit}”</p>}
          <a href={/^https?:\/\//i.test(baslangic.kaynakUrl) ? baslangic.kaynakUrl : undefined} target="_blank" rel="noopener noreferrer nofollow" className="underline">
            {baslangic.kaynakAdi ?? "Kaynak"}
          </a>
          <p className="mt-1 text-blue-800">Yıl, yakıt, vites ve donanımı kaynaktan doğrulayıp tamamlayınız.</p>
        </div>
      )}
      <label className="block text-sm">Kategori
        <select className={alan} value={f.kategori} onChange={(e) => ayarla("kategori", e.target.value)}>
          {KATEGORILER.map((k) => <option key={k} value={k}>{KATEGORI_ETIKETI[k]}</option>)}
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block text-sm">Marka<input className={alan} value={f.marka} onChange={(e) => ayarla("marka", e.target.value)} required maxLength={80} /></label>
        <label className="block text-sm">Model<input className={alan} value={f.model} onChange={(e) => ayarla("model", e.target.value)} required maxLength={100} /></label>
        <label className="block text-sm">Versiyon (isteğe bağlı)<input className={alan} value={f.versiyon} onChange={(e) => ayarla("versiyon", e.target.value)} maxLength={100} /></label>
        <label className="block text-sm">Donanım paketi (isteğe bağlı)<input className={alan} value={f.paket} onChange={(e) => ayarla("paket", e.target.value)} maxLength={100} /></label>
        <label className="block text-sm">Model yılı<input className={alan} inputMode="numeric" value={f.yil} onChange={(e) => ayarla("yil", e.target.value.replace(/\D/g, "").slice(0, 4))} required /></label>
        <label className="block text-sm">Beygir (isteğe bağlı)<input className={alan} inputMode="numeric" value={f.beygir} onChange={(e) => ayarla("beygir", e.target.value.replace(/\D/g, "").slice(0, 4))} /></label>
        {motorlu && (
          <>
            <label className="block text-sm">Yakıt
              <select className={alan} value={f.yakit} onChange={(e) => ayarla("yakit", e.target.value)} required>
                <option value="">Seçiniz</option>
                {Object.entries(YAKIT_ETIKETI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block text-sm">Vites
              <select className={alan} value={f.vites} onChange={(e) => ayarla("vites", e.target.value)} required>
                <option value="">Seçiniz</option>
                {VITESLER.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          </>
        )}
      </div>

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={bildirim} onChange={(e) => setBildirim(e.target.checked)} className="mt-1" />
        <span>Garajında bu markayı bulunduran kullanıcılara bildirim gönder (varsayılan: kapalı)</span>
      </label>

      {benzerler && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
          <p className="font-semibold mb-1">Benzer adlar bulundu — yazım hatası olabilir:</p>
          <ul className="list-disc pl-5 mb-2">{benzerler.map((b) => <li key={b}>{b}</li>)}</ul>
          <button type="button" onClick={() => void gonder(true, sonTaslak)} disabled={yukleniyor} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium disabled:opacity-50">
            Yine de farklı bir araç olarak ekle
          </button>
        </div>
      )}
      {hata && <p className="text-sm text-red-600" role="alert">{hata}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={yukleniyor} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-50">
          {yukleniyor ? "Ekleniyor…" : "Kataloğa ekle"}
        </button>
        <button
          type="button" disabled={yukleniyor} onClick={() => void gonder(false, true)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Taslak olarak ekle
        </button>
      </div>
      <p className="text-xs text-gray-400">
        “Kataloğa ekle”: araç doğrudan yayınlanır, kendi sayfasını açar ve yorum/puan toplayabilir. “Taslak”: kayıt oluşur ama yayında olmaz;
        özellikleri girince araç sayfasından yayına alırsınız.
      </p>
    </form>
  );
}
