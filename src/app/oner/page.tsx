"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import vehiclesData from "@/data/vehicles.json";
import { parseVersion, formatVersionLabel, versionForTrimName } from "@/lib/parseVersion";
import { MODEL_GEN_RANGE_RE } from "@/lib/modelDisplay";
import { resolveOnerPrefill, type OnerCategoryKey } from "@/lib/onerPrefill";
import type { ExistingVehicleMatch } from "@/lib/existingVehicle";
import { birebirAyniArac } from "@/lib/aracKarsilastir";
import { legacySuz, type GizliKayit } from "@/lib/katalog/override";
import { ekYilGecerli, legacyBirlestir, type EkMarkaVeri, type LegacyMake } from "@/lib/katalog/ek";
import { PAKET_YOK, VERSIYON_YOK } from "@/lib/katalog/secim";
import KatalogAracSecimi, { type KatalogSecimSonucu } from "./KatalogAracSecimi";

const CATEGORIES = [
  { value: "otomobil",   label: "Otomobil" },
  { value: "motosiklet", label: "Motosiklet" },
  { value: "e-scooter",  label: "E-Scooter" },
  { value: "e-bisiklet", label: "E-Bisiklet" },
  { value: "karavan",    label: "Karavan" },
  { value: "kamyonet",   label: "Kamyonet" },
] as const;

const FUEL_TYPES: Record<string, { value: string; label: string }[]> = {
  otomobil: [
    { value: "GASOLINE", label: "Benzin" },
    { value: "DIESEL",   label: "Dizel" },
    { value: "EV",       label: "Elektrikli (EV)" },
    { value: "PHEV",     label: "Plug-in Hibrit (PHEV)" },
    { value: "HYBRID",   label: "Hibrit" },
    { value: "LPG",      label: "LPG" },
  ],
  motosiklet: [
    { value: "GASOLINE", label: "Benzin" },
    { value: "EV",       label: "Elektrikli" },
  ],
  kamyonet: [
    { value: "GASOLINE", label: "Benzin" },
    { value: "DIESEL",   label: "Dizel" },
    { value: "EV",       label: "Elektrikli" },
    { value: "PHEV",     label: "Plug-in Hibrit (PHEV)" },
    { value: "HYBRID",   label: "Hibrit" },
    { value: "LPG",      label: "LPG" },
  ],
};

// "Bu araç zaten fikape'de" kartında yakıt kodunu ("GASOLINE") okunur etikete
// çevirmek için — kategoriden bağımsız düz harita (kart hangi kategoriden
// geldiği bilinmeden render ediliyor).
const FUEL_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(FUEL_TYPES).flat().map((f) => [f.value, f.label]),
);

const TRANSMISSIONS: Record<string, { value: string; label: string }[]> = {
  otomobil: [
    { value: "Manuel",        label: "Manuel" },
    { value: "Otomatik",      label: "Otomatik" },
    { value: "CVT",           label: "CVT" },
    { value: "Yarı Otomatik", label: "Yarı Otomatik" },
  ],
  motosiklet: [
    { value: "Manuel",   label: "Manuel" },
    { value: "Otomatik", label: "Otomatik" },
  ],
  kamyonet: [
    { value: "Manuel",        label: "Manuel" },
    { value: "Otomatik",      label: "Otomatik" },
    { value: "Yarı Otomatik", label: "Yarı Otomatik" },
  ],
};

// Model yılı listesinin alt sınırı (kategori bazlı): elektrikli scooter/bisiklet 1990'larda henüz yok denecek kadar azdı.
// Daha eski bir yıl gerekirse "Diğer" ile yıl yazılabilir (ekYilGecerli: 1900+).
const YIL_TABANI: Record<string, number> = { "e-scooter": 2000, "e-bisiklet": 1995 };
const yilListesi = (kategori: string) => {
  const bugun = new Date().getFullYear();
  const taban = YIL_TABANI[kategori] ?? 1990;
  return Array.from({ length: bugun - taban + 1 }, (_, i) => bugun - i);
};

// Model adının sonundaki "(2004-2012)" / "(2020-)" gibi nesil aralığını ayıklar
function getModelYearRange(modelName: string): [number, number] | null {
  const match = modelName.match(MODEL_GEN_RANGE_RE);
  if (!match) return null;
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : new Date().getFullYear();
  return [start, end];
}

// Versiyon metninden (motor kodundan) muhtemel yakıt tipini tahmin eder — kullanıcı isterse değiştirebilir
function detectFuelType(version: string): string | null {
  const v = version.toUpperCase();
  if (v.includes("KWH") || v.includes("ELECTRIC") || v.includes("ELEKTRİK") || v.includes("ELEKTRIK")) return "EV";
  if (v.includes("PHEV") || v.includes("PLUG-IN")) return "PHEV";
  if (v.includes("HEV") || v.includes("HYBRID") || v.includes("HİBRİT") || v.includes("HIBRIT")) return "HYBRID";
  if (v.includes("LPG") || v.includes("ECO-G")) return "LPG";
  if (
    v.includes("DCI") || v.includes("TDI") || v.includes("CRDI") || v.includes("CDI") || v.includes("DDIS") ||
    v.includes("BLUEHDI") || v.includes("HDI") || v.includes("DIESEL") || v.includes("DİZEL") || v.includes("DIZEL")
  ) return "DIESEL";
  // BMW/Mercedes "d" soneki: 116d, 220d, 400d — büyük harfli "4WD"/"AWD" ile karışmasın diye orijinal (küçük harf) string'de kontrol edilir
  if (/\dd(?![a-zA-Z])/.test(version)) return "DIESEL";
  return "GASOLINE";
}

type CategoryKey = OnerCategoryKey;

export default function OnerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // /arama "eşleşme yok" akışından gelen sorguyu (`?q=`, eski linklerde
  // `?brandName=`) forma çöz. Lazy useState — /oner session çözülene kadar
  // sunucuda "Yükleniyor" render ettiği için form alanlarında hydration
  // uyuşmazlığı riski yok (window sadece istemcide okunur).
  const [prefill] = useState(() =>
    resolveOnerPrefill(typeof window === "undefined" ? "" : window.location.search),
  );

  // "" = seçilmemiş ("— Araç tipi seçin —"). Diğer select'lerle tutarlı +
  //  Marka/Yakıt/Vites listeleri kategoriye bağlı olduğu için önce kategori
  //  seçilsin (bkz. kullanıcı geri bildirimi). Katalog eşleşmesinde önden dolar.
  const [categorySlug, setCategorySlug] = useState<CategoryKey | "">(prefill.categorySlug);
  const [selectedMake, setSelectedMake]   = useState(prefill.selectedMake);
  const [customMake, setCustomMake]       = useState(prefill.customMake);
  const [selectedModel, setSelectedModel] = useState(prefill.selectedModel);
  const [customModel, setCustomModel]     = useState(prefill.customModel);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [customVersion, setCustomVersion]     = useState("");
  const [selectedTrim, setSelectedTrim]   = useState("");
  const [customTrim, setCustomTrim]       = useState("");
  const [year, setYear]         = useState("");
  // Model yılı "Diğer": listede olmayan yıl için sayı kutusu
  const [yearDiger, setYearDiger] = useState(false);
  const [customYear, setCustomYear] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [notes, setNotes]       = useState(prefill.notes);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Katalogda zaten var mı? — marka + model seçilince arka planda kontrol
  // edilir (kullanıcı submit etmeden) ve bilgi amaçlı kart gösterilir. Gerçek
  // engelleme kararı sunucuda veriliyor (bkz. route.ts), bu yalnız UI bilgisi.
  const [existingRaw, setExistingMatches]       = useState<ExistingVehicleMatch[]>([]);
  // Eşleşmeler hangi marka+model için geldi — marka/model değişince eskisi görünmesin.
  const [existingKey, setExistingKey]           = useState("");
  const existingCardRef = useRef<HTMLDivElement>(null);

  // Otomobil/kamyonet: TSB tabanlı katalog (KatalogAracSecimi). Diğer kategoriler
  // henüz eski vehicles.json listesiyle çalışıyor.
  const katalogModu = categorySlug === "otomobil" || categorySlug === "kamyonet" || categorySlug === "motosiklet";
  const [katalogSecim, setKatalogSecim] = useState<KatalogSecimSonucu | null>(null);

  // Statik listesi olmayan kategorilerde (e-scooter/e-bisiklet/karavan) admin onaylı eklemeler canlı katalogdan gelir
  const [ekTum, setEkTum] = useState<{ kategori: string; veri: EkMarkaVeri[] }>({ kategori: "", veri: [] });
  useEffect(() => {
    if (!categorySlug || katalogModu) return;
    let iptal = false;
    fetch(`/api/katalog/ek?kategori=${categorySlug}&tum=1`)
      .then((r) => (r.ok ? r.json() : { markalar: [] }))
      .then((d) => { if (!iptal && Array.isArray(d.markalar)) setEkTum({ kategori: categorySlug, veri: d.markalar }); })
      .catch(() => {});
    return () => { iptal = true; };
  }, [categorySlug, katalogModu]);
  // Yönetici tarafından resmi listeden gizlenenler
  const [gizliLegacy, setGizliLegacy] = useState<{ kategori: string; liste: GizliKayit[] }>({ kategori: "", liste: [] });
  useEffect(() => {
    if (!categorySlug || katalogModu) return;
    let iptal = false;
    fetch(`/api/katalog/duzeltmeler?kategori=${categorySlug}`)
      .then((r) => (r.ok ? r.json() : { gizli: [] }))
      .then((d) => { if (!iptal && Array.isArray(d.gizli)) setGizliLegacy({ kategori: categorySlug, liste: d.gizli }); })
      .catch(() => {});
    return () => { iptal = true; };
  }, [categorySlug, katalogModu]);
  const makes = useMemo<LegacyMake[]>(() => {
    if (!categorySlug || katalogModu) return [];
    const temel = legacySuz(vehiclesData[categorySlug] as unknown as LegacyMake[], gizliLegacy.kategori === categorySlug ? gizliLegacy.liste : []);
    return legacyBirlestir(temel, ekTum.kategori === categorySlug ? ekTum.veri : []);
  }, [categorySlug, katalogModu, ekTum, gizliLegacy]);
  const makeEntry  = makes.find((m) => m.make === selectedMake);
  const models     = (makeEntry?.models ?? []) as {
    name: string;
    versions: string[];
    trims: string[];
    // Opsiyonel — bazı modellerde versiyona göre hangi donanım paketinin
    // gerçekten satıldığı araştırılıp eşlenmiş (örn. "N AWD ..." versiyonu
    // sadece "N" paketiyle gelir). Bu eşleme yoksa (henüz araştırılmamış
    // modeller) tüm `trims` listesi gösterilir — geriye dönük bozulma olmaz.
    trimsByVersion?: Record<string, string[]>;
  }[];
  const modelEntry = models.find((m) => m.name === selectedModel);
  const versions   = modelEntry?.versions ?? [];
  const trimsForSelectedVersion =
    selectedVersion && selectedVersion !== "Diğer"
      ? modelEntry?.trimsByVersion?.[selectedVersion]
      : undefined;
  const trims = trimsForSelectedVersion ?? modelEntry?.trims ?? [];

  const isOtherMake    = selectedMake === "Diğer / Bulamadım";
  const isOtherModel   = selectedModel === "Diğer";
  const isOtherVersion = selectedVersion === "Diğer";
  const isOtherTrim    = selectedTrim === "Diğer";

  // Marka + model katalogdan seçilince: bu araç zaten ACTIVE katalogda mı?
  // (setState yalnızca .then/.finally içinde — senkron effect-body setState yok.)
  const kontrolMarka = katalogModu ? katalogSecim?.brandName ?? "" : isOtherMake ? "" : selectedMake;
  const kontrolModel = katalogModu ? katalogSecim?.modelName ?? "" : isOtherModel ? "" : selectedModel;
  // Kart anahtarı: "Diğer" ile elle yazılan marka/model de dahil (sunucu 409 dönerse kart görünsün).
  const kartMarka = katalogModu ? katalogSecim?.brandName ?? "" : isOtherMake ? customMake.trim() : selectedMake;
  const kartModel = katalogModu ? katalogSecim?.modelName ?? "" : isOtherModel ? customModel.trim() : selectedModel;
  const kartAnahtar = kartMarka && kartModel ? `${kartMarka}|${kartModel}` : "";
  const existingMatches = kartAnahtar && existingKey === kartAnahtar ? existingRaw : [];
  useEffect(() => {
    if (!kontrolMarka || !kontrolModel) return;
    let cancelled = false;
    const brand = kontrolMarka;
    const model = kontrolModel;
    const cat   = categorySlug;
    const t = setTimeout(() => {
      const qs = new URLSearchParams({ brand, model });
      if (cat) qs.set("category", cat);
      fetch(`/api/oneriler/mevcut-mu?${qs.toString()}`)
        .then((r) => (r.ok ? r.json() : { matches: [] }))
        .then((d) => {
          if (!cancelled) {
            setExistingMatches(Array.isArray(d.matches) ? d.matches : []);
            setExistingKey(`${brand}|${model}`);
          }
        })
        .catch(() => { if (!cancelled) setExistingMatches([]); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [kontrolMarka, kontrolModel, categorySlug]);

  function handleCategoryChange(val: string) {
    setCategorySlug(val as CategoryKey | "");
    setSelectedMake(""); setCustomMake("");
    setSelectedModel(""); setCustomModel("");
    setSelectedVersion(""); setCustomVersion("");
    setSelectedTrim(""); setCustomTrim("");
    setYear(""); setYearDiger(false); setCustomYear("");
    setFuelType("");
    setTransmission("");
    setKatalogSecim(null);
    setExistingMatches([]);
  }

  function handleMakeChange(val: string) {
    setSelectedMake(val);
    setCustomMake("");
    setSelectedModel(""); setCustomModel("");
    setSelectedVersion(""); setCustomVersion("");
    setSelectedTrim(""); setCustomTrim("");
    setExistingMatches([]);
  }

  function handleModelChange(val: string) {
    setSelectedModel(val);
    setSelectedVersion(""); setCustomVersion("");
    setSelectedTrim(""); setCustomTrim("");
    setYear(""); setYearDiger(false); setCustomYear("");
    setExistingMatches([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const brandName  = katalogModu ? katalogSecim?.brandName ?? "" : isOtherMake ? customMake.trim() : selectedMake;
    const modelName  = katalogModu ? katalogSecim?.modelName ?? "" : isOtherModel ? customModel.trim() : selectedModel;

    if (!categorySlug) {
      setError("Lütfen araç tipini seçiniz.");
      return;
    }
    if (!brandName || !modelName) {
      setError("Lütfen marka ve model seçiniz.");
      return;
    }

    if (!katalogModu && yearDiger && !year) {
      setError("Lütfen geçerli bir model yılı giriniz.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      // powerHp ayrı: donanım/yakıt/vites'ten farklı olarak kopya kontrolüne
      // girmiyor, yalnız katalogdan/versiyon metninden ayrıştırılan beygir.
      const powerHp = katalogModu
        ? katalogSecim?.powerHp ?? null
        : !isOtherVersion && selectedVersion ? parseVersion(selectedVersion, categorySlug).hp : null;
      // trimName/yıl/yakıt/vites render kapsamında zaten hesaplandı (bkz.
      // secilenTrimName/secilenYil/secilenYakit/secilenVites) — "Aracı Öner"
      // butonu birebirAyniKayit doluyken zaten devre dışı, buraya hiç
      // gelinmez; yine de sunucu kendi karşılaştırmasını (route.ts) bağımsız
      // olarak yapıyor, client'tan bir "onaylıyorum" bayrağı GÖNDERİLMİYOR —
      // böyle bir tasarım denenmişti, marka+model eşleştiği an her gönderiyi,
      // birebir kopyalar dahil, atlatıyordu (bkz. kullanıcı geri bildirimi,
      // 2026-09-27).
      const govde = JSON.stringify({
        brandName, modelName, categorySlug, notes, powerHp,
        trimName: secilenTrimName, year: secilenYil, fuelType: secilenYakit, transmission: secilenVites,
      });
      const gonder = () => fetch("/api/oneriler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: govde,
      });
      // Geçici ağ kopmasında ("Failed to fetch") bir kez daha dene. Güvenli: sunucu aynı marka/model/yıl/donanım
      // için kopya üretmez (409 / mevcut PENDING kaydı), günlük limit de ayrıca geçerli.
      let res: Response;
      try {
        res = await gonder();
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          res = await gonder();
        } catch {
          throw new Error("Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyiniz.");
        }
      }
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = text ? JSON.parse(text) : {}; } catch { throw new Error("Sunucu geçersiz yanıt döndürdü"); }

      if (res.status === 409 && data.existingSlug) {
        // Araç zaten aktif katalogda — sessizce yönlendirmek yerine kartı
        // göster, kullanıcı "yorum yaz" mı "yine de öner" mi seçsin.
        const fromServer: ExistingVehicleMatch[] =
          Array.isArray(data.matches) && data.matches.length > 0
            ? (data.matches as ExistingVehicleMatch[])
            : [{
                slug: String(data.existingSlug),
                name: typeof data.existingName === "string"
                  ? data.existingName
                  : `${brandName} ${modelName}`,
                year: null,
                trimName: null,
                transmission: null,
                fuelType: null,
                reviewCount: typeof data.reviewCount === "number" ? data.reviewCount : 0,
              }];
        setExistingMatches(fromServer);
        setExistingKey(`${brandName}|${modelName}`);
        setSubmitting(false);
        setError(null);
        requestAnimationFrame(() =>
          existingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
        return;
      }
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Bir hata oluştu");

      // Başarı — yorum formuna yönlendir
      router.push(`/yorum-yaz?arac=${data.slug}&yeni=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        <h1 className="sr-only">Araç Öner</h1>
        Yükleniyor...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-20 flex justify-center px-4 bg-gray-50">
        <div className="w-full max-w-[480px] bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Araç Öner
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            Listede olmayan bir aracı önerin, deneyiminizi paylaşın.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Devam etmek için bir fikape hesabına ihtiyacın var.
          </p>
          <div className="flex gap-2">
            <Link href="/giris?callbackUrl=/oner" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center" style={{ background: "#111" }}>
              Giriş yap
            </Link>
            <Link href="/kayit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 text-center border border-gray-200 hover:bg-gray-50 transition-colors">
              Kayıt ol →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // "Bu araç zaten fikape'de" kartında kullanıcının şu an seçtiği yılla hiçbir
  // eşleşme aynı yılda değilse bunu ayrıca belirtiyoruz — marka+model eşleşmesi
  // yıldan bağımsız olduğu için (bkz. findExistingVehicles), kart tek başına
  // "aynı araç mı değil mi" sorusuna cevap vermeyebilir.
  const secilenYil = katalogModu ? katalogSecim?.year || "" : year;
  const secilenYilEslesiyor = !secilenYil || existingMatches.some((mm) => String(mm.year ?? "") === secilenYil);

  // Formdaki GÜNCEL seçimin donanım/yakıt/vites'i — handleSubmit'teki gönderi
  // gövdesiyle AYNI hesap (sunucudaki birebirAyniArac ile birebir aynı mantık).
  // Butonu anlık aktif/pasif yapmak için kullanılıyor: kullanıcı bir alanı
  // değiştirip artık tam eşleşme kalmayınca buton tekrar submit'e izin verir,
  // sunucuya hiç gitmeden (bkz. kullanıcı önerisi, 2026-09-28).
  const secilenTrimName = katalogModu
    ? katalogSecim?.trimName ?? ""
    : [
        versionForTrimName(isOtherVersion ? customVersion.trim() : selectedVersion === VERSIYON_YOK ? "" : selectedVersion, categorySlug),
        isOtherTrim ? customTrim.trim() : selectedTrim === PAKET_YOK ? "" : selectedTrim,
      ].filter(Boolean).join(" – ") || "";
  const secilenYakit = katalogModu ? katalogSecim?.fuelType ?? "" : fuelType;
  const secilenVites = katalogModu ? katalogSecim?.transmission ?? "" : transmission;
  const birebirAyniKayit = existingMatches.find((mm) =>
    birebirAyniArac(mm, {
      year: secilenYil ? Number(secilenYil) : null,
      trimName: secilenTrimName || null,
      fuelType: secilenYakit || null,
      transmission: secilenVites || null,
    }),
  );

  const fuelOptions = FUEL_TYPES[categorySlug] ?? [];
  const transmissionOptions = TRANSMISSIONS[categorySlug] ?? [];
  const modelYearRange = !isOtherModel ? getModelYearRange(selectedModel) : null;
  const availableYears = modelYearRange
    ? Array.from({ length: modelYearRange[1] - modelYearRange[0] + 1 }, (_, i) => modelYearRange[1] - i)
    : yilListesi(categorySlug);

  return (
    <div className="max-w-[480px] mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Araç Öner</h1>
        <p className="text-sm text-gray-500">Listede olmayan bir aracı önerin.</p>
      </div>

      {/* Bilgi notu */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700 leading-relaxed space-y-1">
        <p>
          <span className="font-semibold">Önce{" "}
            <Link href="/araclar" className="underline hover:text-blue-900">araçlarda arayın</Link>
          </span>{" "}— aracınız zaten ekli olabilir.
        </p>
        <p>
          Eklediğiniz araç için sonrasında yorum da yazabilirsiniz — zorunlu değil. Moderatörümüz inceleyip onaylar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Araç Tipi */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Araç Tipi <span className="text-red-500">*</span>
          </label>
          <select
            value={categorySlug}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            <option value="">— Araç tipi seçin —</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {katalogModu && (
          <KatalogAracSecimi
            key={categorySlug}
            kategori={categorySlug}
            baslangicMarka={prefill.categorySlug === categorySlug ? prefill.selectedMake : ""}
            baslangicModel={prefill.categorySlug === categorySlug ? prefill.selectedModel : ""}
            baslangicOzelModel={prefill.categorySlug === categorySlug ? prefill.customModel : ""}
            onChange={setKatalogSecim}
          />
        )}

        {/* Marka */}
        {categorySlug && !katalogModu && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Marka <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedMake}
            onChange={(e) => handleMakeChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            <option value="">— Marka seçin —</option>
            {makes.map((m) => (
              <option key={m.make} value={m.make}>{m.make}</option>
            ))}
          </select>
          {isOtherMake && (
            <input
              type="text"
              value={customMake}
              onChange={(e) => setCustomMake(e.target.value)}
              placeholder="Marka adını yazınız"
              className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              autoFocus
            />
          )}
        </div>
        )}

        {/* Model */}
        {!katalogModu && selectedMake && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">— Model seçin —</option>
              {models.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
            {isOtherModel && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="Model adını yazınız"
                className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                autoFocus
              />
            )}
          </div>
        )}

        {/* Bu araç zaten katalogda — yeniden eklemeye gerek yok */}
        {existingMatches.length > 0 && (
          <div ref={existingCardRef} className="rounded-2xl border border-green-200 bg-green-50 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-600 shrink-0 mt-0.5" aria-hidden="true">
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="m8 12 2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-green-900">Bu araç zaten fikape&apos;de</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Bu marka ve modelde kayıtlı araçlar bulundu. Yıl, donanım paketi, yakıt türü ve
                  vites sizinkiyle birebir aynıysa aracınız tekrar eklenemez; bunlardan biri bile
                  farklıysa yeni bir kayıt olarak eklenir.
                </p>
                {birebirAyniKayit ? (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mt-1.5 font-medium">
                    Bu araç (aynı yıl, donanım, yakıt ve vites) zaten kayıtlı — aşağıdan var olan kayda gidip yorum yazabilirsiniz.
                  </p>
                ) : (
                  !secilenYilEslesiyor && (
                    <p className="text-xs text-green-700/80 mt-1.5">
                      Seçtiğiniz {secilenYil} model yılına ait bir kayıt yok — aracınız yeni bir kayıt olarak eklenecektir.
                    </p>
                  )
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              {existingMatches.slice(0, 4).map((mm) => {
                const tamEslesme = birebirAyniKayit?.slug === mm.slug;
                const ayni = !tamEslesme && secilenYil && String(mm.year ?? "") === secilenYil;
                return (
                  <div
                    key={mm.slug}
                    className={`rounded-xl bg-white border px-3 py-2.5 ${
                      tamEslesme ? "border-amber-300 ring-1 ring-amber-200" : ayni ? "border-green-300 ring-1 ring-green-200" : "border-green-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 leading-snug">{mm.name}</p>
                      {tamEslesme ? (
                        <span className="shrink-0 text-[10px] font-semibold text-amber-800 bg-amber-100 rounded-full px-2 py-0.5">
                          Sizin aracınız bu
                        </span>
                      ) : ayni && (
                        <span className="shrink-0 text-[10px] font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                          Aynı yıl
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {mm.year && (
                        <span className="text-[11px] text-gray-600 bg-gray-100 rounded-md px-1.5 py-0.5">{mm.year}</span>
                      )}
                      {mm.trimName && (
                        <span className="text-[11px] text-gray-600 bg-gray-100 rounded-md px-1.5 py-0.5">{mm.trimName}</span>
                      )}
                      {mm.fuelType && (
                        <span className="text-[11px] text-gray-600 bg-gray-100 rounded-md px-1.5 py-0.5">
                          {FUEL_LABEL[mm.fuelType] ?? mm.fuelType}
                        </span>
                      )}
                      {mm.transmission && (
                        <span className="text-[11px] text-gray-600 bg-gray-100 rounded-md px-1.5 py-0.5">{mm.transmission}</span>
                      )}
                      <span className="text-[11px] text-gray-400 ml-auto">
                        {mm.reviewCount > 0 ? `${mm.reviewCount} yorum` : "Henüz yorum yok"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        href={`/araclar/${mm.slug}`}
                        className="text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1"
                      >
                        Aç
                      </Link>
                      <Link
                        href={`/yorum-yaz?arac=${mm.slug}`}
                        className="text-xs font-semibold text-white rounded-lg px-3 py-1.5 ml-auto"
                        style={{ background: "#111" }}
                      >
                        Yorum yaz →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Versiyon */}
        {/* "Standart": katalogda kayıtlı sürüm yoksa/biliniyorsa seçilebilir, araç adına yazılmaz (secilenTrimName süzer).
            Böylece sürümü olmayan modellerde (e-bisiklet/e-scooter/karavanın çoğu) Versiyon/Donanım boş kalmaz. */}
        {!katalogModu && selectedModel && !isOtherModel && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Versiyon</label>
            <select
              value={selectedVersion}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedVersion(val); setCustomVersion(""); setSelectedTrim(""); setCustomTrim("");
                if (val && val !== "Diğer") {
                  const detected = detectFuelType(val);
                  if (detected && fuelOptions.some((f) => f.value === detected)) {
                    setFuelType(detected);
                  }
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">— Seçin (opsiyonel) —</option>
              <option value={VERSIYON_YOK}>{VERSIYON_YOK}</option>
              {versions.filter((v) => v !== "Diğer" && v !== VERSIYON_YOK).map((v) => <option key={v} value={v}>{formatVersionLabel(v, categorySlug)}</option>)}
              <option value="Diğer">Diğer (listede yok)</option>
            </select>
            {isOtherVersion && (
              <input type="text" value={customVersion} onChange={(e) => setCustomVersion(e.target.value)}
                placeholder="Versiyon bilgisi yazınız"
                className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" autoFocus />
            )}
          </div>
        )}

        {/* Donanım */}
        {!katalogModu && selectedModel && !isOtherModel && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Donanım Paketi</label>
            <select
              value={selectedTrim}
              onChange={(e) => { setSelectedTrim(e.target.value); setCustomTrim(""); }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">— Seçin (opsiyonel) —</option>
              <option value={PAKET_YOK}>{PAKET_YOK}</option>
              {trims.filter((t) => t !== "Diğer" && t !== PAKET_YOK).map((t) => <option key={t} value={t}>{t}</option>)}
              <option value="Diğer">Diğer (listede yok)</option>
            </select>
            {isOtherTrim && (
              <input type="text" value={customTrim} onChange={(e) => setCustomTrim(e.target.value)}
                placeholder="Donanım paketi yazınız"
                className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" autoFocus />
            )}
          </div>
        )}

        {/* Yıl & Yakıt & Vites */}
        {categorySlug && !katalogModu && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Yıl</label>
            <select value={yearDiger ? "__diger_yil" : year}
              onChange={(e) => {
                if (e.target.value === "__diger_yil") { setYearDiger(true); setYear(ekYilGecerli(Number(customYear)) ? customYear : ""); }
                else { setYearDiger(false); setCustomYear(""); setYear(e.target.value); }
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white">
              <option value="">— Seçin —</option>
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
              <option value="__diger_yil">Diğer (listede yok)</option>
            </select>
            {yearDiger && (
              <>
                <input type="text" inputMode="numeric" maxLength={4} aria-label="Model yılı" value={customYear}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setCustomYear(v);
                    setYear(ekYilGecerli(Number(v)) ? v : "");
                  }}
                  placeholder="Model yılını yazınız" autoFocus
                  className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
                {customYear.length === 4 && !ekYilGecerli(Number(customYear)) && (
                  <p className="mt-1 text-xs text-red-600">Geçerli bir yıl giriniz (1900 – {new Date().getFullYear() + 1}).</p>
                )}
              </>
            )}
          </div>
          {fuelOptions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Yakıt Tipi</label>
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white">
                <option value="">— Seçin —</option>
                {fuelOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          )}
          {transmissionOptions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Vites Tipi</label>
              <select value={transmission} onChange={(e) => setTransmission(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white">
                <option value="">— Seçin —</option>
                {transmissionOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          )}
        </div>
        )}

        {/* Not */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Ek Bilgi <span className="text-gray-400 font-normal">(opsiyonel)</span>
          </label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            maxLength={500} rows={2}
            placeholder="Araç hakkında eklemek istediğiniz bilgiler..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-0.5">{notes.length}/500</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Tam eşleşme varken (birebirAyniKayit) buton devre dışı — kullanıcı
            bir alanı değiştirip eşleşme kalkınca sunucuya hiç gitmeden tekrar
            aktifleşir (bkz. kullanıcı önerisi, 2026-09-28). Yalnız benzer
            (marka+model) ama tam eşleşmeyen kayıt varken buton normal çalışır
            — özel bir "yine de öner" etiketine gerek yok, sunucu zaten kendi
            karşılaştırmasını yapıyor (route.ts). */}
        <button
          type="submit"
          disabled={submitting || !!birebirAyniKayit}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
          style={{ background: "#111" }}
        >
          {submitting ? "Oluşturuluyor..." : birebirAyniKayit ? "Bu araç zaten kayıtlı" : "Aracı Öner"}
        </button>

        <p className="text-center text-xs text-gray-400">
          Araç eklendikten sonra dilerseniz deneyiminizi de paylaşabilirsiniz — yorum yazmak zorunlu değil.
        </p>
      </form>
    </div>
  );
}
