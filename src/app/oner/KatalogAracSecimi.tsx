"use client";

// Araç Öner — otomobil/kamyonet seçimi (TSB tabanlı katalog).
// Marka → Model → Yıl → Versiyon → Donanım Paketi → Yakıt → Vites.
// Her adım gerçek tiplere göre daralır; yakıt/vites yalnız kaynak kesin söylüyorsa
// kilitlenir, aksi halde kullanıcıya sorulur (bkz. src/lib/katalog/secim.ts).
// Marka dosyası (public/katalog/…) yalnız marka seçilince indirilir.

import { useEffect, useState } from "react";
import katalogIndex from "@/data/katalogIndex.json";
import type { KatalogIndex, KatalogKategori, KatalogMarkaDosyasi } from "@/lib/katalog/tipler";
import {
  modelYillari, ortakBeygir, paketSecenekleri, paketeGore, trimAdi,
  versiyonSecenekleri, versiyonaGore, versiyonBilgisiVarMi, vitesDurumu, yakitDurumu, yilNesilleri, yilTipleri, BUGUN_YIL,
  type AlanDurumu,
} from "@/lib/katalog/secim";
import { formatVersionLabel, parseVersion, versionForTrimName } from "@/lib/parseVersion";

const INDEX = katalogIndex as KatalogIndex;
const DIGER_MARKA = "Diğer / Bulamadım";
const DIGER = "Diğer";
const LISTEDE_YOK = "Listede yok";

const TUM_YAKITLAR = [
  { value: "GASOLINE", label: "Benzin" },
  { value: "DIESEL", label: "Dizel" },
  { value: "EV", label: "Elektrikli (EV)" },
  { value: "PHEV", label: "Plug-in Hibrit (PHEV)" },
  { value: "HYBRID", label: "Hibrit" },
  { value: "LPG", label: "LPG" },
];
/** Motosiklette dizel/hibrit/LPG fiilen yok — serbest seçimde yalnız bunlar sunulur. */
export const YAKITLAR: Record<KatalogKategori, { value: string; label: string }[]> = {
  otomobil: TUM_YAKITLAR,
  kamyonet: TUM_YAKITLAR,
  motosiklet: TUM_YAKITLAR.filter((o) => o.value === "GASOLINE" || o.value === "EV"),
};
const VITESLER: Record<KatalogKategori, { value: string; label: string }[]> = {
  otomobil: [
    { value: "Manuel", label: "Manuel" },
    { value: "Otomatik", label: "Otomatik" },
    { value: "CVT", label: "CVT" },
    { value: "Yarı Otomatik", label: "Yarı Otomatik" },
  ],
  kamyonet: [
    { value: "Manuel", label: "Manuel" },
    { value: "Otomatik", label: "Otomatik" },
    { value: "CVT", label: "CVT" },
    { value: "Yarı Otomatik", label: "Yarı Otomatik" },
  ],
  motosiklet: [
    { value: "Manuel", label: "Manuel" },
    { value: "Otomatik", label: "Otomatik" },
  ],
};
const TUM_YILLAR = Array.from({ length: BUGUN_YIL - 1990 + 1 }, (_, i) => BUGUN_YIL - i);

export interface KatalogSecimSonucu {
  brandName: string;
  modelName: string;
  year: string;
  trimName: string;
  fuelType: string;
  transmission: string;
  powerHp: number | null;
}

const selectCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white";
const inputCls = "mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400";
const labelCls = "block text-xs font-semibold text-gray-700 mb-1";

function Alan({ label, zorunlu, children }: { label: string; zorunlu?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className={labelCls}>
        {label} {zorunlu && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function durumSecenekleri<T extends string>(
  durum: AlanDurumu<T>,
  tum: { value: string; label: string }[],
): { value: string; label: string }[] {
  if ("secenekler" in durum) return tum.filter((o) => (durum.secenekler as string[]).includes(o.value));
  return tum;
}

export default function KatalogAracSecimi({
  kategori,
  baslangicMarka = "",
  baslangicModel = "",
  baslangicOzelModel = "",
  onChange,
}: {
  kategori: KatalogKategori;
  baslangicMarka?: string;
  baslangicModel?: string;
  baslangicOzelModel?: string;
  onChange: (s: KatalogSecimSonucu) => void;
}) {
  const markalar = INDEX[kategori];

  const [marka, setMarka] = useState(baslangicMarka);
  const [ozelMarka, setOzelMarka] = useState("");
  const [model, setModel] = useState(baslangicModel);
  const [ozelModel, setOzelModel] = useState(baslangicOzelModel);
  const [yil, setYil] = useState("");
  const [nesilAd, setNesilAd] = useState("");
  const [versiyon, setVersiyon] = useState("");
  const [ozelVersiyon, setOzelVersiyon] = useState("");
  const [paket, setPaket] = useState("");
  const [ozelPaket, setOzelPaket] = useState("");
  const [yakitSecim, setYakitSecim] = useState("");
  const [vitesSecim, setVitesSecim] = useState("");

  // Marka dosyası — yalnız marka seçilince indirilir
  const markaGirdisi = markalar.find((m) => m.marka === marka);
  const [dosya, setDosya] = useState<{ yol: string; veri: KatalogMarkaDosyasi } | null>(null);
  const [dosyaHata, setDosyaHata] = useState(false);
  useEffect(() => {
    if (!markaGirdisi?.dosya) return;
    let iptal = false;
    const yol = markaGirdisi.dosya;
    fetch(yol)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((veri: KatalogMarkaDosyasi) => { if (!iptal) { setDosya({ yol, veri }); setDosyaHata(false); } })
      .catch(() => { if (!iptal) setDosyaHata(true); });
    return () => { iptal = true; };
  }, [markaGirdisi?.dosya]);
  const markaDosyasi = dosya && dosya.yol === markaGirdisi?.dosya ? dosya.veri : null;

  const digerMarka = marka === DIGER_MARKA;
  const digerModel = model === DIGER;
  const modelObj = markaDosyasi?.modeller.find((m) => m.ad === model) ?? null;
  const yillar = modelObj ? modelYillari(modelObj) : TUM_YILLAR;
  const yilSayi = yil ? Number(yil) : null;

  // ─── TSB modu (yıl için gerçek tipler var) ────────────────────────────
  const tsbTipler = modelObj && yilSayi ? yilTipleri(modelObj, yilSayi) : [];
  const tsbModu = tsbTipler.length > 0;
  const t1 = tsbTipler;
  const versiyonlar = versiyonSecenekleri(t1);
  const etkinVersiyon = versiyonlar.length === 1 ? versiyonlar[0] : versiyon;
  const versiyonListedeYok = versiyon === LISTEDE_YOK;
  const t2 = etkinVersiyon && !versiyonListedeYok ? versiyonaGore(t1, etkinVersiyon) : [];
  const paketler = paketSecenekleri(t2);
  const etkinPaket = paketler.length === 1 ? paketler[0] : paket;
  const paketListedeYok = paket === LISTEDE_YOK;
  const t3 = etkinPaket && !paketListedeYok ? paketeGore(t2, etkinPaket) : t2;

  // ─── Eski katalog modu (TSB öncesi yıl ya da TSB'de olmayan model) ──────
  const nesiller = modelObj && yilSayi && !tsbModu ? yilNesilleri(modelObj, yilSayi) : [];
  const nesil = nesiller.length === 1 ? nesiller[0] : nesiller.find((n) => n.ad === nesilAd) ?? null;
  const elVersiyonlar = nesil?.el?.versiyonlar ?? [];
  const elPaketler =
    (versiyon && versiyon !== DIGER ? nesil?.el?.paketlerVersiyona?.[versiyon] : undefined) ?? nesil?.el?.paketler ?? [];

  // ─── Yakıt / vites ────────────────────────────────────────────────────
  const tipTamam = tsbModu && t2.length > 0;
  const yakit: AlanDurumu<string> = tipTamam ? yakitDurumu(t3) : { serbest: true };
  const vites: AlanDurumu<string> = tipTamam ? vitesDurumu(t3) : { serbest: true };
  const yakitSecenek = durumSecenekleri(yakit, YAKITLAR[kategori]);
  const vitesSecenek = durumSecenekleri(vites, VITESLER[kategori]);
  // Katalog kesin biliyorsa (kilitli) bunu bir öneri olarak sunar ama alan
  // kilitlenmez — tüm seçeneklerle serbestçe değiştirilebilir, kullanıcı kendi
  // aracını daha iyi biliyor olabilir.
  const yakitListesi = "kilitli" in yakit ? YAKITLAR[kategori] : yakitSecenek;
  const vitesListesi = "kilitli" in vites ? VITESLER[kategori] : vitesSecenek;
  const etkinYakit =
    "kilitli" in yakit ? (yakitSecim || yakit.kilitli)
      : yakitListesi.some((o) => o.value === yakitSecim) ? yakitSecim : "";
  const etkinVites =
    "kilitli" in vites ? (vitesSecim || vites.kilitli)
      : vitesListesi.some((o) => o.value === vitesSecim) ? vitesSecim : "";

  // ─── Sonuç ────────────────────────────────────────────────────────────
  // React Compiler önbelleğe alır — elle useMemo gerekmiyor
  const sonuc: KatalogSecimSonucu = (() => {
    let versiyonMetni = "", paketMetni = "", hp: number | null = null;
    if (tsbModu) {
      versiyonMetni = versiyonListedeYok ? ozelVersiyon.trim() : t2[0]?.v ?? "";
      paketMetni = paketListedeYok ? ozelPaket.trim() : etkinPaket;
      hp = versiyonListedeYok ? null : ortakBeygir(t3);
    } else {
      const v = versiyon === DIGER ? ozelVersiyon.trim() : versiyon;
      versiyonMetni = v && versiyon !== DIGER ? versionForTrimName(v, kategori) : v;
      paketMetni = paket === DIGER ? ozelPaket.trim() : paket;
      hp = versiyon && versiyon !== DIGER ? parseVersion(versiyon, kategori).hp : null;
    }
    return {
      brandName: digerMarka ? ozelMarka.trim() : marka,
      modelName: digerMarka || digerModel ? ozelModel.trim() : model,
      year: yil,
      trimName: trimAdi(versiyonMetni || null, paketMetni || null),
      fuelType: etkinYakit,
      transmission: etkinVites,
      powerHp: hp,
    };
  })();

  const sonucAnahtar = JSON.stringify(sonuc);
  useEffect(() => { onChange(sonuc); }, [sonucAnahtar]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sıfırlayıcılar (bir üst seçim değişince alttakiler temizlenir) ─────
  const altlariTemizle = (seviye: "marka" | "model" | "yil" | "versiyon" | "paket") => {
    const sira = ["marka", "model", "yil", "versiyon", "paket"];
    const i = sira.indexOf(seviye);
    if (i < 1) { setModel(""); setOzelModel(""); }
    if (i < 2) { setYil(""); setNesilAd(""); }
    if (i < 3) { setVersiyon(""); setOzelVersiyon(""); }
    if (i < 4) { setPaket(""); setOzelPaket(""); }
    setYakitSecim(""); setVitesSecim("");
  };

  return (
    <>
      <Alan label="Marka" zorunlu>
        <select value={marka} onChange={(e) => { setMarka(e.target.value); setOzelMarka(""); altlariTemizle("marka"); }} className={selectCls}>
          <option value="">— Marka seçin —</option>
          {markalar.map((m) => <option key={m.marka} value={m.marka}>{m.marka}</option>)}
        </select>
        {digerMarka && (
          <input type="text" value={ozelMarka} onChange={(e) => setOzelMarka(e.target.value)}
            placeholder="Marka adını yazınız" className={inputCls} autoFocus />
        )}
      </Alan>

      {marka && (
        <Alan label="Model" zorunlu>
          {digerMarka ? (
            <input type="text" value={ozelModel} onChange={(e) => setOzelModel(e.target.value)}
              placeholder="Model adını yazınız" className={inputCls.replace("mt-2 ", "")} />
          ) : dosyaHata ? (
            <p className="text-sm text-red-600">Model listesi yüklenemedi. Sayfayı yenileyip tekrar deneyiniz.</p>
          ) : !markaDosyasi ? (
            <p className="text-sm text-gray-400">Modeller yükleniyor…</p>
          ) : (
            <>
              <select value={model} onChange={(e) => { setModel(e.target.value); altlariTemizle("model"); }} className={selectCls}>
                <option value="">— Model seçin —</option>
                {markaDosyasi.modeller.map((m) => <option key={m.ad} value={m.ad}>{m.ad}</option>)}
                <option value={DIGER}>{DIGER} (listede yok)</option>
              </select>
              {digerModel && (
                <input type="text" value={ozelModel} onChange={(e) => setOzelModel(e.target.value)}
                  placeholder="Model adını yazınız" className={inputCls} autoFocus />
              )}
            </>
          )}
        </Alan>
      )}

      {(modelObj || digerModel || digerMarka) && (
        <Alan label="Model Yılı">
          <select value={yil} onChange={(e) => { setYil(e.target.value); altlariTemizle("yil"); }} className={selectCls}>
            <option value="">— Seçin —</option>
            {yillar.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Alan>
      )}

      {/* TSB modu — Kasa Tipi adımı kaldırıldı (bkz. kullanıcı geri bildirimi,
          2026-09-26): TSB kasayı yalnız modelin azınlık gövde varyantını ayırt
          etmek için yazıyor, bu yüzden ör. Corolla'da "Sedan" hiç seçenek olarak
          çıkmıyordu ve kasa zaten kalıcı veriye (KatalogSecimSonucu) hiç girmiyordu. */}

      {/* Kaynakta bu model için hiçbir motor/beygir bilgisi yoksa (yalnız paketle
          ayrışıyor) boş "Versiyon belirtilmemiş" alanı göstermenin anlamı yok —
          adım atlanır, doğrudan Donanım Paketi'ne geçilir. */}
      {tsbModu && versiyonBilgisiVarMi(t1) && (
        <Alan label="Versiyon">
          {/* Tek seçenekte de select: önceden seçili gelir, "Listede yok" ile kaçış mümkün */}
          {(
            <select value={versiyon || (versiyonlar.length === 1 ? versiyonlar[0] : "")} onChange={(e) => { setVersiyon(e.target.value); altlariTemizle("versiyon"); }} className={selectCls}>
              {versiyonlar.length > 1 && <option value="">— Seçin —</option>}
              {versiyonlar.map((v) => <option key={v} value={v}>{v}</option>)}
              <option value={LISTEDE_YOK}>{LISTEDE_YOK}</option>
            </select>
          )}
          {versiyonListedeYok && (
            <input type="text" value={ozelVersiyon} onChange={(e) => setOzelVersiyon(e.target.value)}
              placeholder="Versiyon bilgisi yazınız (örn. 1.6 dizel)" className={inputCls} autoFocus />
          )}
        </Alan>
      )}

      {tsbModu && t2.length > 0 && (
        <Alan label="Donanım Paketi">
          {(
            <select value={paket || (paketler.length === 1 ? paketler[0] : "")} onChange={(e) => { setPaket(e.target.value); altlariTemizle("paket"); }} className={selectCls}>
              {paketler.length > 1 && <option value="">— Seçin —</option>}
              {paketler.map((p) => <option key={p} value={p}>{p}</option>)}
              <option value={LISTEDE_YOK}>{LISTEDE_YOK}</option>
            </select>
          )}
          {paketListedeYok && (
            <input type="text" value={ozelPaket} onChange={(e) => setOzelPaket(e.target.value)}
              placeholder="Donanım paketi yazınız" className={inputCls} autoFocus />
          )}
        </Alan>
      )}

      {/* Eski katalog modu (2012 öncesi / TSB'de olmayan model) */}
      {!tsbModu && nesiller.length > 1 && (
        <Alan label="Nesil">
          <select value={nesilAd} onChange={(e) => { setNesilAd(e.target.value); altlariTemizle("yil"); }} className={selectCls}>
            <option value="">— Seçin —</option>
            {nesiller.map((n) => <option key={n.ad} value={n.ad}>{n.ad}</option>)}
          </select>
        </Alan>
      )}

      {!tsbModu && (nesil || digerModel || digerMarka) && yil && (
        <>
          {elVersiyonlar.length > 0 ? (
            <Alan label="Versiyon">
              <select value={versiyon} onChange={(e) => { setVersiyon(e.target.value); altlariTemizle("versiyon"); }} className={selectCls}>
                <option value="">— Seçin (opsiyonel) —</option>
                {elVersiyonlar.map((v) => <option key={v} value={v}>{v === DIGER ? v : formatVersionLabel(v, kategori)}</option>)}
              </select>
              {versiyon === DIGER && (
                <input type="text" value={ozelVersiyon} onChange={(e) => setOzelVersiyon(e.target.value)}
                  placeholder="Versiyon bilgisi yazınız" className={inputCls} autoFocus />
              )}
            </Alan>
          ) : (
            <Alan label="Versiyon">
              <input type="text" value={ozelVersiyon} onChange={(e) => { setOzelVersiyon(e.target.value); setVersiyon(DIGER); }}
                placeholder="Versiyon bilgisi yazınız (opsiyonel)" className={inputCls.replace("mt-2 ", "")} />
            </Alan>
          )}
          {elPaketler.length > 0 ? (
            <Alan label="Donanım Paketi">
              <select value={paket} onChange={(e) => { setPaket(e.target.value); setOzelPaket(""); }} className={selectCls}>
                <option value="">— Seçin (opsiyonel) —</option>
                {elPaketler.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {paket === DIGER && (
                <input type="text" value={ozelPaket} onChange={(e) => setOzelPaket(e.target.value)}
                  placeholder="Donanım paketi yazınız" className={inputCls} autoFocus />
              )}
            </Alan>
          ) : (
            <Alan label="Donanım Paketi">
              <input type="text" value={ozelPaket} onChange={(e) => { setOzelPaket(e.target.value); setPaket(DIGER); }}
                placeholder="Donanım paketi yazınız (opsiyonel)" className={inputCls.replace("mt-2 ", "")} />
            </Alan>
          )}
        </>
      )}

      {/* TSB modunda yakıt/vites versiyon seçilince açılır. Katalog kesin
          biliyorsa değer öneri olarak önceden seçili gelir ama alan kilitli
          değildir — kullanıcı serbestçe değiştirebilir. */}
      {yil && (!tsbModu || t2.length > 0 || versiyonListedeYok) && (
        <div className="grid grid-cols-2 gap-3">
          <Alan label="Yakıt Tipi">
            <select value={etkinYakit} onChange={(e) => setYakitSecim(e.target.value)} className={selectCls}>
              <option value="">— Seçin —</option>
              {yakitListesi.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Alan>
          <Alan label="Vites Tipi">
            <select value={etkinVites} onChange={(e) => setVitesSecim(e.target.value)} className={selectCls}>
              <option value="">— Seçin —</option>
              {vitesListesi.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Alan>
        </div>
      )}
    </>
  );
}
