"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiIstek, GECIKME_NOTU, KATEGORI_ETIKETI, YAKIT_ETIKETI } from "../istek";

interface Urun {
  id: number; slug: string; name: string; status: string; isActive: boolean; kategori: string;
  marka: string; model: string; versiyon: string; paket: string; yil: number | null; yakit: string; vites: string; guncelleme: string;
}
const MOTORLU = ["otomobil", "kamyonet", "motosiklet"];
const VITESLER = ["Manuel", "Otomatik", "CVT", "Yarı Otomatik"];
const alan = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";
const BAG_ETIKETI: Record<string, string> = {
  yorum: "yorum", garaj: "garaj kaydı", favori: "favori", takas: "takas ilanı", soru: "soru", foto: "fotoğraf",
  rapor: "içerik bildirimi", sigorta: "sigorta talebi", satis: "satış talebi", bekleyenOneri: "bekleyen öneri",
};

export function AracDetayClient({ urun, bag }: { urun: Urun; bag: Record<string, number> }) {
  const router = useRouter();
  const [f, setF] = useState({ marka: urun.marka, model: urun.model, versiyon: urun.versiyon, paket: urun.paket, yil: String(urun.yil ?? ""), yakit: urun.yakit, vites: urun.vites });
  const [guncelleme, setGuncelleme] = useState(urun.guncelleme);
  const [benzerler, setBenzerler] = useState<string[] | null>(null);
  const [mesaj, setMesaj] = useState<{ tur: "ok" | "hata"; metin: string } | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const [silOnay, setSilOnay] = useState("");
  const [neden, setNeden] = useState("");
  const motorlu = MOTORLU.includes(urun.kategori);
  const pasif = urun.status === "ACTIVE" && !urun.isActive;
  const yayinda = urun.status === "ACTIVE" && urun.isActive;
  const bagli = Object.entries(bag).filter(([k, v]) => k !== "toplam" && v > 0);
  const ayarla = (k: keyof typeof f, v: string) => { setF((o) => ({ ...o, [k]: v })); setBenzerler(null); };

  async function kaydet(benzerlikOnayi: boolean) {
    setMesaj(null);
    const g: Record<string, unknown> = { beklenenGuncelleme: guncelleme, benzerlikOnayi };
    if (f.marka !== urun.marka) g.marka = f.marka;
    if (f.model !== urun.model) g.model = f.model;
    if (f.versiyon !== urun.versiyon) g.versiyon = f.versiyon || null;
    if (f.paket !== urun.paket) g.paket = f.paket || null;
    if (f.yil !== String(urun.yil ?? "")) g.yil = Number(f.yil);
    if (motorlu && f.yakit !== urun.yakit) g.yakit = f.yakit || null;
    if (motorlu && f.vites !== urun.vites) g.vites = f.vites || null;
    if (Object.keys(g).length === 2) { setMesaj({ tur: "hata", metin: "Değişiklik yok." }); return; }
    setMesgul(true);
    const r = await apiIstek<{ guncelleme: string }>(`/api/admin/katalog/urunler/${urun.id}`, "PATCH", g);
    setMesgul(false);
    if (r.ok) { setGuncelleme(r.veri.guncelleme as string); setMesaj({ tur: "ok", metin: `Kaydedildi. ${GECIKME_NOTU}` }); router.refresh(); return; }
    if (r.status === 409 && r.veri.benzerler?.length) { setBenzerler(r.veri.benzerler); return; }
    setMesaj({ tur: "hata", metin: r.veri.error ?? "Kaydedilemedi" });
  }

  async function durum(islem: "pasif" | "aktif") {
    if (islem === "pasif" && !confirm("Araç katalogdan kaldırılsın mı? Sayfa açık kalır; yeni yorum, soru, garaj ve favori kapanır.")) return;
    setMesgul(true); setMesaj(null);
    const r = await apiIstek(`/api/admin/katalog/urunler/${urun.id}/durum`, "POST", { islem, neden: neden || null });
    setMesgul(false);
    if (r.ok) { setMesaj({ tur: "ok", metin: `Güncellendi. ${GECIKME_NOTU}` }); router.refresh(); return; }
    setMesaj({ tur: "hata", metin: r.veri.error ?? "İşlem yapılamadı" });
  }

  async function sil() {
    setMesgul(true); setMesaj(null);
    const r = await apiIstek(`/api/admin/katalog/urunler/${urun.id}`, "DELETE", { onayMetni: silOnay });
    setMesgul(false);
    if (r.ok) { router.push("/admin/katalog"); router.refresh(); return; }
    setMesaj({ tur: "hata", metin: r.veri.error ?? "Silinemedi" });
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h2 className="text-lg font-bold text-gray-900 break-words min-w-0">{urun.name}</h2>
          {pasif && <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Pasif</span>}
          {urun.status === "PENDING" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Öneri bekliyor</span>}
          {urun.status === "REJECTED" && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Reddedildi</span>}
        </div>
        <p className="text-xs text-gray-400 break-all">{KATEGORI_ETIKETI[urun.kategori]} · /araclar/{urun.slug} (adres değişmez)</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void kaydet(false); }} className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Düzelt</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">Marka<input className={alan} value={f.marka} onChange={(e) => ayarla("marka", e.target.value)} required /></label>
          <label className="block text-sm">Model<input className={alan} value={f.model} onChange={(e) => ayarla("model", e.target.value)} required /></label>
          <label className="block text-sm">Versiyon<input className={alan} value={f.versiyon} onChange={(e) => ayarla("versiyon", e.target.value)} /></label>
          <label className="block text-sm">Donanım paketi<input className={alan} value={f.paket} onChange={(e) => ayarla("paket", e.target.value)} /></label>
          <label className="block text-sm">Model yılı<input className={alan} inputMode="numeric" value={f.yil} onChange={(e) => ayarla("yil", e.target.value.replace(/\D/g, "").slice(0, 4))} required /></label>
          {motorlu && (
            <>
              <label className="block text-sm">Yakıt
                <select className={alan} value={f.yakit} onChange={(e) => ayarla("yakit", e.target.value)}>
                  <option value="">—</option>
                  {Object.entries(YAKIT_ETIKETI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="block text-sm">Vites
                <select className={alan} value={f.vites} onChange={(e) => ayarla("vites", e.target.value)}>
                  <option value="">—</option>
                  {VITESLER.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            </>
          )}
        </div>
        {benzerler && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
            <p className="font-semibold mb-1">Benzer adlar bulundu — yazım hatası olabilir:</p>
            <ul className="list-disc pl-5 mb-2">{benzerler.map((b) => <li key={b}>{b}</li>)}</ul>
            <button type="button" disabled={mesgul} onClick={() => void kaydet(true)} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium disabled:opacity-50">Yine de kaydet</button>
          </div>
        )}
        <button disabled={mesgul} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-50">Kaydet</button>
        <p className="text-xs text-gray-400">Kategori değiştirilemez. Marka/model adı burada yalnız bu aracı etkiler; tüm marka/model için “Marka / Model” sekmesini kullanın.</p>
      </form>

      {mesaj && (
        <p role="status" className={`text-sm ${mesaj.tur === "ok" ? "text-green-700" : "text-red-600"}`}>{mesaj.metin}</p>
      )}

      {urun.status === "ACTIVE" && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Katalog durumu</h3>
          <input className={alan} placeholder="Neden (isteğe bağlı, denetim kaydına yazılır)" value={neden} maxLength={300} onChange={(e) => setNeden(e.target.value)} />
          {yayinda ? (
            <button disabled={mesgul} onClick={() => void durum("pasif")} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium disabled:opacity-50">Katalogdan kaldır (pasife al)</button>
          ) : (
            <button disabled={mesgul} onClick={() => void durum("aktif")} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium disabled:opacity-50">Kataloğa geri al</button>
          )}
        </div>
      )}

      <div className="bg-white border border-red-100 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-red-700">Kalıcı sil</h3>
        {bagli.length > 0 ? (
          <p className="text-sm text-gray-600">
            Bağlı kayıtlar var, silinemez: {bagli.map(([k, v]) => `${v} ${BAG_ETIKETI[k] ?? k}`).join(", ")}. Bunun yerine pasife alabilirsiniz.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600">Geri alınamaz. Onaylamak için aracın adresini yazın: <code className="break-all bg-gray-100 px-1 rounded">{urun.slug}</code></p>
            <input className={alan} value={silOnay} onChange={(e) => setSilOnay(e.target.value)} placeholder="Araç adresi (slug)" />
            <button disabled={mesgul || silOnay.trim() !== urun.slug} onClick={() => void sil()} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-40">Kalıcı olarak sil</button>
          </>
        )}
      </div>
    </div>
  );
}
