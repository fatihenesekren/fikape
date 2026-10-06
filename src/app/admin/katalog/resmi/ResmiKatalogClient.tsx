"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { KatalogMarkaDosyasi } from "@/lib/katalog/tipler";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { apiIstek, GECIKME_NOTU, KATEGORI_ETIKETI } from "../istek";

export interface KatalogSecenek { marka: string; dosya: string; modeller: { ad: string; versiyonlar: string[] }[] }
export interface Kayit { id: number; kategori: string; scope: "BRAND" | "MODEL" | "TRIM"; etiket: string; yetim: boolean }

const alan = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";
const SCOPE_ETIKETI = { BRAND: "Marka", MODEL: "Model", TRIM: "Versiyon" } as const;

export function ResmiKatalogClient({ secenekler, kayitlar }: { secenekler: Record<string, KatalogSecenek[]>; kayitlar: Kayit[] }) {
  const router = useRouter();
  const [kategori, setKategori] = useState("otomobil");
  const [marka, setMarka] = useState("");
  const [model, setModel] = useState("");
  const [versiyon, setVersiyon] = useState("");
  const [paket, setPaket] = useState("");
  const [dosyaVersiyonlari, setDosyaVersiyonlari] = useState<{ model: string; liste: { v: string; p: string[] }[] } | null>(null);
  const [mesaj, setMesaj] = useState<{ tur: "ok" | "hata"; metin: string } | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const [markaOnayAcik, setMarkaOnayAcik] = useState(false);

  const markalar = secenekler[kategori] ?? [];
  const markaSecenek = markalar.find((m) => m.marka === marka);
  const modelSecenek = markaSecenek?.modeller.find((m) => m.ad === model);
  const legacy = !(["otomobil", "kamyonet", "motosiklet"] as string[]).includes(kategori);
  const dosyaYolu = markaSecenek?.dosya ?? "";

  // Motorlu kategorilerde versiyon/donanım listesi marka dosyasından gelir
  useEffect(() => {
    if (legacy || !dosyaYolu || !model) return;
    let iptal = false;
    fetch(dosyaYolu)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: KatalogMarkaDosyasi | null) => {
        if (iptal || !d) return;
        const mo = d.modeller.find((x) => x.ad === model);
        const harita = new Map<string, Set<string>>();
        for (const t of mo?.tipler ?? []) {
          if (t.e) continue;
          const s = harita.get(t.v) ?? new Set<string>();
          if (t.p) s.add(t.p);
          harita.set(t.v, s);
        }
        setDosyaVersiyonlari({ model, liste: [...harita.entries()].map(([v, p]) => ({ v, p: [...p] })) });
      })
      .catch(() => {});
    return () => { iptal = true; };
  }, [legacy, dosyaYolu, model]);

  const versiyonListesi = legacy
    ? (modelSecenek?.versiyonlar ?? []).map((v) => ({ v, p: [] as string[] }))
    : dosyaVersiyonlari?.model === model ? dosyaVersiyonlari.liste.filter((x) => x.v) : [];
  const paketListesi = versiyonListesi.find((x) => x.v === versiyon)?.p ?? [];

  // Marka gizleme tüm modelleri etkilediği için önce ConfirmDialog ile onay istenir (tarayıcı confirm() kullanılmaz).
  function gizle(scope: "BRAND" | "MODEL" | "TRIM") {
    if (scope === "BRAND") { setMarkaOnayAcik(true); return; }
    void gizleUygula(scope);
  }

  async function gizleUygula(scope: "BRAND" | "MODEL" | "TRIM") {
    setMesgul(true); setMesaj(null);
    const r = await apiIstek("/api/admin/katalog/override", "POST", {
      kategori, scope, marka,
      model: scope === "BRAND" ? undefined : model,
      versiyon: scope === "TRIM" && versiyon ? versiyon : undefined,
      paket: scope === "TRIM" && paket ? paket : undefined,
      onay: scope === "BRAND",
    });
    setMesgul(false);
    if (r.ok) { setMesaj({ tur: "ok", metin: `Gizlendi. ${GECIKME_NOTU}` }); router.refresh(); return; }
    setMesaj({ tur: "hata", metin: r.veri.error ?? "Yapılamadı" });
  }

  async function geriAl(id: number) {
    setMesgul(true); setMesaj(null);
    const r = await apiIstek("/api/admin/katalog/override", "DELETE", { id });
    setMesgul(false);
    if (r.ok) { setMesaj({ tur: "ok", metin: `Gizleme kaldırıldı. ${GECIKME_NOTU}` }); router.refresh(); return; }
    setMesaj({ tur: "hata", metin: r.veri.error ?? "Yapılamadı" });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Resmi katalogdaki yanlış veya istenmeyen marka, model ve versiyonları formlardan gizleyin. Silinmez, geri alınabilir. Yalnız formlarda seçenek olarak görünmez; mevcut araç sayfaları etkilenmez
        (veritabanındaki araçlar için “Araçlar” sekmesinden pasife alma kullanılır).
      </p>

      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <label className="block text-sm">Kategori
          <select className={alan} value={kategori} onChange={(e) => { setKategori(e.target.value); setMarka(""); setModel(""); setVersiyon(""); setPaket(""); }}>
            {Object.keys(secenekler).map((k) => <option key={k} value={k}>{KATEGORI_ETIKETI[k]}</option>)}
          </select>
        </label>
        <label className="block text-sm">Marka
          <select className={alan} value={marka} onChange={(e) => { setMarka(e.target.value); setModel(""); setVersiyon(""); setPaket(""); }}>
            <option value="">Seçiniz</option>
            {markalar.map((m) => <option key={m.marka} value={m.marka}>{m.marka}</option>)}
          </select>
        </label>
        {marka && (
          <label className="block text-sm">Model (isteğe bağlı)
            <select className={alan} value={model} onChange={(e) => { setModel(e.target.value); setVersiyon(""); setPaket(""); }}>
              <option value="">—</option>
              {markaSecenek?.modeller.map((m) => <option key={m.ad} value={m.ad}>{m.ad}</option>)}
            </select>
          </label>
        )}
        {model && versiyonListesi.length > 0 && (
          <label className="block text-sm">Versiyon (isteğe bağlı)
            <select className={alan} value={versiyon} onChange={(e) => { setVersiyon(e.target.value); setPaket(""); }}>
              <option value="">—</option>
              {versiyonListesi.map((x) => <option key={x.v} value={x.v}>{x.v}</option>)}
            </select>
          </label>
        )}
        {versiyon && paketListesi.length > 0 && (
          <label className="block text-sm">Donanım (boş = tüm donanımlar)
            <select className={alan} value={paket} onChange={(e) => setPaket(e.target.value)}>
              <option value="">Tümü</option>
              {paketListesi.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <button disabled={mesgul || !marka || !!model} onClick={() => gizle("BRAND")} className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium disabled:opacity-40">Markayı gizle</button>
          <button disabled={mesgul || !model || !!versiyon} onClick={() => gizle("MODEL")} className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium disabled:opacity-40">Modeli gizle</button>
          <button disabled={mesgul || !model || !versiyon} onClick={() => gizle("TRIM")} className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium disabled:opacity-40">{paket ? "Donanımı gizle" : "Versiyonu gizle"}</button>
        </div>
      </div>

      {mesaj && <p role="status" className={`text-sm ${mesaj.tur === "ok" ? "text-green-700" : "text-red-600"}`}>{mesaj.metin}</p>}

      <div>
        <h2 className="font-semibold text-gray-900 mb-2">Gizlenenler ({kayitlar.length})</h2>
        <ul className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-xl">
          {kayitlar.map((k) => (
            <li key={k.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 break-words">{k.etiket}</p>
                <p className="text-xs text-gray-400">{KATEGORI_ETIKETI[k.kategori]} · {SCOPE_ETIKETI[k.scope]}</p>
                {k.yetim && <p className="text-xs text-amber-700">Uyarı: Bu kayıt resmi katalogda artık bulunmuyor (katalog güncellenmiş olabilir); etkisizdir.</p>}
              </div>
              <button disabled={mesgul} onClick={() => void geriAl(k.id)} className="shrink-0 text-sm px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40">Geri al</button>
            </li>
          ))}
          {kayitlar.length === 0 && <li className="px-4 py-8 text-sm text-gray-400 text-center">Gizlenen yok.</li>}
        </ul>
      </div>

      <ConfirmDialog
        open={markaOnayAcik}
        title="Marka gizlensin mi?"
        description={`${marka} markasının tüm resmi modelleri formlardan kalkacak. Silinmez, daha sonra geri alınabilir.`}
        confirmLabel="Markayı gizle"
        loading={mesgul}
        onConfirm={() => { setMarkaOnayAcik(false); void gizleUygula("BRAND"); }}
        onCancel={() => setMarkaOnayAcik(false)}
      />
    </div>
  );
}
