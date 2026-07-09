import { stripModelGenRange } from "@/lib/modelDisplay";

// Wikipedia API etiket kuralı: tanımlayıcı bir User-Agent olmadan yapılan
// istekler ardışık kullanımda hızla rate-limit'e takılıyor ("You are making
// too many requests"), JSON olmayan yanıt döndürüp sessizce null'a düşüyor.
export const WIKI_HEADERS = { "User-Agent": "fikape.com/1.0 (https://fikape.com; info@fikape.com)" };

// Model slug prefix → Wikipedia sayfa adı eşleşmesi
const WIKI_PAGE: Record<string, string> = {
  "togg-t10x":     "Togg_T10X",
  "togg-t10f":     "Togg_T10F",
  "tesla-model-y": "Tesla_Model_Y",
  "fiat-egea":     "Fiat_Egea",
  "renault-clio":  "Renault_Clio",
  "dacia-duster":  "Dacia_Duster",
};

function wikiPageFor(slug: string): string | undefined {
  return Object.entries(WIKI_PAGE).find(([prefix]) => slug.startsWith(prefix))?.[1];
}

export async function getVehicleImageUrl(slug: string): Promise<string | null> {
  const page = wikiPageFor(slug);
  if (!page) return null;

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${page}`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(3000), headers: WIKI_HEADERS }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail?: { source: string } };
    const src = data.thumbnail?.source;
    if (!src) return null;
    return src;
  } catch {
    return null;
  }
}

// Birden fazla araç için paralel çekme
export async function getVehicleImageUrls(
  slugs: string[]
): Promise<Record<string, string | null>> {
  const results = await Promise.all(
    slugs.map(async (slug) => [slug, await getVehicleImageUrl(slug)] as const)
  );
  return Object.fromEntries(results);
}

// Marka+model adıyla Wikipedia'da arama yapıp kapak görselini bulur (statik
// WIKI_PAGE eşlemesine bağlı değil) — öneri onayı ve toplu zenginleştirme
// script'i tarafından kullanılır.
export async function searchWikipediaImage(
  brand: string, model: string, year: number | null
): Promise<string | null> {
  try {
    const query = `${brand} ${stripModelGenRange(model)}${year ? ` ${year}` : ""} automobile`;
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`,
      { signal: AbortSignal.timeout(4000), headers: WIKI_HEADERS }
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const title: string | undefined = searchData.query?.search?.[0]?.title;
    if (!title) return null;
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { signal: AbortSignal.timeout(4000), headers: WIKI_HEADERS }
    );
    if (!summaryRes.ok) return null;
    const summaryData = await summaryRes.json();
    return summaryData.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}
