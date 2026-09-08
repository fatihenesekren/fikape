import vehiclesData from "@/data/vehicles.json";

// /arama "eşleşme yok" akışından /oner'e taşınan ham arama sorgusunu forma
// akıllıca çözer. Sorgu bir marka OLMAYABİLİR ("clio" model, "dodge polo"
// kombo, "chery" katalogda yok) — bu yüzden kataloğa (vehicles.json) karşı
// eşlenir. Saf fonksiyon: search string alır, form ön-dolum nesnesi döner.

export type OnerCategoryKey = keyof typeof vehiclesData;

export interface OnerPrefill {
  categorySlug: OnerCategoryKey;
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
    categorySlug: "otomobil",
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
  // 4) Hiç eşleşme yok — tek kelimeyse muhtemel marka (custom make),
  //    değilse serbest metni nota ipucu olarak bırak.
  if (/^[\p{L}\d-]{1,24}$/u.test(q)) return { ...base, selectedMake: "Diğer / Bulamadım", customMake: q };
  return { ...base, notes: `Aramada arandı: ${q}` };
}
