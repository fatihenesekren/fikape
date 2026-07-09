// Doğrulanmış (üretici + üretim yılı örtüşmesi kontrol edilmiş) Wikipedia
// sayfası bulucu. wikidataImage.ts (görsel) ve vehicleSpecs.ts (teknik
// özellik) tarafından ortak kullanılır.
//
// Eski yöntem (Wikipedia düz metin araması) marka/model doğrulaması yapmadan
// ilk sonucu alıyordu — yanlış marka/nesil eşleşmelerine yol açıyordu.
// wikidataImage.ts'deki wbsearchentities tabanlı yöntem bunu üretici (P176)
// kontrolüyle düzeltti ama fuzzy metin araması en fazla 5 aday döndürüyor ve
// çoğu zaman doğru nesil-özel Wikidata kaydını (ör. "Toyota Corolla (E210)")
// bulamıyor, genel nameplate-şemsiye sayfasına (ör. "Toyota Corolla",
// 1966'dan bugüne) düşüyordu.
//
// Bu modül SPARQL ile "üretici=X" olan TÜM adayları çeker (çok daha geniş
// kapsam), her adayın Wikipedia infobox'ındaki GERÇEK üretim yılını okur ve
// hedef nesil aralığıyla örtüşmeyi puanlar. Adayın kendi üretim aralığı
// hedeften çok daha genişse (nesil-özel değil, nameplate'in TÜM tarihini
// kapsayan şemsiye madde) REDDEDİLİR — yanlış nesil verisi vermektense boş
// döner (ör. Renault Clio, Dacia Duster gibi markalarda Wikidata'da ayrı
// nesil kaydı yok, sadece 1990-2026 gibi devasa bir şemsiye kayıt var).

const WD_HEADERS = { "User-Agent": "fikape.com/1.0 (https://fikape.com; info@fikape.com)" };

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "").replace(/[^a-z0-9]/g, "");
}

function stripHtml(s: string) {
  return s.replace(/&#160;|&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const GEN_RANGE_RE = /\((\d{4})\s*[-–—]\s*(\d{4})?\)\s*$/;

async function findBrandQid(brand: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(brand)}&language=en&type=item&limit=8&format=json`,
      { signal: AbortSignal.timeout(5000), headers: WD_HEADERS }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const brandN = normalize(brand);
    const results = (data.search ?? []) as { id: string; label: string; description?: string }[];
    const hit = results.find((r) =>
      normalize(r.label) === brandN && /manufactur|automot|automobile|car brand|vehicle brand/i.test(r.description ?? "")
    );
    return hit?.id ?? results[0]?.id ?? null;
  } catch { return null; }
}

interface SparqlCandidate { id: string; label: string; articleTitle: string | null; }

async function sparqlCandidates(brandQid: string, modelFirstWord: string): Promise<SparqlCandidate[]> {
  const safe = modelFirstWord.toLowerCase().replace(/["\\]/g, "");
  const query = `
    SELECT ?item ?itemLabel ?article WHERE {
      ?item wdt:P176 wd:${brandQid} .
      ?item rdfs:label ?label .
      FILTER(CONTAINS(LCASE(?label), "${safe}"))
      FILTER(LANG(?label) = "en")
      OPTIONAL {
        ?article schema:about ?item ;
                 schema:isPartOf <https://en.wikipedia.org/> .
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 40
  `;
  try {
    const res = await fetch(
      `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(15000), headers: { ...WD_HEADERS, Accept: "application/sparql-results+json" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    type Binding = { item: { value: string }; itemLabel: { value: string }; article?: { value: string } };
    return ((data.results?.bindings ?? []) as Binding[]).map((b) => ({
      id: b.item.value.split("/").pop() ?? "",
      label: b.itemLabel.value,
      articleTitle: b.article?.value
        ? decodeURIComponent(b.article.value.split("/wiki/")[1] ?? "").replace(/_/g, " ")
        : null,
    }));
  } catch { return []; }
}

async function getProductionRange(title: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&section=0&format=json&origin=*`,
      { signal: AbortSignal.timeout(8000), headers: WD_HEADERS }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const html = data.parse?.text?.["*"] ?? "";
    const m = html.match(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
    if (!m) return null;
    const rows = [...m[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    for (const row of rows) {
      const th = stripHtml(row[1].match(/<th[^>]*>([\s\S]*?)<\/th>/i)?.[1] ?? "").toLowerCase();
      const td = stripHtml(row[1].match(/<td[^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? "");
      if (th.includes("production") || th.includes("model years")) {
        const years = [...td.matchAll(/(\d{4})/g)].map((x) => parseInt(x[1], 10));
        if (years.length > 0) {
          const end = td.toLowerCase().includes("present") ? new Date().getFullYear() : Math.max(...years);
          return [Math.min(...years), end];
        }
      }
    }
    return null;
  } catch { return null; }
}

function overlapYears(a: [number, number], b: [number, number]): number {
  return Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]) + 1);
}

// Aynı nameplate altında farklı GÖVDE TİPİ/alt-model olan kardeş araçlar
// (ör. "Volkswagen Golf Sportsvan" ≠ "Volkswagen Golf 7" hatchback) —
// hedef model adında bu kelimelerden biri geçmiyorsa, etiketinde geçen
// adaylar elenir. Aksi halde "Golf" araması Sportsvan/Plus/Alltrack gibi
// tamamen farklı bir aracı "en iyi eşleşme" diye seçebiliyordu.
const SUBMODEL_MARKERS = [
  "sportsvan", "plus", "cross", "estate", "kombi", "cabrio", "cabriolet",
  "wagon", "touring", "gt", "gti", "gte", "alltrack", "variant", "van",
  "coupe", "coupé", "roadster", "spider", "sw", "break", "shooting brake",
  "allroad", "avant", "touran",
];

function hasUnwantedSubmodelMarker(candidateLabel: string, targetModel: string): boolean {
  const labelN = normalize(candidateLabel);
  const targetN = normalize(targetModel);
  return SUBMODEL_MARKERS.some((marker) => {
    const markerN = normalize(marker);
    return labelN.includes(markerN) && !targetN.includes(markerN);
  });
}

export interface VerifiedVehiclePage {
  title: string;
  productionRange: [number, number] | null;
}

export async function findVerifiedWikipediaPage(
  brand: string, model: string, year: number | null
): Promise<VerifiedVehiclePage | null> {
  const modelBase = model.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const modelFirstWord = modelBase.split(" ")[0] ?? modelBase;
  const genMatch = model.match(GEN_RANGE_RE);
  const targetRange: [number, number] | null = genMatch
    ? [parseInt(genMatch[1], 10), genMatch[2] ? parseInt(genMatch[2], 10) : new Date().getFullYear()]
    : (year != null ? [year, year] : null);

  const brandQid = await findBrandQid(brand);
  if (!brandQid) return null;

  const candidates = (await sparqlCandidates(brandQid, modelFirstWord))
    .filter((c) => c.articleTitle)
    .filter((c) => !hasUnwantedSubmodelMarker(c.label, modelBase));
  if (candidates.length === 0) return null;

  if (!targetRange) {
    // Hedef yıl aralığı yoksa: tek aday varsa kabul et, birden fazlaysa
    // belirsizlik var demektir, tahmin etmeden reddet.
    if (candidates.length !== 1) return null;
    return { title: candidates[0].articleTitle!, productionRange: null };
  }

  const targetWidth = targetRange[1] - targetRange[0] + 1;
  const maxAllowedWidth = Math.max(targetWidth * 2.5, 20);

  let best: { title: string; range: [number, number]; score: number } | null = null;
  for (const c of candidates) {
    const range = await getProductionRange(c.articleTitle!);
    if (!range) continue;
    const width = range[1] - range[0] + 1;
    if (width > maxAllowedWidth) continue; // şemsiye madde — nesil-özel değil, ele
    const score = overlapYears(targetRange, range);
    if (score > 0 && (!best || score > best.score)) {
      best = { title: c.articleTitle!, range, score };
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!best) return null;
  return { title: best.title, productionRange: best.range };
}
