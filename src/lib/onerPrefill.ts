import vehiclesData from "@/data/vehicles.json";

// /arama "eşleşme yok" akışından /oner'e taşınan ham arama sorgusunu forma
// çözer. YALNIZCA sorgu kataloğa (vehicles.json) gerçekten eşleşiyorsa
// ön-doldurur — bilinen bir marka ("dacia"), bir model ("clio"), ya da
// "bilinen-marka + varyant" ("dacia sandero"). Bu, "kayıtlı bir aracın
// farklı versiyon/nesil durumu" senaryosu için mantıklı.
// Sorgu tanınmıyorsa ("lada" katalogda yok, "sdfg" anlamsız) HİÇBİR ŞEY
// doldurulmaz — form boş açılır; kategori bile tahmin edilmez (bkz.
// kullanıcı geri bildirimi). Saf fonksiyon: search string alır.

export type OnerCategoryKey = keyof typeof vehiclesData;

export interface OnerPrefill {
  // "" = kategori tahmin edilmedi (form "— Araç tipi seçin —" ile açılır).
  // Sadece katalog eşleşmesinde (case 1/2/3) gerçek kategori set edilir.
  categorySlug: OnerCategoryKey | "";
  selectedMake: string;
  customMake: string;
  selectedModel: string;
  customModel: string;
  notes: string;
}

// Aksan/büyük-küçük duyarsız — /arama, /takas, /araclar ile aynı mantık.
const DIACRITIC_MARKS_RE = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (s: string) =>
  s.toLowerCase().replace(/ı/g, "i").normalize("NFD").replace(DIACRITIC_MARKS_RE, "").trim();

export function resolveOnerPrefill(search: string): OnerPrefill {
  const base: OnerPrefill = {
    categorySlug: "",
    selectedMake: "", customMake: "",
    selectedModel: "", customModel: "", notes: "",
  };

  const params = new URLSearchParams(search || "");
  const raw = (params.get("q") ?? params.get("brandName") ?? "").trim();
  if (!raw) return base;

  const q = raw.slice(0, 60);
  const nq = norm(q);
  const cats = Object.entries(vehiclesData) as [OnerCategoryKey, (typeof vehiclesData)[OnerCategoryKey]][];

  // 1) Tam marka eşleşmesi (herhangi bir kategoride)
  for (const [cat, makesList] of cats) {
    const m = makesList.find((x) => norm(x.make) === nq);
    if (m) return { ...base, categorySlug: cat, selectedMake: m.make };
  }
  // 2) Model eşleşmesi — tam ad ya da sorgu, model adının bir parçası
  //    ("clio" -> "Clio 5 (2019-)"). Sorgu >= 3 karakter olmalı; kısa/tek
  //    harfli model adlarının ("Honda e") her sorguyla eşleşmesini önler.
  //    Ters yön (model adı sorgunun içinde) BİLİNÇLİ olarak yok — "chery
  //    tiggo" gibi bilinmeyen sorgular yanlışlıkla eşleşmesin.
  //    Nesil belirsizse (aynı markada birden çok eşleşme, ör. "clio" -> Clio
  //    2/3/4/5) MODEL BOŞ bırakılır, sadece marka+kategori; kullanıcı nesli
  //    kendisi seçsin (bkz. kullanıcı kararı).
  for (const [cat, makesList] of cats) {
    for (const mk of makesList) {
      const matches = mk.models.filter(
        (x) => norm(x.name) === nq || (nq.length >= 3 && norm(x.name).includes(nq)),
      );
      if (matches.length === 0) continue;
      const exact = matches.find((x) => norm(x.name) === nq);
      const only = matches.length === 1 ? matches[0] : undefined;
      return {
        ...base,
        categorySlug: cat,
        selectedMake: mk.make,
        selectedModel: (exact ?? only)?.name ?? "",
      };
    }
  }
  // 3) "marka model" kombosu — ilk kelime bilinen bir marka
  const [first, ...rest] = q.split(/\s+/);
  if (rest.length) {
    for (const [cat, makesList] of cats) {
      const m = makesList.find((x) => norm(x.make) === norm(first));
      if (m) {
        return { ...base, categorySlug: cat, selectedMake: m.make, selectedModel: "Diğer", customModel: rest.join(" ") };
      }
    }
  }
  // 4) Katalogda hiç eşleşme yok — ön-doldurma YAPMA. Sorgu bir marka bile
  //    olmayabilir ("lada" katalogda yok, "sdfg" anlamsız); yanlış tahmin
  //    (kategori=otomobil + customMake) kullanıcıya değer katmıyordu, sadece
  //    düzeltmesi gereken bir şey ekliyordu (bkz. kullanıcı geri bildirimi).
  return base;
}
